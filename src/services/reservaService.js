import { t } from "../i18n";
import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

export async function createReserva(payload) {
  const data = await apiRequest("/reserva", {
    method: "POST",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

export async function updateReserva(id, payload) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

export async function iniciarPagamento(id, { metodoPagamento, cartao } = {}) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/pagamento`, {
    method: "POST",
    body: JSON.stringify({
      metodoPagamento,
      ...(cartao ? { cartao } : {}),
    }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

export async function desbloquearReserva(id, codigo, coord) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/desbloqueio`, {
    method: "POST",
    body: JSON.stringify({ codigo, ...coordBody(coord) }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

export async function desbloquearReservaPorQr(id, qr, coord) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/desbloqueio/qr`, {
    method: "POST",
    body: JSON.stringify({ qr, ...coordBody(coord) }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id/desbloqueio/qr — retorna { qr } (token assinado). */
export async function getQrDesbloqueio(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/desbloqueio/qr`, authHeaders());
  return (data.result ?? data)?.qr ?? "";
}

function coordBody(coord) {
  const { latitude, longitude } = coord ?? {};
  return typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : {};
}

/** Endpoint: GET /reserva/:id */
export async function getReservaById(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}`, authHeaders());
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id/localizacao — última posição autorizada pela reserva. */
export async function getRastreamentoReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/localizacao`, authHeaders());
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id/pagamento — projeção financeira sanitizada. */
export async function getPagamentoReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/pagamento`, authHeaders());
  return data.result ?? data;
}

/** Cria/obtém o token persistente de compartilhamento da reserva. */
export async function criarCompartilhamentoReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/compartilhamento`, {
    method: "POST",
    ...authHeaders(),
  });
  const result = data.result ?? data;
  return {
    ...result,
    url: result.url ?? buildShareUrl(result.urlPath),
  };
}

/** Revoga o token público ativo da reserva. */
export async function revogarCompartilhamentoReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  await apiRequest(`/reserva/${id}/compartilhamento`, {
    method: "DELETE",
    ...authHeaders(),
  });
}

/** Monta a URL pública sem fixar localhost como configuração permanente. */
export function buildShareUrl(urlPath) {
  if (!urlPath) throw new Error(t("errors.missingSharePath"));
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const configuredBase = import.meta.env.VITE_APP_URL;
  const fallbackBase = typeof window !== "undefined" ? window.location.origin : "";
  const base = (configuredBase || fallbackBase).replace(/\/$/, "");
  const path = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return `${base}${path}`;
}

/** Registra a devolução. O servidor define o instante e a cobrança de atraso. */
export async function devolverReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/devolucao`, {
    method: "POST",
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Solicita o cancelamento; multa e status são definidos pelo backend. */
export async function cancelarReserva(id) {
  if (!id) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/reserva/${id}/cancelar`, {
    method: "POST",
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /reserva/locatario/:id_locatario */
export async function listReservasDoLocatario(idLocatario) {
  if (!idLocatario) throw new Error(t("errors.missingRenterId"));
  return apiRequestPaginado(`/reserva/locatario/${idLocatario}`, authHeaders());
}

export async function getReservasDoLocatarioPage(idLocatario, { page = 1, limit = 10 } = {}) {
  if (!idLocatario) throw new Error(t("errors.missingRenterId"));
  const data = await apiRequest(
    `/reserva/locatario/${idLocatario}?page=${page}&limit=${limit}`,
    authHeaders(),
  );
  return {
    reservas: data.result ?? [],
    pagination: data.pagination ?? { page, limit, total: 0, totalPages: 0 },
  };
}
