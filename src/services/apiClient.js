const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL;

function parseApiErrorMessage(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (typeof payload === "object") {
    return (
      payload.message ||
      payload.error?.message ||
      payload.error ||
      payload.result?.message ||
      null
    );
  }

  return null;
}

function buildUrl(path) {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function apiRequest(path, options = {}) {
  const { authToken, headers: customHeaders = {}, ...requestOptions } = options;

  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      headers,
    });
  } catch {
    throw new Error("Nao foi possivel conectar com a API.");
  }

  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  const payload = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    const parsedMessage = parseApiErrorMessage(payload);
    const message = parsedMessage || `Erro ao comunicar com a API (HTTP ${response.status}).`;

    throw new Error(message);
  }

  return payload;
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}