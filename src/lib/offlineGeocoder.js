let cityDataPromise;

async function loadData() {
  if (!cityDataPromise) {
    cityDataPromise = fetch('/cities.json')
      .then((res) => res.json())
      .catch(() => []);
  }
  return cityDataPromise;
}

export async function searchPlaces(query, limit = 5) {
  const data = await loadData();
  const q = query.toLowerCase();
  return data
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, limit);
}
