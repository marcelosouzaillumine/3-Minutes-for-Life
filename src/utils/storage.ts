const FAVORITES_KEY = 'principio_favorites';

export function getFavorites(): number[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading from localStorage', e);
    return [];
  }
}

export function saveFavorite(id: number): void {
  const favorites = getFavorites();
  if (!favorites.includes(id)) {
    favorites.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(id: number): void {
  const favorites = getFavorites();
  const updated = favorites.filter((favId) => favId !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
}

export function isFavorite(id: number): boolean {
  return getFavorites().includes(id);
}
