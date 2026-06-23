/**
 * All Things Tyler – Simple Search API v1.0
 * Netlify Serverless Function: /api/search-simple
 *
 * Conservative label-based search with basic synonym mapping.
 * No heavy AI reasoning — matches businesses by labels, name, description.
 * Safe for production embedding.
 *
 * POST { query: string }
 */

const businesses = require("../data/businesses.json");

// ── Synonym / intent map ─────────────────────────────────────────────────────
// Maps common search terms to directory service label keywords
const SYNONYMS = {
  // Hair
  "hair": ["hair", "salon", "barber", "haircut", "hairstyl"],
  "haircut": ["haircut", "barber", "hair"],
  "salon": ["salon", "hair", "nail", "spa"],
  "barber": ["barber", "men's haircut", "beard"],
  // Home services
  "ac": ["hvac", "heating", "air condition", "cooling"],
  "air conditioning": ["hvac", "heating", "air condition", "cooling"],
  "hvac": ["hvac", "heating", "air condition"],
  "plumber": ["plumb"],
  "plumbing": ["plumb"],
  "roof": ["roof"],
  "roofing": ["roof"],
  "gutter": ["gutter"],
  "electrician": ["electric"],
  "electrical": ["electric"],
  "fence": ["fence"],
  "concrete": ["concrete"],
  "flooring": ["floor"],
  "painting": ["paint"],
  "pest": ["pest"],
  "lawn": ["lawn", "landscap"],
  "landscaping": ["landscap"],
  "pool": ["pool"],
  "pressure wash": ["pressure wash", "soft wash"],
  "pressure washing": ["pressure wash", "soft wash"],
  // Legal
  "lawyer": ["attorney", "law"],
  "attorney": ["attorney", "law"],
  "probate": ["probate", "estate"],
  "estate": ["estate planning", "probate", "wills"],
  "will": ["wills", "estate", "probate"],
  // Insurance
  "insurance": ["insurance"],
  "auto insurance": ["auto insurance"],
  "health insurance": ["health insurance"],
  "life insurance": ["life insurance"],
  // Real estate / housing
  "rent": ["rent", "property management", "apartment", "residential leas"],
  "rental": ["rent", "property management", "apartment"],
  "apartment": ["apartment"],
  "house for rent": ["house rental", "property management", "residential leas"],
  "property management": ["property management"],
  // Pet
  "pet": ["pet"],
  "dog": ["dog", "pet", "canine"],
  "cat": ["cat", "pet", "feline"],
  "vet": ["veterinar"],
  "veterinarian": ["veterinar"],
  "pet sitting": ["pet sitting", "pet sit"],
  "dog boarding": ["pet boarding", "dog"],
  "pet boarding": ["pet boarding"],
  // Food / restaurant
  "restaurant": ["restaurant", "food", "dining", "catering"],
  "food": ["food", "restaurant", "catering", "bakery"],
  "catering": ["cater"],
  "bakery": ["baker"],
  // Auto
  "car": ["auto", "car", "vehicle"],
  "auto repair": ["auto repair", "mechanic"],
  "mechanic": ["mechanic", "auto repair"],
  "tires": ["tire"],
  // Health / medical
  "chiropractor": ["chiropractic"],
  "dentist": ["dent"],
  "doctor": ["physician", "medical", "clinic"],
  "massage": ["massage"],
  "therapy": ["therapy", "therapist"],
  "mental health": ["mental health", "counseling", "therapy"],
  // Photography
  "photographer": ["photograph"],
  "photography": ["photograph"],
  // Finance
  "financial": ["financial", "wealth", "invest"],
  "accounting": ["account"],
  "bookkeeping": ["bookkeep", "account"],
  // Moving
  "moving": ["moving", "mov"],
  "mover": ["moving", "mov"],
  // Cleaning
  "cleaning": ["clean"],
  "house cleaning": ["house clean", "maid", "clean"],
  // Childcare
  "daycare": ["daycare", "child care", "childcare"],
  "childcare": ["child care", "daycare"],
};

// Categories that require clarification when searched alone
const CLARIFICATION_TRIGGERS = {
  "insurance": "What type of insurance are you looking for — health, auto, life, pet, or something else?",
  "attorney": "What type of attorney do you need — probate/estate, family law, real estate, criminal, or something else?",
  "lawyer": "What type of lawyer do you need — probate/estate, family law, real estate, criminal, or something else?",
};

// Beauty-adjacent tags that should NOT match a "hair" search
const HAIR_EXCLUSIONS = [
  "tattoo", "permanent makeup", "microblading", "spray tanning",
  "makeup artist", "body waxing", "esthetician", "skincare",
  "lash extension", "nail technician", "tanning"
];

function normalizeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return "https://" + trimmed;
}

function formatRating(raw) {
  if (!raw) return null;
  const numMatch = raw.match(/(\d+\.?\d*)\s*[⭐🌟★]/i) || raw.match(/[⭐🌟★]\s*(\d+\.?\d*)/i);
  const reviewMatch = raw.match(/\(?\s*(\d+)\s*(?:Google\s*|Facebook\s*)?[Rr]eviews?\s*\)?/i);
  const isFacebook = /facebook/i.test(raw);
  if (numMatch) {
    const score = parseFloat(numMatch[1]).toFixed(1);
    const source = isFacebook ? "Facebook" : "Google";
    const reviews = reviewMatch ? ` (${reviewMatch[1]} reviews)` : "";
    return `⭐ ${score} ${source}${reviews}`;
  }
  return null;
}

function scoreMatch(business, keywords) {
  const searchableText = [
    business.name,
    ...(business.services || []),
    business.description || "",
  ].join(" ").toLowerCase();

  let score = 0;
  for (const kw of keywords) {
    if (searchableText.includes(kw.toLowerCase())) {
      // Exact service label match scores higher than description match
      const inService = (business.services || []).some(s => s.toLowerCase().includes(kw.toLowerCase()));
      const inName = business.name.toLowerCase().includes(kw.toLowerCase());
      score += inService ? 3 : inName ? 2 : 1;
    }
  }
  return score;
}

function getKeywords(query) {
  const q = query.toLowerCase().trim();
  // Check synonym map first
  for (const [term, keywords] of Object.entries(SYNONYMS)) {
    if (q.includes(term)) return keywords;
  }
  // Fall back to splitting query into words
  return q.split(/\s+/).filter(w => w.length > 2);
}

function isHairSearch(query) {
  const q = query.toLowerCase();
  return q.includes("hair") || q.includes("salon") || q.includes("barber") || q.includes("haircut");
}

function hasHairTag(business) {
  return (business.services || []).some(s =>
    /hair|salon|barber|haircut|hairstyl|beard|blow dry|keratin/i.test(s)
  );
}

function hasOnlyExcludedTags(business) {
  return (business.services || []).every(s =>
    HAIR_EXCLUSIONS.some(ex => s.toLowerCase().includes(ex))
  );
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let query;
  try {
    ({ query } = JSON.parse(event.body));
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Query is required" }) };
    }
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const q = query.trim().toLowerCase();

  // Check clarification triggers
  for (const [trigger, question] of Object.entries(CLARIFICATION_TRIGGERS)) {
    if (q === trigger || q === `i need ${trigger}` || q === `looking for ${trigger}`) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          needs_clarification: true,
          clarification_question: question,
          results: [],
          no_results: false,
        }),
      };
    }
  }

  const keywords = getKeywords(query);
  const hairSearch = isHairSearch(query);

  // Score and filter businesses
  let scored = businesses
    .map(b => ({ ...b, score: scoreMatch(b, keywords) }))
    .filter(b => {
      if (b.score === 0) return false;
      // Hair exclusion: if this is a hair search, exclude beauty-only businesses
      if (hairSearch && !hasHairTag(b) && hasOnlyExcludedTags(b)) return false;
      return true;
    });

  // Shuffle within tier groups before sorting (randomize within same tier)
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [scored[i], scored[j]] = [scored[j], scored[i]];
  }

  // Sort: score descending, then plus before bronze within same score
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.tier === "plus" && b.tier !== "plus") return -1;
    if (b.tier === "plus" && a.tier !== "plus") return 1;
    return 0;
  });

  // Build public-safe result cards
  const results = scored.map(b => {
    const isPlus = b.tier === "plus";
    return {
      id: b.id,
      name: b.name,
      phone: b.phone || null,
      website: normalizeUrl(b.website),
      facebook: normalizeUrl(b.facebook),
      photo: b.photo || null,
      ...(isPlus && {
        rating: formatRating(b.rating),
        description: b.description || null,
      }),
    };
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      needs_clarification: false,
      clarification_question: null,
      results,
      no_results: results.length === 0,
    }),
  };
};
