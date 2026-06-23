/**
 * All Things Tyler – Step 6: AI Presenter
 *
 * The AI's ONLY job here is presentation — not selection, not ranking.
 * It receives an already-ranked candidate list and:
 *   - Generates a short specialization line per business
 *   - Provides a brief natural intro when helpful
 *   - Asks clarifying questions only when instructed
 *
 * The AI cannot add, remove, or reorder businesses.
 * All ranking decisions are final before this step runs.
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

// Build the minimal prompt for the presenter
function buildPresenterPrompt(intent, query, ranked) {
  const businessList = [
    ...ranked.featured.map(b => ({ id: b.id, name: b.name, services: b.services, description: b.description || null, group: "featured" })),
    ...ranked.primary.map(b => ({ id: b.id, name: b.name, services: b.services, description: b.description || null, group: "primary" })),
    ...ranked.other.map(b => ({ id: b.id, name: b.name, services: b.services, description: b.description || null, group: "other" })),
  ];

  return {
    system: `You are the presentation layer for the All Things Tyler local business directory in Tyler, Texas.

The search engine and ranking engine have already selected and ordered these businesses. You cannot change the list or the order.

Your only job is to write a short "specialization line" for each business — a customer-friendly 1-line description of why this business appeared for this specific search.

Rules:
- Draw from the business's service tags and description only
- Pick the 2–4 tags most relevant to THIS search
- Format: "Specializes in: Tag One • Tag Two • Tag Three"
- Never use technical language or AI explanations
- Never mention membership tier, Bronze, PLUS+, or ranking
- If a business name already makes its specialty obvious, the line can be shorter
- Do not invent services the business doesn't have

Return ONLY valid JSON — no markdown, no explanation:
{
  "specializations": {
    "business_id": "Specializes in: Tag • Tag",
    "business_id": "Specializes in: Tag • Tag"
  }
}`,
    user: `Search: "${query}"
Intent: ${intent}

Businesses to label:
${JSON.stringify(businessList, null, 2)}`,
  };
}

async function generateSpecializations(intent, query, ranked, apiKey) {
  const total = ranked.featured.length + ranked.primary.length + ranked.other.length;
  if (total === 0) return {};

  const { system, user } = buildPresenterPrompt(intent, query, ranked);

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      console.error("Presenter API error:", response.status);
      return {};
    }

    const data = await response.json();
    const raw = data.content?.find(c => c.type === "text")?.text || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return parsed.specializations || {};
  } catch (err) {
    console.error("Presenter error:", err);
    return {}; // Graceful degradation — results still show, just without specialization lines
  }
}

module.exports = { generateSpecializations };
