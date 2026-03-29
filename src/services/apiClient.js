const API_BASE_URL = import.meta.env.API_BASE_URL;

function buildUrl(path) {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  const payload = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && payload.message
        ? payload.message
        : "Erro ao comunicar com a API.";

    throw new Error(message);
  }

  return payload;
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}