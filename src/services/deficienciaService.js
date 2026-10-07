import { apiRequest } from "./apiClient";

export async function listDeficiencias() {
  try {
    const data = await apiRequest("/deficiencia/all");
    return data.result ?? [];
  } catch (error) {
    console.error("[deficienciaService] Falha ao buscar /deficiencia/all:", error?.message || "erro desconhecido");
    return [];
  }
}
