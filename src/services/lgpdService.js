import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function token() {
  return getAuthSession()?.token;
}

export async function exportarMeusDados() {
  const data = await apiRequest("/lgpd/meus-dados", { authToken: token() });
  return data.result ?? data;
}

export async function anonimizarMinhaConta() {
  const data = await apiRequest("/lgpd/anonimizar", {
    method: "POST",
    authToken: token(),
  });
  return data.result ?? data;
}
