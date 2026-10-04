import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

// RN09: histórico (somente leitura) das alterações de um recurso do locador.
export async function listHistoricoVeiculo(idVeiculo) {
  const data = await apiRequest(`/auditoria?entidade=VEICULO&idEntidade=${encodeURIComponent(idVeiculo)}&limit=50`, {
    authToken: getAuthSession()?.token,
  });
  return data.result ?? [];
}
