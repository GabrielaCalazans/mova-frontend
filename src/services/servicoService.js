import { apiRequestPaginado } from "./apiClient";

/** Catálogo ativo vindo de GET /servico; não há serviços definidos no cliente. */
export async function listServicos() {
  const data = await apiRequestPaginado("/servico", { authToken: undefined });
  return data;
}
