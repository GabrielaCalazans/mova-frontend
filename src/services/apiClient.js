const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL;

/**
 * Erro de API com o status HTTP preservado. Antes o cliente lançava um Error
 * genérico e quem chamava só conseguia distinguir 401 de 500 por regex na
 * mensagem. Ver auditoria/CONTRATO-FRONTEND-BACKEND.md.
 */
export class ApiError extends Error {
  constructor(message, { status, code, errors, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? 0;
    this.code = code ?? null;
    this.errors = errors ?? null;
    this.payload = payload ?? null;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 400 || this.status === 422;
  }
}

function parseApiErrorMessage(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (typeof payload === "object") {
    // Erros de validacao (Zod) vem como { message: "Invalid Data Format",
    // errors: [{ path: [...], message: "..." }, ...] }. O "message" sozinho
    // e generico; o detalhe util (qual campo, qual regra falhou) esta em
    // "errors". Priorizamos montar uma mensagem legivel a partir dele.
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const detalhes = payload.errors
        .map((issue) => {
          const campo = Array.isArray(issue.path) ? issue.path.join(".") : issue.path;
          const texto = issue.message || "Valor invalido";
          return campo ? `${campo}: ${texto}` : texto;
        })
        .join(" | ");

      return detalhes || payload.message || null;
    }

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
    throw new ApiError("Nao foi possivel conectar com a API.", { status: 0 });
  }

  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  const payload = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    const parsedMessage = parseApiErrorMessage(payload);
    const message = parsedMessage || `Erro ao comunicar com a API (HTTP ${response.status}).`;

    // eslint-disable-next-line no-console
    console.error(
      `[apiRequest] ${requestOptions.method || "GET"} ${path} -> HTTP ${response.status}`,
      { contentType, hasJson, message }
    );

    throw new ApiError(message, {
      status: response.status,
      code: payload?.code ?? null,
      errors: Array.isArray(payload?.errors) ? payload.errors : null,
      payload,
    });
  }

  return payload;
}

/**
 * Consome uma listagem paginada do backend seguindo o pagination.totalPages.
 *
 * Todas as listagens da API respondem
 *   { result: [...], pagination: { total, page, limit, totalPages } }
 * com limit padrao 10. Antes o frontend lia so "result" e silenciosamente
 * mostrava no maximo 10 itens. Aqui a metadata e de fato interpretada.
 *
 * @param {string} path caminho, podendo ja conter query string
 * @param {object} options repassado ao apiRequest (authToken, etc.)
 * @param {{limit?: number, maxPaginas?: number}} opcoes limit maximo da API e 100
 * @returns {Promise<Array>} todos os itens, de todas as paginas
 */
export async function apiRequestPaginado(
  path,
  options = {},
  { limit = 100, maxPaginas = 20 } = {},
) {
  const separador = path.includes("?") ? "&" : "?";
  const itens = [];
  let pagina = 1;
  let totalPaginas = 1;

  do {
    const data = await apiRequest(
      `${path}${separador}page=${pagina}&limit=${limit}`,
      options,
    );
    itens.push(...(data?.result ?? []));
    totalPaginas = data?.pagination?.totalPages ?? 1;
    pagina += 1;
  } while (pagina <= totalPaginas && pagina <= maxPaginas);

  return itens;
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}