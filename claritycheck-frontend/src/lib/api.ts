export const BASE_URL = "https://gallant-adaptation-production.up.railway.app";


export async function createProduct(payload: {
  name: string;
  category: string;
  description: string;
  claim: string;
}) {
  const res = await fetch(`${BASE_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

export async function getProduct(productId: string) {
  const res = await fetch(`${BASE_URL}/products/${productId}`);
  if (!res.ok) throw new Error("Failed to load product");
  return res.json();
}

export async function fetchLatestFollowups(productId: string) {
  const res = await fetch(`${BASE_URL}/products/${productId}/followups`);
  if (!res.ok) throw new Error("Failed to fetch followups");
  return res.json();
}

export async function saveProfile(productId: string, profile: any) {
  const res = await fetch(`${BASE_URL}/products/${productId}/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

export async function saveAnswers(
  productId: string,
  answers: Record<string, string>
) {
  const res = await fetch(`${BASE_URL}/products/${productId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error("Failed to save answers");
  return res.json();
}

// Optional: AI options (if used)
export async function generateOptions(productId: string) {
  const res = await fetch(`${BASE_URL}/products/${productId}/options`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate AI options");
  return res.json();
}
