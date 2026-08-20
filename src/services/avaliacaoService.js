import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

/**
 * Cria uma avaliação para uma reserva concluída. Endpoint: POST /avaliacao
 * Campos esperados (createAvaliacaoSchema): idReserva, nota (1 a 5,
 * aceita casas decimais), comentario? (até 255 caracteres).
 */
export async function createAvaliacao(payload) {
  const data = await apiRequest("/avaliacao", {
    method: "POST",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: GET /avaliacao/reserva/:id_reserva */
export async function getAvaliacaoDaReserva(idReserva) {
  if (!idReserva) throw new Error("ID da reserva não informado.");
  const data = await apiRequest(`/avaliacao/reserva/${idReserva}`, authHeaders());
  return data.result ?? null;
}
