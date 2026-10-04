import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";

function token() {
  return getAuthSession()?.token;
}

export async function listarFavoritos() {
  return apiRequestPaginado("/favorito", { authToken: token() });
}

export async function favoritar(idVeiculo) {
  const data = await apiRequest("/favorito", {
    method: "POST",
    authToken: token(),
    body: JSON.stringify({ idVeiculo }),
  });
  return data.result ?? data;
}

export async function desfavoritar(idVeiculo) {
  await apiRequest(`/favorito/veiculo/${idVeiculo}`, {
    method: "DELETE",
    authToken: token(),
  });
}
