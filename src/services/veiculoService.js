import { t } from "../i18n";
import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";

export function normalizeVeiculo(veiculo) {
  if (!veiculo) return veiculo;

  const mv = veiculo.modeloVeiculo ?? {};

  return {
    // Campos do veículo individual
    id: veiculo.id,
    idLocador: veiculo.idLocador,
    idModeloVeiculo: veiculo.idModeloVeiculo,
    garagemId: veiculo.garagemId,
    garagem: veiculo.garagem ?? null,
    garagemNome: veiculo.garagem?.nome ?? veiculo.garagemNome,
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
    categoria: mv.categoria ?? veiculo.categoria,
    valorDiaria: mv.valorDiaria ?? veiculo.valorDiaria,

    // Mantém o objeto aninhado para acesso direto quando necessário
    modeloVeiculo: mv,
    imagens: Array.isArray(veiculo.imagens) ? veiculo.imagens : [],
  };
}

/** Lista imagens prontas; o backend decide se a consulta é pública ou privada. */
export async function listImagensVeiculo(id) {
  if (!id) throw new Error(t("errors.missingVehicleId"));
  const session = getAuthSession();
  const data = await apiRequest(`/veiculo/${id}/imagens`, { authToken: session?.token });
  return data.result ?? data;
}

/** Upload binário autenticado; nenhuma credencial de storage vai para o browser. */
export async function uploadImagemVeiculo(id, file, altText = "", onProgress) {
  if (!id || !file) throw new Error(t("errors.vehicleFileRequired"));
  const session = getAuthSession();
  const progress = typeof onProgress === "function" ? { onUploadProgress: onProgress } : {};
  const data = await apiRequest(`/veiculo/${id}/imagens`, {
    method: "POST",
    authToken: session?.token,
    body: file,
    contentType: file.type,
    headers: altText ? { "X-Image-Alt": altText } : {},
    ...progress,
  });
  return data.result ?? data;
}

export async function reorderImagensVeiculo(id, imagemIds) {
  const session = getAuthSession();
  const data = await apiRequest(`/veiculo/${id}/imagens/ordem`, {
    method: "PUT",
    authToken: session?.token,
    body: JSON.stringify({ imagemIds }),
  });
  return data.result ?? data;
}

export async function setCapaImagemVeiculo(id, imagemId) {
  const session = getAuthSession();
  const data = await apiRequest(`/veiculo/${id}/imagens/${imagemId}/capa`, {
    method: "POST",
    authToken: session?.token,
  });
  return data.result ?? data;
}

export async function deleteImagemVeiculo(id, imagemId) {
  const session = getAuthSession();
  await apiRequest(`/veiculo/${id}/imagens/${imagemId}`, {
    method: "DELETE",
    authToken: session?.token,
  });
}

export async function listVeiculos(filters = {}) {
  const params = new URLSearchParams();
  if (filters.marca)      params.set("marca", filters.marca);
  if (filters.modelo)     params.set("modelo", filters.modelo);
  if (filters.ano)        params.set("ano", String(filters.ano));
  if (filters.cambio)     params.set("cambio", filters.cambio);
  if (filters.capacidade) params.set("capacidade", String(filters.capacidade));
  if (filters.eletrico !== undefined) params.set("eletrico", String(filters.eletrico));
  if (filters.adaptado  !== undefined) params.set("adaptado",  String(filters.adaptado));
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.idLocador)  params.set("idLocador", filters.idLocador);
  if (filters.garagemId)  params.set("garagemId", filters.garagemId);
  if (filters.pcd !== undefined) params.set("pcd", String(filters.pcd));

  const query = params.toString() ? `?${params.toString()}` : "";
  const itens = await apiRequestPaginado(`/veiculo${query}`, { authToken: undefined });
  return itens.map(normalizeVeiculo);
}

export async function listFrota() {
  const session = getAuthSession();
  const itens = await apiRequestPaginado("/veiculo/meus", {
    authToken: session?.token,
  });
  return itens.map(normalizeVeiculo);
}

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

export async function updateVeiculo(id, payload) {
  if (!id) {
    throw new Error(t("errors.missingVehicleId"));
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

export async function deleteVeiculo(id) {
  if (!id) {
    throw new Error(t("errors.missingVehicleId"));
  }

  const session = getAuthSession();
  const authToken = session?.token;

  await apiRequest(`/veiculo/${id}`, {
    method: "DELETE",
    authToken,
  });
}

export async function getVeiculoById(id) {
  if (!id) {
    throw new Error(t("errors.missingVehicleId"));
  }

  const data = await apiRequest(`/veiculo/${id}`, { authToken: undefined });

  const raw = data.result ?? data;
  return normalizeVeiculo(raw);
}
