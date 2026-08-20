import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";

/**
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
 * Normaliza um veículo do novo modelo da API, onde os dados descritivos
 * ficam em modeloVeiculo (objeto aninhado), mantendo compatibilidade com
 * o restante do front-end que acessa marca, modelo, ano, etc. no nível raiz.
 *
 * Novo formato: { id, idLocador, idModeloVeiculo, modeloVeiculo: { marca, modelo, ano, cambio,
 *   capacidade, eletrico, adaptado, ... }, garagemId, placa, status, criadoEm }
 *
 * @param {Object} veiculo - Objeto bruto retornado pela API
 * @returns {Object} Objeto normalizado com todos os campos no nível raiz
 */
export function normalizeVeiculo(veiculo) {
  if (!veiculo) return veiculo;

  const mv = veiculo.modeloVeiculo ?? {};

  return {
    // Campos do veículo individual
    id: veiculo.id,
    idLocador: veiculo.idLocador,
    idModeloVeiculo: veiculo.idModeloVeiculo,
    garagemId: veiculo.garagemId,
    placa: veiculo.placa,
    status: veiculo.status,
    criadoEm: veiculo.criadoEm,

    // Campos do modeloVeiculo promovidos para o nível raiz
    marca: mv.marca ?? veiculo.marca,
    modelo: mv.modelo ?? veiculo.modelo,
    ano: mv.ano ?? veiculo.ano,
    cambio: mv.cambio ?? veiculo.cambio,
    capacidade: mv.capacidade ?? veiculo.capacidade,
    eletrico: mv.eletrico ?? veiculo.eletrico,
    adaptado: mv.adaptado ?? veiculo.adaptado,

    // Mantém o objeto aninhado para acesso direto quando necessário
    modeloVeiculo: mv,
  };
}

/**
<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
 * Busca veículos públicos com filtros opcionais (sem autenticação obrigatória).
 * Endpoint: GET /veiculo/search
 *
 * @param {Object} filters
 * @param {string} [filters.marca]
 * @param {string} [filters.modelo]
 * @param {number} [filters.ano]
<<<<<<< HEAD
<<<<<<< HEAD
 * @param {string} [filters.cambio]       - "Manual" | "Automatico"
=======
 * @param {string} [filters.cambio]       - "Manual" | "Automático"
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
 * @param {string} [filters.cambio]       - "Manual" | "Automatico"
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
 * @param {number} [filters.capacidade]
 * @param {boolean} [filters.eletrico]
 * @param {boolean} [filters.adaptado]
 * @returns {Promise<Array>}
 */
export async function searchVeiculos(filters = {}) {
  const params = new URLSearchParams();

  if (filters.marca)      params.set("marca", filters.marca);
  if (filters.modelo)     params.set("modelo", filters.modelo);
  if (filters.ano)        params.set("ano", String(filters.ano));
  if (filters.cambio)     params.set("cambio", filters.cambio);
  if (filters.capacidade) params.set("capacidade", String(filters.capacidade));
  if (filters.eletrico !== undefined) params.set("eletrico", String(filters.eletrico));
  if (filters.adaptado  !== undefined) params.set("adaptado",  String(filters.adaptado));

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/veiculo/search${query}`);
<<<<<<< HEAD
<<<<<<< HEAD
  const result = data.result ?? [];
  return result.map(normalizeVeiculo);
=======
  return data.result ?? [];
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  const result = data.result ?? [];
  return result.map(normalizeVeiculo);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
}

/**
 * Lista veículos autenticados (com token do locatário/admin).
 * Endpoint: GET /veiculo/
<<<<<<< HEAD
 * Os mesmos filtros de searchVeiculos se aplicam, além de idLocador e garagemId.
=======
 * Os mesmos filtros de searchVeiculos se aplicam.
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
 */
export async function listVeiculos(filters = {}) {
  const session = getAuthSession();
  const authToken = session?.token;

  const params = new URLSearchParams();
  if (filters.marca)      params.set("marca", filters.marca);
  if (filters.modelo)     params.set("modelo", filters.modelo);
  if (filters.ano)        params.set("ano", String(filters.ano));
  if (filters.cambio)     params.set("cambio", filters.cambio);
  if (filters.capacidade) params.set("capacidade", String(filters.capacidade));
  if (filters.eletrico !== undefined) params.set("eletrico", String(filters.eletrico));
  if (filters.adaptado  !== undefined) params.set("adaptado",  String(filters.adaptado));
<<<<<<< HEAD
  if (filters.idLocador)  params.set("idLocador", filters.idLocador);
  if (filters.garagemId)  params.set("garagemId", filters.garagemId);

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/veiculo${query}`, { authToken });
  const result = data.result ?? [];
  return result.map(normalizeVeiculo);
}

/**
 * Cria um veículo novo (uso do locador). Endpoint: POST /veiculo
 * Campos esperados (createVeiculoSchema no backend): idLocador, placa, marca,
 * modelo, ano, cambio, capacidade, status?, eletrico, adaptado.
 */
export async function createVeiculo(payload) {
  const session = getAuthSession();
  const authToken = session?.token;

  const data = await apiRequest("/veiculo", {
    method: "POST",
    authToken,
    body: JSON.stringify(payload),
  });

  return normalizeVeiculo(data.result ?? data);
}

/**
 * Atualiza campos de um veículo existente. Endpoint: PUT /veiculo/:id
 * Aceita qualquer subconjunto de updateVeiculoSchema (placa, marca, modelo,
 * ano, cambio, capacidade, status, eletrico, adaptado).
 */
export async function updateVeiculo(id, payload) {
  if (!id) {
    throw new Error("ID do veículo não informado.");
  }

  const session = getAuthSession();
  const authToken = session?.token;

  const data = await apiRequest(`/veiculo/${id}`, {
    method: "PUT",
    authToken,
    body: JSON.stringify(payload),
  });

  return normalizeVeiculo(data.result ?? data);
}

/**
 * Remove um veículo. Endpoint: DELETE /veiculo/:id
 */
export async function deleteVeiculo(id) {
  if (!id) {
    throw new Error("ID do veículo não informado.");
  }

  const session = getAuthSession();
  const authToken = session?.token;

  await apiRequest(`/veiculo/${id}`, {
    method: "DELETE",
    authToken,
  });
=======

  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`/veiculo${query}`, { authToken });
<<<<<<< HEAD
  return data.result ?? [];
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  const result = data.result ?? [];
  return result.map(normalizeVeiculo);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
}

/**
 * Busca os detalhes completos de um veículo pelo id.
 * Endpoint: GET /veiculo/:id
 */
export async function getVeiculoById(id) {
  if (!id) {
    throw new Error("ID do veículo não informado.");
  }

  const session = getAuthSession();
  const authToken = session?.token;
  const data = await apiRequest(`/veiculo/${id}`, { authToken });

<<<<<<< HEAD
<<<<<<< HEAD
  const raw = data.result ?? data;
  return normalizeVeiculo(raw);
=======
  return data.result ?? data;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  const raw = data.result ?? data;
  return normalizeVeiculo(raw);
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
}