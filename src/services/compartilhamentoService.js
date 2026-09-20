import { apiRequest } from "./apiClient";

/** Consulta o DTO público; não envia sessão nem qualquer dado do Locatário. */
export async function getCompartilhamentoPublico(token) {
  if (!token) throw new Error("Token de compartilhamento não informado.");
  const data = await apiRequest(`/compartilhamento/${encodeURIComponent(token)}`);
  return data.result ?? data;
}
