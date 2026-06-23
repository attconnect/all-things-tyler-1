/**
 * All Things Tyler – Step 1: Intent Engine
 *
 * Takes a raw user query and returns a classified intent.
 * Uses deterministic keyword matching first (fast, free, predictable).
 * Falls back to a minimal AI call only when needed.
 *
 * Returns: { intent, needsClarification, clarificationQuestion }
 */

// ── Intent definitions ────────────────────────────────────────────────────────
// Each entry: triggers (any match → this intent), clarify (ask first if ONLY this word)
const INTENT_MAP = [
  // Hair & Beauty
  { intent: "Hair Services",            triggers: ["hair", "haircut", "hairstyle", "salon", "barber", "barbershop", "beard trim", "blowout", "blow dry", "hair color", "highlights", "balayage", "hair extension", "keratin"] },
  { intent: "Nail Services",            triggers: ["nail", "manicure", "pedicure", "acrylic nails", "gel nails"] },
  { intent: "Skin Care",                triggers: ["facial", "skincare", "esthetician", "skin treatment", "microneedling", "chemical peel"] },
  { intent: "Tattoo & Body Art",        triggers: ["tattoo", "piercing", "microblading", "permanent makeup", "medical tattoo"] },
  { intent: "Massage & Spa",            triggers: ["massage", "spa", "relaxation", "deep tissue", "hot stone"] },
  { intent: "Tanning",                  triggers: ["spray tan", "tanning", "tanning bed", "red light therapy"] },

  // Home Services
  { intent: "Roofing",                  triggers: ["roof", "roofing", "shingles", "roof leak", "roof repair", "roof replacement", "storm damage roof"] },
  { intent: "Gutters",                  triggers: ["gutter", "gutters", "gutter cleaning", "gutter installation", "gutter repair"] },
  { intent: "HVAC",                     triggers: ["ac", "a/c", "air conditioning", "hvac", "heating", "heat pump", "furnace", "air conditioner", "cooling", "ac unit", "ac quit", "ac out"] },
  { intent: "Plumbing",                 triggers: ["plumb", "plumber", "pipe", "drain", "water heater", "leak", "toilet", "faucet", "sewer", "backflow"] },
  { intent: "Electrical",               triggers: ["electrician", "electrical", "wiring", "outlet", "breaker", "generator", "solar"] },
  { intent: "Pest Control",             triggers: ["pest", "bug", "exterminator", "termite", "roach", "ant", "mosquito", "rodent"] },
  { intent: "Lawn & Landscaping",       triggers: ["lawn", "landscap", "grass", "mowing", "yard", "mulch", "sprinkler", "irrigation", "tree trim", "tree removal", "stump", "land clearing"] },
  { intent: "Fence",                    triggers: ["fence", "fencing"] },
  { intent: "Concrete & Hardscaping",   triggers: ["concrete", "patio", "driveway", "sidewalk", "retaining wall", "hardscap"] },
  { intent: "Flooring",                 triggers: ["floor", "flooring", "tile", "hardwood", "carpet", "vinyl"] },
  { intent: "Painting",                 triggers: ["paint", "painting", "painter", "interior paint", "exterior paint"] },
  { intent: "Remodeling",               triggers: ["remodel", "renovation", "kitchen remodel", "bathroom remodel", "addition", "whole home"] },
  { intent: "Pressure Washing",         triggers: ["pressure wash", "power wash", "soft wash", "house wash", "roof wash", "fence wash"] },
  { intent: "Pool",                     triggers: ["pool", "swimming pool"] },
  { intent: "Foundation",               triggers: ["foundation", "house leveling", "settlement"] },
  { intent: "Septic",                   triggers: ["septic"] },
  { intent: "Window Cleaning",          triggers: ["window clean"] },
  { intent: "House Cleaning",           triggers: ["house clean", "maid", "cleaning service", "deep clean", "move out clean", "basic clean"] },
  { intent: "Junk Removal",             triggers: ["junk", "hauling", "junk removal", "estate cleanout", "cleanout", "dumpster"] },
  { intent: "Moving",                   triggers: ["moving", "mover", "moving company", "pack", "move out"] },

  // Legal
  { intent: "Probate / Estate Planning",triggers: ["probate", "estate", "will ", "wills", "trust", "inheritance", "land tied up", "passed away", "after death", "guardian", "guardianship", "business succession", "special needs planning"] },
  { intent: "Family Law",               triggers: ["divorce", "custody", "child support", "family law", "adoption"] },
  { intent: "Personal Injury",          triggers: ["injury", "accident", "wrongful death", "personal injury"] },
  { intent: "Real Estate Law",          triggers: ["real estate law", "real estate attorney", "closing attorney", "title"] },
  { intent: "Business Law",             triggers: ["business formation", "llc", "incorporation", "business attorney"] },
  { intent: "Educational Law",          triggers: ["educational law", "iep", "special education law"] },
  { intent: "Legal Services",           triggers: ["lawyer", "attorney", "legal"], clarify: "What type of legal help do you need — probate/estate, family law, personal injury, real estate, or business?" },

  // Insurance
  { intent: "Health Insurance",         triggers: ["health insurance"] },
  { intent: "Auto Insurance",           triggers: ["auto insurance", "car insurance", "vehicle insurance"] },
  { intent: "Life Insurance",           triggers: ["life insurance"] },
  { intent: "Pet Insurance",            triggers: ["pet insurance"] },
  { intent: "Home / Property Insurance",triggers: ["home insurance", "homeowners insurance", "property insurance", "p&c", "renters insurance"] },
  { intent: "Long-Term Care Insurance", triggers: ["long term care", "long-term care"] },
  { intent: "Business Insurance",       triggers: ["business insurance", "commercial insurance", "liability insurance"] },
  { intent: "Insurance",                triggers: ["insurance"], clarify: "What type of insurance are you looking for — health, auto, life, pet, home, or business?" },

  // Real Estate & Housing
  { intent: "Long-Term Housing",        triggers: ["rent ", "rental", "lease", "apartment", "house for rent", "2br", "3br", "2 bedroom", "3 bedroom", "bedroom house", "bedroom apartment", "moving to", "relocat", "residential", "smith county"] },
  { intent: "Short-Term Lodging",       triggers: ["vacation", "weekend stay", "nightly", "staycation", "airbnb", "cabin", "guest house", "getaway", "short term stay"] },
  { intent: "Buying a Home",            triggers: ["buy a home", "buying a house", "home buyer", "first time buyer", "home purchase"] },
  { intent: "Mortgage / Home Loan",     triggers: ["mortgage", "home loan", "fha", "va loan", "usda", "refinance", "down payment"] },
  { intent: "Real Estate Agent",        triggers: ["real estate agent", "realtor", "sell my house", "list my home", "selling a home"] },
  { intent: "Property Management",      triggers: ["property management", "manage my rental", "landlord"] },

  // Auto
  { intent: "Auto Repair",              triggers: ["mechanic", "auto repair", "car repair", "vehicle repair", "brake", "oil change", "tire", "alignment", "suspension", "diesel", "transmission", "engine"] },
  { intent: "Auto Detailing",           triggers: ["detail", "car wash", "mobile detail", "auto detail"] },
  { intent: "Roadside Assistance",      triggers: ["roadside", "tow", "jump start", "flat tire", "locked out"] },

  // Finance
  { intent: "Accounting / Tax",         triggers: ["accounting", "accountant", "tax", "bookkeeping", "payroll", "cpa"] },
  { intent: "Financial Planning",       triggers: ["financial plan", "financial advisor", "invest", "retirement", "wealth", "401k"] },
  { intent: "Precious Metals",          triggers: ["gold", "silver", "bullion", "coin dealer", "precious metal"] },

  // Photography & Media
  { intent: "Photography",              triggers: ["photo", "photograph", "photographer", "headshot", "portrait", "wedding photo", "newborn photo", "family photo", "senior photo", "boudoir"] },
  { intent: "Videography",              triggers: ["video", "videograph", "film", "commercial video"] },
  { intent: "Marketing & Design",       triggers: ["marketing", "logo", "brand", "social media", "web design", "signage", "printing", "content creation"] },

  // Health & Wellness
  { intent: "Chiropractic",             triggers: ["chiropract", "back pain", "spine", "adjustment"] },
  { intent: "Dentistry",                triggers: ["dentist", "dental", "teeth", "tooth", "oral", "implant"] },
  { intent: "Primary Care",             triggers: ["doctor", "physician", "primary care", "clinic", "checkup"] },
  { intent: "Mental Health",            triggers: ["therapist", "counseling", "mental health", "anxiety", "depression", "therapy"] },
  { intent: "Plastic Surgery",          triggers: ["plastic surgery", "cosmetic surgery", "augmentation", "lift", "tuck", "botox", "filler", "injectable"] },
  { intent: "IV Therapy",               triggers: ["iv therapy", "wellness shot", "drip"] },
  { intent: "Weight Management",        triggers: ["weight loss", "weight management", "diet", "nutrition"] },
  { intent: "Fitness",                  triggers: ["gym", "personal trainer", "fitness", "workout", "kickboxing", "martial arts", "jiu jitsu", "gymnastics", "dance class"] },
  { intent: "Home Health Care",         triggers: ["home health", "caregiver", "elderly care", "senior care", "dementia care", "cna", "companionship care", "respite care", "adult care"] },
  { intent: "Holistic Health",          triggers: ["holistic", "herbal", "natural remedy", "apothecary", "doula", "midwife", "lactation"] },

  // Food & Dining
  { intent: "Restaurants & Food",       triggers: ["restaurant", "food", "dining", "eat", "lunch", "dinner", "breakfast", "cafe", "mexican", "cajun", "asian", "seafood"] },
  { intent: "Catering",                 triggers: ["cater", "catering", "meal prep", "food truck", "event food"] },
  { intent: "Bakery & Sweets",          triggers: ["bakery", "cake", "sweets", "dessert", "cookie", "ice cream"] },

  // Pet
  { intent: "Pet Care",                 triggers: ["pet", "dog", "cat", "animal", "boarding", "pet sitting", "pet grooming", "veterinar", "doggy daycare"] },

  // Children & Education
  { intent: "Childcare",                triggers: ["childcare", "daycare", "babysit", "nanny", "after school"] },
  { intent: "Education & Tutoring",     triggers: ["tutor", "school", "learning camp", "educational", "enrichment"] },
  { intent: "Kids Activities",          triggers: ["kids activity", "children activity", "birthday party", "indoor play", "summer camp", "sports camp", "dance class", "gymnastics"] },

  // Events
  { intent: "Event Planning",           triggers: ["event planner", "event design", "party planner", "wedding planner"] },
  { intent: "Event Venue",              triggers: ["venue", "event space", "party venue", "shower venue"] },
  { intent: "Photography - Events",     triggers: ["event photo", "wedding photo", "party photo"] },
  { intent: "Event Decor",              triggers: ["event decor", "balloon", "decoration", "prop rental", "furniture rental"] },
  { intent: "Transportation",           triggers: ["transportation", "shuttle", "chauffeur", "black car", "limo", "van service", "airport transport", "medical transport"] },

  // Home & Lifestyle
  { intent: "Interior Design",          triggers: ["interior design", "decorating", "home decor", "organiz", "declutter"] },
  { intent: "Custom Furniture",         triggers: ["custom cabinet", "cabinet", "furniture restoration", "woodwork", "finish carpentry"] },
  { intent: "Home Energy",              triggers: ["solar", "energy efficient", "electric bill", "reduce electric", "home energy", "save on electric", "save money on electric", "electricity bill", "lower electric", "energy saving"] },

  // Business Services
  { intent: "Business Services",        triggers: ["notary", "shredding", "copy", "fax", "scanning", "mailbox", "shipping", "print service", "payroll"] },
  { intent: "Technology",               triggers: ["tech support", "it support", "computer", "network", "wifi", "cyber", "mobile device", "smart home"] },
  { intent: "Security",                 triggers: ["security", "executive protection", "event security", "bodyguard"] },

  // Specialty
  { intent: "Fuel Delivery",            triggers: ["fuel delivery", "diesel delivery", "gas delivery"] },
  { intent: "Aquarium",                 triggers: ["aquarium"] },
  { intent: "3D Printing",              triggers: ["3d print"] },
  { intent: "Precious Goods",           triggers: ["jewelry", "watch", "gold buyer", "silver buyer", "coin"] },
];

// ── Main intent classifier ────────────────────────────────────────────────────
function classifyIntent(query) {
  const q = query.toLowerCase().trim();

  // Try each intent in order — first match wins
  for (const entry of INTENT_MAP) {
    const matched = entry.triggers.some(t => q.includes(t.toLowerCase()));
    if (!matched) continue;

    // Check if this is an exact single-word/phrase trigger that requires clarification
    if (entry.clarify) {
      // Only clarify if the query is JUST the trigger word, not part of a longer specific query
      const isVague = entry.triggers.some(t => q === t.toLowerCase() || q === `i need ${t}` || q === `looking for ${t}` || q === `need ${t}`);
      if (isVague) {
        return {
          intent: entry.intent,
          needsClarification: true,
          clarificationQuestion: entry.clarify,
        };
      }
    }

    return { intent: entry.intent, needsClarification: false, clarificationQuestion: null };
  }

  // No match found — return the query itself as the intent and let the label matcher try
  return { intent: query.trim(), needsClarification: false, clarificationQuestion: null };
}

module.exports = { classifyIntent, INTENT_MAP };
