/**
 * All Things Tyler – Steps 4 & 5: Candidate Builder + Ranking Engine
 *
 * Step 4: Build candidate list — every business with a matching label.
 *         No business outside this list can appear in results.
 *
 * Step 5: Rank candidates into three tiers:
 *   ⭐ featured   — earned, meaningful evidence of specialty for THIS search
 *      primary    — strong match, PLUS+ before Bronze, randomized within tier
 *      other      — qualifies but not a specialist, PLUS+ before Bronze, randomized
 *
 * Primary Services field: not yet in data. When added to businesses.json as
 * b.primaryServices (array of strings), this engine will automatically use it.
 * No redesign needed — just the data field.
 */

const businesses = require("../../data/businesses.json");

// ── Shuffle array in place (Fisher-Yates) ────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Sort PLUS+ before Bronze, randomized within each tier ────────────────────
function sortByTier(candidates) {
  const plus   = shuffle(candidates.filter(c => c.tier === "plus"));
  const bronze = shuffle(candidates.filter(c => c.tier === "bronze"));
  return [...plus, ...bronze];
}

// ── Featured match scoring ────────────────────────────────────────────────────
// Returns true if the business has meaningful evidence for THIS specific search.
// Evidence must come from data — not from label count.
function isFeaturedMatch(business, primaryLabels, query) {
  const q = query.toLowerCase();
  const desc = (business.description || "").toLowerCase();
  const name = (business.name || "").toLowerCase();

  // Primary Services field (future): if ANY primary service matches a primary label, featured
  if (business.primaryServices && business.primaryServices.length > 0) {
    const hasPrimaryMatch = business.primaryServices.some(ps =>
      primaryLabels.some(pl => pl.toLowerCase() === ps.toLowerCase())
    );
    if (hasPrimaryMatch) return true;
  }

  // Description confirms the specialty when it contains query keywords
  if (business.description) {
    const queryWords = q.split(/\s+/).filter(w => w.length > 3);
    const descMatches = queryWords.filter(w => desc.includes(w));
    if (descMatches.length >= 2) return true;
    // Single strong keyword match in description also counts
    if (queryWords.length === 1 && descMatches.length === 1) return true;
  }

  // Business name directly contains the core service
  const queryWords = q.split(/\s+/).filter(w => w.length > 3);
  if (queryWords.some(w => name.includes(w))) return true;

  // High rating (4.8+) for PLUS+ businesses — social proof of quality
  if (business.tier === "plus" && business.rating) {
    const ratingMatch = business.rating.match(/(\d+\.?\d*)/);
    if (ratingMatch && parseFloat(ratingMatch[1]) >= 4.8) return true;
  }

  return false;
}

// ── Step 4: Build candidate list ─────────────────────────────────────────────
function buildCandidates(primaryLabels, relatedLabels, excludeLabels) {
  const primarySet = new Set(primaryLabels.map(l => l.toLowerCase()));
  const relatedSet = new Set(relatedLabels.map(l => l.toLowerCase()));
  const excludeSet = new Set(excludeLabels.map(l => l.toLowerCase()));

  const primary = [];
  const related = [];

  for (const biz of businesses) {
    const bizLabels = (biz.services || []).map(s => s.toLowerCase());

    // Hard exclude: if any business label is in the exclude set, skip entirely
    const isExcluded = bizLabels.some(l => excludeSet.has(l));
    if (isExcluded) continue;

    const matchesPrimary = bizLabels.some(l => primarySet.has(l));
    const matchesRelated = bizLabels.some(l => relatedSet.has(l));

    if (matchesPrimary) {
      primary.push({ ...biz, _matchType: "primary" });
    } else if (matchesRelated) {
      related.push({ ...biz, _matchType: "related" });
    }
  }

  return { primary, related };
}

// ── Step 5: Rank candidates ───────────────────────────────────────────────────
function rankCandidates(primaryCandidates, relatedCandidates, primaryLabels, query) {
  // Separate featured from primary
  const featured = [];
  const nonFeatured = [];

  for (const biz of primaryCandidates) {
    if (isFeaturedMatch(biz, primaryLabels, query)) {
      featured.push(biz);
    } else {
      nonFeatured.push(biz);
    }
  }

  return {
    featured:    sortByTier(featured),
    primary:     sortByTier(nonFeatured),
    other:       sortByTier(relatedCandidates),
  };
}

module.exports = { buildCandidates, rankCandidates };
