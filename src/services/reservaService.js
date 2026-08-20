import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

/**
 * Cria uma reserva. Endpoint: POST /reserva
 * Campos esperados (createReservaSchema): idVeiculo, idLocatario,
 * deficienciaId?, idGaragemRetirada?, idGaragemDevolucao?, dataHoraInicio,
 * dataHoraFim, valorTotal, servicosIds?, status?, statusPagamento?.
 */
export async function createReserva(payload) {
  const data = await apiRequest("/reserva", {
    method: "POST",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/**
 * Atualiza uma reserva (ex.: confirmar pagamento). Endpoint: PUT /reserva/:id
 * Quando statusPagamento vira "SUCESSO" pela primeira vez, o backend gera
 * automaticamente o codigoDesbloqueio (formato XXXX-XXXX) na resposta.
 */
export async function updateReserva(id, payload) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: POST /reserva/:id/desbloqueio — body: { codigo: "XXXX-XXXX" } */
export async function desbloquearReserva(id, codigo) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}/desbloqueio`, {
    method: "POST",
    body: JSON.stringify({ codigo }),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /reserva/:id */
export async function getReservaById(id) {
  if (!id) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/reserva/${id}`, authHeaders());
  return data.result ?? data;
}

/** Endpoint: GET /reserva/locatario/:id_locatario */
export async function listReservasDoLocatario(idLocatario) {
  if (!idLocatario) throw new Error("ID do locatário não informado.");
  const data = await apiRequest(`/reserva/locatario/${idLocatario}`, authHeaders());
  return data.result ?? [];
}
