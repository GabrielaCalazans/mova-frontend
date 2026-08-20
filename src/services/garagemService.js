import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

function authHeaders() {
  const session = getAuthSession();
  return { authToken: session?.token };
}

/**
 * Lista garagens (somente locador dono / admin). Endpoint: GET /garagem
 * Suporta filtros: idLocador, nome, acessibilidade, capacidadeMin,
 * capacidadeMax, comVagasDisponiveis.
 */
export async function listGaragens(filters = {}) {
  const params = new URLSearchParams();
  if (filters.idLocador) params.set("idLocador", filters.idLocador);
  if (filters.nome) params.set("nome", filters.nome);
  if (filters.acessibilidade !== undefined) params.set("acessibilidade", String(filters.acessibilidade));
  if (filters.capacidadeMin) params.set("capacidadeMin", String(filters.capacidadeMin));
  if (filters.capacidadeMax) params.set("capacidadeMax", String(filters.capacidadeMax));
  if (filters.comVagasDisponiveis !== undefined) {
    params.set("comVagasDisponiveis", String(filters.comVagasDisponiveis));
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/garagem${query}`, authHeaders());
  return data.result ?? [];
}

/** Endpoint: GET /garagem/:id */
export async function getGaragemById(id) {
  if (!id) throw new Error("ID da garagem não informado.");
  const data = await apiRequest(`/garagem/${id}`, authHeaders());
  return data.result ?? data;
}

/**
 * Cria uma garagem. Endpoint: POST /garagem
 * Campos esperados (createGaragemSchema): idLocador, nome, endereco,
 * capacidade (int > 0), acessibilidade? (bool).
 */
export async function createGaragem(payload) {
  const data = await apiRequest("/garagem", {
    method: "POST",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: PUT /garagem/:id — aceita subconjunto de nome/endereco/capacidade/acessibilidade */
export async function updateGaragem(id, payload) {
  if (!id) throw new Error("ID da garagem não informado.");
  const data = await apiRequest(`/garagem/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    ...authHeaders(),
  });
  return data.result ?? data;
}

/** Endpoint: DELETE /garagem/:id */
export async function deleteGaragem(id) {
  if (!id) throw new Error("ID da garagem não informado.");
  await apiRequest(`/garagem/${id}`, { method: "DELETE", ...authHeaders() });
}

/** Endpoint: GET /garagem/:id/veiculos — veículos alocados nesta garagem */
export async function listVeiculosDaGaragem(garagemId, status) {
  if (!garagemId) throw new Error("ID da garagem não informado.");
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiRequest(`/garagem/${garagemId}/veiculos${query}`, authHeaders());
  return data.result ?? [];
}

/** Endpoint: POST /garagem/:garagemId/veiculos/:veiculoId */
export async function alocarVeiculoNaGaragem(garagemId, veiculoId) {
  await apiRequest(`/garagem/${garagemId}/veiculos/${veiculoId}`, {
    method: "POST",
    ...authHeaders(),
  });
}

/** Endpoint: DELETE /garagem/:garagemId/veiculos/:veiculoId */
export async function desalocarVeiculoDaGaragem(garagemId, veiculoId) {
  await apiRequest(`/garagem/${garagemId}/veiculos/${veiculoId}`, {
    method: "DELETE",
    ...authHeaders(),
  });
}
