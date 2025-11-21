// src/lib/reportEngine.ts

export interface AnalysisResult {
  overall: number;
  ingredientSafety: number;
  claimCredibility: number;
  traceability: number;
  completeness: number;
  riskFlags: string[];
  summary: string;
}

/**
 * CATEGORY TAGS
 */
const CATEGORY_HEALTH = ["skincare", "cosmetics", "supplement"];
const CATEGORY_FOOD = ["food", "snacks", "beverage"];
const CATEGORY_ELECTRONICS = ["electronics", "device", "appliance"];

/**
 * HIGH-QUALITY, SMART PRODUCT TRANSPARENCY ENGINE
 */
export function analyzeProduct(product: any, followups: any[]): AnalysisResult {
  const category = product?.category?.toLowerCase() || "";
  const claim = product?.claim || "";

  // ------------------------------------------
  // FIX: Supabase profile nesting
  // product.profile.profile = { ingredients: "...", sourcing: "...", ... }
  // ------------------------------------------
  const outerProfile = product?.profile || {};
  const profile = outerProfile.profile || {};

  const ingredients = profile.ingredients?.trim() || "";
  const sourcing = profile.sourcing?.trim() || "";
  const certs = profile.certifications?.trim() || "";
  const details = profile.additionalDetails?.trim() || "";

  // ------------------------------------------
  // 1) INGREDIENT SAFETY
  // ------------------------------------------
  let ingredientSafety = 40;

  if (!ingredients) {
    ingredientSafety = 10;
  } else {
    const ing = ingredients.toLowerCase();

    const harmful = [
      "paraben",
      "sls",
      "sles",
      "phthalate",
      "formaldehyde",
      "petroleum",
      "mineral oil",
      "bleach",
      "synthetic fragrance",
    ];

    const safe = [
      "organic",
      "natural",
      "plant",
      "herbal",
      "cold pressed",
      "vitamin",
      "non-gmo",
      "preservative-free",
      "fragrance-free",
    ];

    harmful.forEach((h) => {
      if (ing.includes(h)) ingredientSafety -= 15;
    });

    safe.forEach((s) => {
      // FIXED LINE ↓↓↓↓↓↓
      if (ing.includes(s)) ingredientSafety += 10;
    });

    // Extra weight for skincare
    if (CATEGORY_HEALTH.includes(category)) {
      ingredientSafety = Math.min(ingredientSafety + 10, 95);
    }
  }

  ingredientSafety = Math.max(5, Math.min(ingredientSafety, 95));

  // ------------------------------------------
  // 2) CLAIM CREDIBILITY
  // ------------------------------------------
  let claimCredibility = 50;

  if (!claim) {
    claimCredibility = 35;
  } else {
    const sensitiveClaims = [
      "organic",
      "vegan",
      "cruelty-free",
      "lab-tested",
      "non-toxic",
      "clean",
    ];

    const containsSensitive = sensitiveClaims.some((w) =>
      claim.toLowerCase().includes(w)
    );

    if (containsSensitive) claimCredibility += 15;
    if (certs) claimCredibility += 20;
    if (claim.toLowerCase().includes("100%")) claimCredibility -= 10;

    claimCredibility = Math.min(claimCredibility, 95);
  }

  // ------------------------------------------
  // 3) TRACEABILITY
  // ------------------------------------------
  let traceability = 40;

  if (sourcing) traceability += 30;
  if (certs) traceability += 20;
  if (details) traceability += 10;

  // Electronics require more documentation
  if (CATEGORY_ELECTRONICS.includes(category)) {
    traceability += 10;
  }

  traceability = Math.min(traceability, 95);

  // ------------------------------------------
  // 4) COMPLETENESS
  // ------------------------------------------
  const total = followups.length;
  const answered = followups.filter((q) => q.answer?.trim()).length;
  const completeness = total === 0 ? 30 : Math.round((answered / total) * 100);

  // ------------------------------------------
  // 5) RISK FLAGS
  // ------------------------------------------
  const riskFlags: string[] = [];

  if (!ingredients)
    riskFlags.push("Ingredients missing — cannot assess ingredient safety.");
  if (!sourcing)
    riskFlags.push("Sourcing details missing — traceability impacted.");
  if (CATEGORY_HEALTH.includes(category) && !certs)
    riskFlags.push(
      "No safety certifications provided for a skincare/cosmetic product."
    );
  if (claim && completeness < 50)
    riskFlags.push("Product claims not fully validated by supplied information.");

  if (riskFlags.length === 0) {
    riskFlags.push("No major transparency risks detected.");
  }

  // ------------------------------------------
  // 6) OVERALL SCORE
  // ------------------------------------------
  const overall = Math.round(
    ingredientSafety * 0.3 +
      claimCredibility * 0.2 +
      traceability * 0.25 +
      completeness * 0.25
  );

  // ------------------------------------------
  // 7) SUMMARY TEXT
  // ------------------------------------------
  let summary = "";

  if (overall >= 85) {
    summary =
      "Excellent transparency. Strong ingredient safety, reliable sourcing, and credible claims.";
  } else if (overall >= 70) {
    summary =
      "Good transparency with minor missing information. Improving documentation will strengthen trust.";
  } else if (overall >= 50) {
    summary =
      "Moderate transparency. Missing details reduce clarity. Provide full ingredient and sourcing details.";
  } else {
    summary =
      "Low transparency and potential risks detected. Provide complete ingredient list, sourcing details, certifications, and documentation.";
  }

  return {
    overall,
    ingredientSafety,
    claimCredibility,
    traceability,
    completeness,
    riskFlags,
    summary,
  };
}
