import { apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";

/** Catálogo ativo vindo de GET /servico; não há serviços definidos no cliente. */
export async function listServicos() {
  const data = await apiRequestPaginado("/servico", {
    authToken: getAuthSession()?.token,
  });
  return data;
}
