/**
 * All Things Tyler – Steps 2 & 3: Category & Label Mapper
 *
 * Maps an intent → relevant service labels from the directory.
 * Returns: { primaryLabels, relatedLabels }
 *
 * primaryLabels  — businesses with these are strong candidates
 * relatedLabels  — businesses with these are secondary candidates
 *
 * This file is pure data + logic. No AI, no network calls.
 * Add new intents here as the directory grows.
 */

const LABEL_MAP = {
  // ── Hair & Beauty ──────────────────────────────────────────────────────────
  "Hair Services": {
    primary: ["Salons & Hair Stylists", "Barbers", "Men's Haircuts", "Women's Haircuts / Hairstyles", "Children's Haircuts", "Hair Color / Highlights / Balayage", "Hair Extension Installation", "Beard Trims"],
    related: [],
    exclude: ["Tattoo Artist", "Permanent Makeup", "Microblading", "Spray Tanning", "Make-Up Artist (MUA)", "Body Waxing", "Skincare & Estheticians", "Eyelash Tint & Lift", "Facial waxing", "Tanning Bed", "Red Light Therapy"],
  },
  "Nail Services": {
    primary: [],
    related: ["Salons & Hair Stylists", "Spa Services"],
    exclude: [],
  },
  "Skin Care": {
    primary: ["Skincare & Estheticians", "Facials & Skin Rejuvenation"],
    related: ["Spa Services", "Injectables & Fillers", "Body Waxing", "Eyelash Tint & Lift"],
    exclude: [],
  },
  "Tattoo & Body Art": {
    primary: ["Tattoo Artist", "Medical Tattoo", "Permanent Makeup", "Microblading"],
    related: [],
    exclude: [],
  },
  "Massage & Spa": {
    primary: ["Massage & Spa", "Spa Services"],
    related: ["Facials & Skin Rejuvenation", "Body Waxing", "IV Therapy & Wellness Shots"],
    exclude: [],
  },
  "Tanning": {
    primary: ["Spray Tanning", "Tanning Bed", "Red Light Therapy"],
    related: [],
    exclude: [],
  },

  // ── Home Services ──────────────────────────────────────────────────────────
  "Roofing": {
    primary: ["Residential Roofing", "Commercial Roofing", "Roof Inspections & Repairs"],
    related: ["Gutter Installation & Repair", "Gutter Cleaning", "Roof Washing", "Siding Installation"],
    exclude: [],
  },
  "Gutters": {
    primary: ["Gutter Installation & Repair", "Gutter Cleaning"],
    related: ["Residential Roofing", "Roof Inspections & Repairs"],
    exclude: [],
  },
  "HVAC": {
    primary: ["HVAC / Heating & Air"],
    related: ["Home Energy / Efficiancy Testing", "Solar Panel Installation"],
    exclude: [],
  },
  "Plumbing": {
    primary: ["Plumbing", "Backflow Prevention", "Water Heater Install", "Waterproofing & Shower Repairs"],
    related: ["Drainage Solutions"],
    exclude: [],
  },
  "Electrical": {
    primary: ["Electrician", "Generator Repair & Maintenance"],
    related: ["Solar Panel Installation", "Smart Home Support"],
    exclude: [],
  },
  "Pest Control": {
    primary: ["Pest Control", "Exterminators"],
    related: [],
    exclude: [],
  },
  "Lawn & Landscaping": {
    primary: ["Lawn Mowing / Edging", "Landscaping & Design", "Tree & Brush Trimming", "Tree Removal", "Mulching & Bed Clean Up", "Stump Grinding", "Land Clearing"],
    related: ["Sprinkler Repair / Irrigation Solutions", "Artificial Turf Installation", "Hardscaping"],
    exclude: [],
  },
  "Fence": {
    primary: ["Fence Repair", "Fence & Deck Staining", "Fence & Deck Cleaning"],
    related: ["Deck / Outdoor Structure Construction"],
    exclude: [],
  },
  "Concrete & Hardscaping": {
    primary: ["Patios / Walkway & Driveway Construction", "Retaining Walls", "Hardscaping", "Concrete Delivery / Ready Mix", "Short Load Concrete Delivery"],
    related: ["Drainage Solutions", "Landscaping & Design"],
    exclude: [],
  },
  "Flooring": {
    primary: ["Flooring & Fixtures", "Tile Installation"],
    related: ["Bathroom Remodels", "Kitchen Remodels"],
    exclude: [],
  },
  "Painting": {
    primary: ["Painting Services (Interior)", "Painting Services (Exterior)"],
    related: ["General Contractor -Residential"],
    exclude: [],
  },
  "Remodeling": {
    primary: ["Whole Home Renovation / Remodel", "Kitchen Remodels", "Bathroom Remodels", "General Contractor -Residential", "Light Commercial Construction"],
    related: ["Custom Cabinets", "Flooring & Fixtures", "Tile Installation", "Finish Carpentry", "Barndominium", "Steele Building Construction"],
    exclude: [],
  },
  "Pressure Washing": {
    primary: ["Pressure Washing", "Soft Washing", "House Washing", "Roof Washing", "Driveway / Sidewalk Cleaning", "Fence & Deck Cleaning"],
    related: ["Gutter Cleaning", "Window Cleaning"],
    exclude: [],
  },
  "Pool": {
    primary: ["Pool Construction"],
    related: ["Landscaping & Design", "Outdoor Kitchens & Firepits", "Deck / Outdoor Structure Construction"],
    exclude: [],
  },
  "Foundation": {
    primary: ["Foundation Repair", "House Leveling"],
    related: ["General Contractor -Residential", "Waterproofing & Shower Repairs"],
    exclude: [],
  },
  "Septic": {
    primary: ["Septic Services"],
    related: ["Plumbing"],
    exclude: [],
  },
  "Window Cleaning": {
    primary: ["Window Cleaning"],
    related: ["Pressure Washing", "House Washing"],
    exclude: [],
  },
  "House Cleaning": {
    primary: ["Basic House Cleaning", "Deep Cleaning/ Move Out Clean", "Make Ready Property Cleanup"],
    related: ["Decluttering  & Organizing", "House Cleanouts"],
    exclude: [],
  },
  "Junk Removal": {
    primary: ["Junk Hauling", "Dumpster Rentals", "Estate Cleanout", "House Cleanouts", "Residential Demolition"],
    related: ["Dirt/ Rock/ Gravel Hauling"],
    exclude: [],
  },
  "Moving": {
    primary: ["Professional Packing", "Errand Running & Delivery Services"],
    related: ["Junk Hauling", "House Cleanouts"],
    exclude: [],
  },
  "Home Energy": {
    primary: ["Solar Panel Installation", "Home Energy / Efficiancy Testing"],
    related: ["HVAC / Heating & Air", "Electrician", "Smart Home Support"],
    exclude: [],
  },
  "Custom Furniture": {
    primary: ["Custom Cabinets", "Furniture Restoration / Refurbishing", "Finish Carpentry"],
    related: ["General Contractor -Residential", "Whole Home Renovation / Remodel"],
    exclude: [],
  },
  "Interior Design": {
    primary: ["Interior Decorating", "Decluttering  & Organizing"],
    related: ["Christmas Tree / Indoor Holiday Decorating", "Porch Decorating (Seasonal)"],
    exclude: [],
  },

  // ── Legal ──────────────────────────────────────────────────────────────────
  "Probate / Estate Planning": {
    primary: ["Probate", "Estate Planning Attorney", "Wills & Trusts", "Guardianship"],
    related: ["Business Succession", "Special Needs Planning", "Real Estate Law"],
    exclude: [],
  },
  "Family Law": {
    primary: ["Family Law"],
    related: ["Educational Law", "Personal Injury / Wrongful Death"],
    exclude: [],
  },
  "Personal Injury": {
    primary: ["Personal Injury / Wrongful Death"],
    related: [],
    exclude: [],
  },
  "Real Estate Law": {
    primary: ["Real Estate Law"],
    related: ["Estate Planning Attorney", "Business Formation"],
    exclude: [],
  },
  "Business Law": {
    primary: ["Business Formation", "Business Succession"],
    related: ["Real Estate Law", "Educational Law"],
    exclude: [],
  },
  "Educational Law": {
    primary: ["Educational Law"],
    related: ["Family Law"],
    exclude: [],
  },
  "Legal Services": {
    primary: ["Estate Planning Attorney", "Probate", "Wills & Trusts", "Family Law", "Real Estate Law", "Personal Injury / Wrongful Death", "Business Formation", "Educational Law", "Guardianship"],
    related: [],
    exclude: [],
  },

  // ── Insurance ──────────────────────────────────────────────────────────────
  "Health Insurance": {
    primary: ["Health Insurance"],
    related: ["Dental Insurance", "Long Term Care Insurance"],
    exclude: [],
  },
  "Auto Insurance": {
    primary: ["Auto Insurance", "P&C Insurance"],
    related: [],
    exclude: [],
  },
  "Life Insurance": {
    primary: ["Life Insurance"],
    related: ["Long Term Care Insurance", "Financial Planning"],
    exclude: [],
  },
  "Pet Insurance": {
    primary: ["Pet Insurance"],
    related: [],
    exclude: [],
  },
  "Home / Property Insurance": {
    primary: ["P&C Insurance"],
    related: ["Auto Insurance"],
    exclude: [],
  },
  "Long-Term Care Insurance": {
    primary: ["Long Term Care Insurance"],
    related: ["Life Insurance", "Health Insurance"],
    exclude: [],
  },
  "Business Insurance": {
    primary: ["P&C Insurance"],
    related: [],
    exclude: [],
  },
  "Insurance": {
    primary: ["Health Insurance", "Auto Insurance", "Life Insurance", "Pet Insurance", "P&C Insurance", "Dental Insurance", "Long Term Care Insurance"],
    related: [],
    exclude: [],
  },

  // ── Real Estate & Housing ──────────────────────────────────────────────────
  "Long-Term Housing": {
    primary: ["House Rentals", "Property Management Company", "Rentals", "Mobile Home Lots"],
    related: ["Real Estate Agents", "Renovation Loans"],
    exclude: ["Vacation Stays / Staycation Rental", "Short-Term / Mid-Term Rentals", "RV Park", "Tent Camping Sites"],
  },
  "Short-Term Lodging": {
    primary: ["Vacation Stays / Staycation Rental", "Short-Term / Mid-Term Rentals", "RV Park", "Tent Camping Sites"],
    related: ["House Rentals"],
    exclude: [],
  },
  "Buying a Home": {
    primary: ["Real Estate Agents", "Home Loans", "Down Payment Assistance Programs"],
    related: ["Mortgage", "VA, Conventional, FHA, USDA Loans", "Investor Loans, DSCR Loans", "Jumbo Loans"],
    exclude: [],
  },
  "Mortgage / Home Loan": {
    primary: ["Mortgage", "Home Loans", "VA, Conventional, FHA, USDA Loans", "Down Payment Assistance Programs", "Renovation Loans", "Investor Loans, DSCR Loans", "Jumbo Loans"],
    related: ["Real Estate Agents"],
    exclude: [],
  },
  "Real Estate Agent": {
    primary: ["Real Estate Agents"],
    related: ["Property Management Company", "Home Loans"],
    exclude: [],
  },
  "Property Management": {
    primary: ["Property Management Company"],
    related: ["House Rentals", "Real Estate Agents"],
    exclude: [],
  },

  // ── Auto ──────────────────────────────────────────────────────────────────
  "Auto Repair": {
    primary: ["Vehicle Repair", "Shop Mechanic", "Mobile Mechanic", "Brake Repair", "Oil Change", "Mobile Oil Change / Brakes", "Diesel Repair", "Suspension Service", "Wheel Alignment", "Boats & Marine Engine Repair & Service", "Motorcylce Repair & Service", "Small Engine Repair (Lawn & OUtdoor Equipment)", "RV Repair & Maintenance", "Heavy Equipment / Dump Truck Repair"],
    related: ["Roadside Assistance", "Tire Services"],
    exclude: [],
  },
  "Auto Detailing": {
    primary: ["Car Wash & Detailing", "Mobile Detailing"],
    related: [],
    exclude: [],
  },
  "Roadside Assistance": {
    primary: ["Roadside Assistance"],
    related: ["Mobile Mechanic", "Mobile Oil Change / Brakes"],
    exclude: [],
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  "Accounting / Tax": {
    primary: ["Accounting", "Tax Preparation", "Bookkeeping", "Payroll"],
    related: ["Financial Planning", "Business Formation"],
    exclude: [],
  },
  "Financial Planning": {
    primary: ["Financial Planning", "Wealth Management", "Retirement Planning", "Investments", "Education Planning"],
    related: ["Life Insurance", "Long Term Care Insurance", "Veteran Benefits", "Special Needs Planning"],
    exclude: [],
  },
  "Precious Metals": {
    primary: ["Coin Dealer", "Gold & Silver Bullion Dealer", "Gold Jewelry Buyer & Seller", "Investment Services (Precious Metals)"],
    related: ["Jewelry Stores", "Watch Retailer"],
    exclude: [],
  },

  // ── Photography & Media ───────────────────────────────────────────────────
  "Photography": {
    primary: ["Wedding / Event Photography", "Family & Portrait Photography", "Newborn & Maternity Photography", "Senior Photography", "Professional / Headshots Photography", "Event Photographers", "Boudoir Photography", "Photography Studio Rental"],
    related: ["Commercial & Branding Shoots", "Commercial Videography", "Content Creation & Media"],
    exclude: [],
  },
  "Videography": {
    primary: ["Commercial Videography"],
    related: ["Content Creation & Media", "Event Photographers"],
    exclude: [],
  },
  "Marketing & Design": {
    primary: ["Marketing & Design", "Logo & Brand Design", "Social Media Management", "Web Design", "Content Creation & Media", "Business Printing & Signage", "Fleet Vehicle Lettering & Wraps"],
    related: ["Photography Studio Rental", "Commercial & Branding Shoots"],
    exclude: [],
  },

  // ── Health & Wellness ─────────────────────────────────────────────────────
  "Chiropractic": {
    primary: ["Chiropractor"],
    related: ["Massage & Spa", "Primary Care Physician", "Sports Physicals"],
    exclude: [],
  },
  "Dentistry": {
    primary: ["General Dentistry", "Cosmetic Dentistry", "Emergency Dental Care", "Dental Implants"],
    related: ["Dental Insurance"],
    exclude: [],
  },
  "Primary Care": {
    primary: ["Primary Care Physician", "Sports Physicals"],
    related: ["IV Therapy & Wellness Shots"],
    exclude: [],
  },
  "Mental Health": {
    primary: [],
    related: ["Holistic Health", "Holistic Women's Health"],
    exclude: [],
  },
  "Plastic Surgery": {
    primary: ["Plastic Surgery / Lifts, Tucks, Implants", "Injectables & Fillers"],
    related: ["Facials & Skin Rejuvenation", "Skincare & Estheticians"],
    exclude: [],
  },
  "IV Therapy": {
    primary: ["IV Therapy & Wellness Shots", "Red Light Therapy"],
    related: ["Holistic Health", "Weight Management"],
    exclude: [],
  },
  "Weight Management": {
    primary: ["Weight Management", "Ready-to-Eat Healthy Meals", "Meal Prep Service"],
    related: ["Personal Trainer", "Gym", "Holistic Health"],
    exclude: [],
  },
  "Fitness": {
    primary: ["Gym", "Personal Trainer", "Martial Arts", "Martial Arts Personal Trainer", "Kickboxing", "Women's Fitness Kickboxing", "Gymnastics", "Self Defense Classes", "Jiu-Jitsu Classes"],
    related: ["Dance Classes (Adult)", "Dance Classes (Youth)", "CPR Training / Certification"],
    exclude: [],
  },
  "Home Health Care": {
    primary: ["Adult Companionship Care", "Certified Nursing Assistant Care", "Dementia Care", "Respite Care - Adult", "Respite Care (Children)", "Special Needs Childcare"],
    related: ["Errand Running & Delivery Services", "Medical Appointment Transportation"],
    exclude: [],
  },
  "Holistic Health": {
    primary: ["Holistic Health", "Holistic Women's Health", "Herbal Apothecary", "Herbal Medicines", "Handmade Remedies & Tinctures"],
    related: ["Birth Doula Services", "Midwife Services", "Lactation Consulting", "Home Birth"],
    exclude: [],
  },

  // ── Food & Dining ─────────────────────────────────────────────────────────
  "Restaurants & Food": {
    primary: ["Restaurants", "Restaurant & Bar", "Mexican Food", "Cajun Food", "Asian Food", "Fish / Seafood", "Beef / Cicken / Pork / Lamb"],
    related: ["Food Trucks", "Catering", "Ice Cream", "Smoothies / Energy Drinks", "Coffee Shop"],
    exclude: [],
  },
  "Catering": {
    primary: ["Catering", "Food Trucks", "Meal Prep Service", "Ready-to-Eat Healthy Meals"],
    related: ["Bakeries & Sweets", "Event Planner / Designer"],
    exclude: [],
  },
  "Bakery & Sweets": {
    primary: ["Bakeries & Sweets", "Ice Cream", "Sweets", "Dubai Chocolate Bars"],
    related: ["Catering"],
    exclude: [],
  },

  // ── Pet ───────────────────────────────────────────────────────────────────
  "Pet Care": {
    primary: ["Pet Sitting", "Pet Boarding", "Doggy Daycare", "Pet Grooming"],
    related: [],
    exclude: [],
  },

  // ── Children & Education ──────────────────────────────────────────────────
  "Childcare": {
    primary: ["Daycare", "Babysitting Services", "Nanny Services", "After School Programs / Camps", "School Drop off / Pick-Up Programs", "Special Needs Childcare"],
    related: ["Respite Care (Children)", "Indoor Kids Play Place"],
    exclude: [],
  },
  "Education & Tutoring": {
    primary: ["Tutoring", "Learning / Educational Camps", "Learning & Enrichment Camp", "Private / Alternative Schools"],
    related: ["After School Programs / Camps", "Technology Training"],
    exclude: [],
  },
  "Kids Activities": {
    primary: ["Indoor Kids Play Place", "Birthday Parties", "Kid-Friendly Activities", "Activities for Adults & Kids", "Dance Classes (Youth)", "Gymnastics", "Summer Camps", "Sports Camp", "Learning & Enrichment Camp", "After School Programs / Camps", "Dance Camps & Workshops"],
    related: ["Party Venue", "Catering"],
    exclude: [],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  "Event Planning": {
    primary: ["Event Planner / Designer", "Event Logistics Consulting"],
    related: ["Event Decor / Furniture/ Prop Rentals", "Balloon Decor / Arches", "Catering", "Wedding / Event Photography"],
    exclude: [],
  },
  "Event Venue": {
    primary: ["Shower / Party Venue", "Date Night Ideas", "Social Events"],
    related: ["Restaurant & Bar", "Indoor Kids Play Place"],
    exclude: [],
  },
  "Event Decor": {
    primary: ["Event Decor / Furniture/ Prop Rentals", "Balloon Decor / Arches"],
    related: ["Event Planner / Designer", "Homecoming Mum & Garters"],
    exclude: [],
  },
  "Transportation": {
    primary: ["Airport Transportation", "Black Car / Luxury Chauffeur Services", "Passenger Van / Shuttle Service", "Medical Appointment Transportation", "Wedding / Group Event Transportation", "Personal Driver", "Valet Services"],
    related: ["Errand Running & Delivery Services"],
    exclude: [],
  },

  // ── Business Services ─────────────────────────────────────────────────────
  "Business Services": {
    primary: ["Notary", "Document Shredding", "Copy Services", "Fax Services", "Scanning Services", "Mailbox Rentals", "Shipping Services", "Shipping Supplies", "Package Drop-Off Services", "Document Printing", "Laminating"],
    related: ["Business Printing & Signage"],
    exclude: [],
  },
  "Technology": {
    primary: ["Technical Support", "Networking & WiFi Support", "Mobile Device Support", "Smart Home Support", "Online Saftey / Cyber Security", "Technology Training"],
    related: ["Web Design", "Social Media Management"],
    exclude: [],
  },
  "Security": {
    primary: ["Executive Security / Event Security"],
    related: ["Valet Services", "Event Logistics Consulting"],
    exclude: [],
  },

  // ── Specialty ─────────────────────────────────────────────────────────────
  "Fuel Delivery": {
    primary: ["Fuel Delivery Service"],
    related: [],
    exclude: [],
  },
  "Aquarium": {
    primary: ["Aquarium Maintenance (Commercial)", "Aquarium Maintenance (Residential)"],
    related: [],
    exclude: [],
  },
  "3D Printing": {
    primary: ["3D printing"],
    related: ["DTF Prints", "Screen Printing"],
    exclude: [],
  },
  "Precious Goods": {
    primary: ["Jewelry Stores", "Watch Retailer", "Gold Jewelry Buyer & Seller", "Gold & Silver Bullion Dealer", "Coin Dealer"],
    related: ["Artisan / Specialty Goods"],
    exclude: [],
  },
};

function getLabelsForIntent(intent) {
  const entry = LABEL_MAP[intent];
  if (entry) return entry;

  // Fuzzy fallback: try to find a partial match
  const intentLower = intent.toLowerCase();
  for (const [key, val] of Object.entries(LABEL_MAP)) {
    if (key.toLowerCase().includes(intentLower) || intentLower.includes(key.toLowerCase())) {
      return val;
    }
  }

  // No match: return empty sets so the candidate builder gets nothing
  return { primary: [], related: [], exclude: [] };
}

module.exports = { getLabelsForIntent, LABEL_MAP };
