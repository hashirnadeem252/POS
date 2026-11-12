const API_URL = "https://localhost:7219/api/Sales";

// =========================
// SEARCH SALES
// =========================
export async function searchSales(filters) {
  const response = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filters)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Search API Error:", errorText);
    throw new Error(errorText);
  }

  return await response.json();
}

// =========================
// GET SALE DETAILS
// =========================
export async function getSaleDetails(id) {
  const response = await fetch(`${API_URL}/${id}/details`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Get Sale Details API Error:", errorText);
    throw new Error(errorText);
  }

  return await response.json();
}