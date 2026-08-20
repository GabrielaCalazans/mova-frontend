const FAVORITES_KEY = "mova_favoritos";

function readFavorites() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function getFavoriteIds() {
  return readFavorites();
}

export function isFavorite(id) {
  return readFavorites().includes(String(id));
}

export function toggleFavorite(id) {
  const current = readFavorites();
  const key = String(id);
  const next = current.includes(key)
    ? current.filter((favId) => favId !== key)
    : [...current, key];

  writeFavorites(next);
  return next;
}
