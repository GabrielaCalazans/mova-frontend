import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  return { authToken: getAuthSession()?.token };
}

export async function listCondutores(idReserva) {
  const data = await apiRequest(`/reserva/${idReserva}/condutores`, authHeaders());
  return data.result ?? data;
}

export async function addCondutor(idReserva, condutor) {
  const data = await apiRequest(`/reserva/${idReserva}/condutores`, {
    method: "POST",
    body: JSON.stringify(condutor),
    ...authHeaders(),
  });
  return data.result ?? data;
}

export async function removeCondutor(idReserva, idCondutor) {
  await apiRequest(`/reserva/${idReserva}/condutores/${idCondutor}`, {
    method: "DELETE",
    ...authHeaders(),
  });
}
