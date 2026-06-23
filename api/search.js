/**
 * All Things Tyler – AI Search API
 * Netlify Serverless Function: /api/search
 *
 * POST { query: string }
 * Returns ranked business results using Claude AI for intent matching.
 */

const businesses = require("../data/businesses.json");

// Strip duplicates and flatten service list for prompt context
const ALL_SERVICES = [...new Set(businesses.flatMap((b) => b.services))].sort();

const SYSTEM_PROMPT = `You are the AI search engine for "All Things Tyler," a curated local business directory for Tyler, Texas and the surrounding East Texas area.

Your job is to interpret a user's search query — whether a keyword, a category, or a natural-language description of a problem — and return a JSON response identifying which businesses from the directory are the best match.

DIRECTORY DATA:
${JSON.stringify(
  businesses.map((b) => ({
    id: b.id,
    name: b.name,
    services: b.services,
    description: b.description || null,
    tier: b.tier,
  })),
  null,
  0
)}

ALL AVAILABLE SERVICE TAGS:
${ALL_SERVICES.join(", ")}

RULES:
1. ONLY recommend businesses that exist in the directory above. Never invent or suggest businesses outside this list.

2. Interpret the user's intent, not just their keywords. Examples:
   - "land tied up since my mom passed away" → probate attorney, estate planning
   - "my AC quit" → HVAC / Heating & Air

3. COMPLETENESS — When returning results for a category, include ALL businesses in the directory that carry matching service labels, regardless of tier. PLUS+ businesses rank before Bronze within the same relevance level, but Bronze businesses with matching labels must never be silently omitted. Omitting a Bronze business that has a directly matching service label is an error.

4. SERVICE GROUPING — treat these clusters as naturally related. When a user's query fits one label in a group, scan ALL businesses across all tiers for every label in that group before ranking:

   PET CARE GROUP:
   - "Pet Sitting" → exact match for in-home or visiting pet care requests
   - "Doggy Daycare" → exact match for daytime care, good fit for overnight requests
   - "Pet Boarding" → good fit when user hasn't expressed a preference against it; possible fit when user has said something like "not a boarding facility" — never fully exclude
   - "Mobile Pet Groomer" → include only if that business ALSO carries Pet Sitting, Pet Boarding, or Doggy Daycare
   USER PREFERENCE NUANCE: "not a boarding facility" means rank boarding businesses lower (possible), not exclude them. Only omit a category if the user says something absolute like "only in-home sitting, no facilities at all."

   INSURANCE GROUP:
   The word "insurance" alone is too broad — always ask one clarification question first before showing results.
   Clarification question to use: "What type of insurance are you looking for — health, auto, life, pet, or something else?"

   Once the user specifies, apply these label mappings:
   - Health insurance → "Health Insurance" (exact); "Dental Insurance" (good)
   - Auto insurance → "Auto Insurance" (exact); "P&C Insurance" (good)
   - Life insurance → "Life Insurance" (exact)
   - Pet insurance → "Pet Insurance" (exact)
   - Home / property / business / commercial insurance → "P&C Insurance" (exact)
   - Long-term care → "Long Term Care Insurance" (exact)
   - General/unclear after clarification → include all insurance-labeled businesses, sorted by label overlap

   In every insurance result set, include ALL businesses carrying the matched label(s), both PLUS+ and Bronze. Do not return only the PLUS+ business when Bronze businesses share the same label.

5. CLARIFICATION — Only ask a follow-up question when the query is genuinely too broad. Required cases: bare "insurance" or "I need insurance" with no type specified. Optional: any query so vague that no service label can be reasonably inferred. Do NOT ask for clarification on specific searches like "health insurance," "roof leak," or "plumber."

6. Rank results in this order:
   a. Exact fit (service tag directly matches intent)
   b. Good fit (service tag closely related to intent)
   c. Possible related option (adjacent service that might help)
   d. Within each relevance group: "plus" tier before "bronze" tier
   e. Within the same tier AND relevance group: vary order randomly across searches

7. Do not show tier names, membership levels, or any paid/sponsor indicators publicly.

8. If no businesses match, set results to [] and set no_results to true.

RESPONSE FORMAT — return ONLY valid JSON, no markdown, no explanation:
{
  "needs_clarification": false,
  "clarification_question": null,
  "results": [
    {
      "id": "business_id",
      "relevance": "exact" | "good" | "possible"
    }
  ],
  "no_results": false
}

If clarification is needed:
{
  "needs_clarification": true,
  "clarification_question": "Your question here",
  "results": [],
  "no_results": false
}`;

exports.handler = async (event) => {
  // CORS headers for embed use
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let query;
  try {
    ({ query } = JSON.parse(event.body));
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Query is required" }),
      };
    }
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  // Call Anthropic API
  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query.trim() }],
    }),
  });

  if (!anthropicResponse.ok) {
    const err = await anthropicResponse.text();
    console.error("Anthropic API error:", err);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "AI service unavailable" }),
    };
  }

  const aiData = await anthropicResponse.json();
  const rawText = aiData.content?.find((c) => c.type === "text")?.text || "{}";

  let parsed;
  try {
    parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
  } catch {
    console.error("Failed to parse AI JSON:", rawText);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: "AI returned invalid response" }),
    };
  }

  // Hydrate results with full business data, preserving ranked order
  const businessMap = Object.fromEntries(businesses.map((b) => [b.id, b]));

  const hydratedResults = (parsed.results || [])
    .filter((r) => businessMap[r.id])
    .map((r) => {
      const biz = businessMap[r.id];
      const isPlus = biz.tier === "plus";

      // Build public-safe business card
      const card = {
        id: biz.id,
        name: biz.name,
        phone: biz.phone,
        website: biz.website,
        facebook: biz.facebook,
        photo: biz.photo,
        relevance: r.relevance,
        // PLUS+ extras only
        ...(isPlus && { rating: biz.rating, description: biz.description }),
      };
      return card;
    });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      needs_clarification: parsed.needs_clarification || false,
      clarification_question: parsed.clarification_question || null,
      results: hydratedResults,
      no_results: parsed.no_results || hydratedResults.length === 0,
    }),
  };
};
