import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function token() {
  return getAuthSession()?.token;
}

export async function listarPreferencias() {
  const data = await apiRequest("/notificacao/preferencias", { authToken: token() });
  return data.result ?? [];
}

/** Endpoint: PUT /notificacao/preferencias — corpo { canal, tipo, habilitado }. */
export async function definirPreferencia({ canal, tipo, habilitado }) {
  const data = await apiRequest("/notificacao/preferencias", {
    method: "PUT",
    authToken: token(),
    body: JSON.stringify({ canal, tipo, habilitado }),
  });
  return data.result ?? data;
}
