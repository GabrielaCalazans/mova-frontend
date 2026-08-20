import { apiRequest } from "./apiClient";

/**
 * Lista as deficiências cadastradas no sistema (endpoint público).
 * Endpoint: GET /deficiencia/all
 * Usado para popular o select opcional de deficiência no cadastro de locatário.
 */
export async function listDeficiencias() {
  try {
    const data = await apiRequest("/deficiencia/all");
    return data.result ?? [];
  } catch (error) {
    // Loga o motivo real (rede, CORS, backend fora do ar, etc.) em vez de
    // esconder o erro — o campo continua opcional e não bloqueia o cadastro,
    // mas agora dá pra saber PORQUE a lista veio vazia.
    console.error("[deficienciaService] Falha ao buscar /deficiencia/all:", error);
    return [];
  }
}
