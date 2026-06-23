/**
 * All Things Tyler – Search API v2.0
 * Netlify Serverless Function: /api/search
 *
 * Five-step pipeline:
 *   1. Intent Engine       — classify what the user wants
 *   2+3. Label Mapper      — which labels to search
 *   4. Candidate Builder   — every qualifying business (locked list)
 *   5. Ranking Engine      — featured / primary / other, tier-ordered
 *   6. AI Presenter        — specialization lines only, no reordering
 *
 * POST { query: string }
 */

const { classifyIntent }          = require("./pipeline/intent");
const { getLabelsForIntent }      = require("./pipeline/labels");
const { buildCandidates, rankCandidates } = require("./pipeline/rank");
const { generateSpecializations } = require("./pipeline/present");

function normalizeUrl(url) {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  return (t.startsWith("http://") || t.startsWith("https://")) ? t : "https://" + t;
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

function buildCard(biz, specialization) {
  const isPlus = biz.tier === "plus";
  return {
    id:             biz.id,
    name:           biz.name,
    phone:          biz.phone || null,
    website:        normalizeUrl(biz.website),
    facebook:       normalizeUrl(biz.facebook),
    photo:          biz.photo || null,
    specialization: specialization || null,
    ...(isPlus && {
      rating:      formatRating(biz.rating),
      description: biz.description || null,
    }),
  };
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type":                 "application/json",
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

  const q = query.trim();

  // Step 1 — Classify intent
  const { intent, needsClarification, clarificationQuestion } = classifyIntent(q);

  if (needsClarification) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        intent,
        needs_clarification:    true,
        clarification_question: clarificationQuestion,
        results:   { featured: [], primary: [], other: [] },
        no_results: false,
      }),
    };
  }

  // Steps 2+3 — Get labels
  const { primary: primaryLabels, related: relatedLabels, exclude: excludeLabels } = getLabelsForIntent(intent);

  // Step 4 — Build candidate list
  const { primary: primaryCandidates, related: relatedCandidates } =
    buildCandidates(primaryLabels, relatedLabels, excludeLabels);

  if (primaryCandidates.length + relatedCandidates.length === 0) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        intent,
        needs_clarification:    false,
        clarification_question: null,
        results:   { featured: [], primary: [], other: [] },
        no_results: true,
      }),
    };
  }

  // Step 5 — Rank
  const ranked = rankCandidates(primaryCandidates, relatedCandidates, primaryLabels, q);

  // Step 6 — AI presenter (specialization lines only)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const specializations = apiKey
    ? await generateSpecializations(intent, q, ranked, apiKey)
    : {};

  return {
    statusCode: 200, headers,
    body: JSON.stringify({
      intent,
      needs_clarification:    false,
      clarification_question: null,
      results: {
        featured: ranked.featured.map(b => buildCard(b, specializations[b.id])),
        primary:  ranked.primary.map(b  => buildCard(b, specializations[b.id])),
        other:    ranked.other.map(b    => buildCard(b, specializations[b.id])),
      },
      no_results: false,
    }),
  };
};
