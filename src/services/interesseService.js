import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import { normalizeVeiculo } from "./veiculoService";

function token() {
  return getAuthSession()?.token;
}

export async function listarInteresses() {
  return apiRequestPaginado("/interesse", { authToken: token() });
}

export async function listarVeiculosParaInteresse() {
  const itens = await apiRequestPaginado("/interesse/veiculos", { authToken: token() });
  return itens.map(normalizeVeiculo);
}

export async function listarNotificacoes() {
  return apiRequestPaginado("/interesse/notificacoes", { authToken: token() });
}

export async function registrarInteresse(idVeiculo) {
  const data = await apiRequest("/interesse", {
    method: "POST",
    authToken: token(),
    body: JSON.stringify({ idVeiculo }),
  });
  return data.result ?? data;
}

export async function cancelarInteresse(idVeiculo) {
  await apiRequest(`/interesse/veiculo/${idVeiculo}`, {
    method: "DELETE",
    authToken: token(),
  });
}
