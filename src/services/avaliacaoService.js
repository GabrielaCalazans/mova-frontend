import { t } from "../i18n";
import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

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
  if (!idReserva) throw new Error(t("errors.missingReservationId"));
  const data = await apiRequest(`/avaliacao/reserva/${idReserva}`, authHeaders());
  return data.result ?? null;
}
