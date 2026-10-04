import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";
import fiatArgoImg from "../assets/fiat-argo-drive.png";
import hb20Img from "../assets/hiunday-hb20-plus.png";
import onixImg from "../assets/chevrolet-onix-flex.png";

// MODEL_DETAILS contains visual assets only. Functional attributes come from the API.
const MODEL_DETAILS = {
  "fiat argo": { image: fiatArgoImg },
  "hyundai hb20": { image: hb20Img },
  "chevrolet onix": { image: onixImg },
  "honda civic": { image: null },
};

const CATEGORY_LABELS = {
  ECONOMICO: "Econômico",
  ESPACOSO: "Espaçoso",
  EXECUTIVO: "Executivo",
  PCD: "PCD",
  ELETRICO: "Elétrico",
};

function resolveVehicleField(vehicle, field) {
  return vehicle?.[field] ?? vehicle?.modeloVeiculo?.[field];
}

export function vehicleTitle(vehicle) {
  return [resolveVehicleField(vehicle, "marca"), resolveVehicleField(vehicle, "modelo")].filter(Boolean).join(" ") || "Veículo";
}

// RN01 (backend, services/reserva.ts): adaptado OU categoria PCD exige
// deficiência declarada. A UI usa o mesmo predicado.
export function isVeiculoPcd(vehicle) {
  return resolveVehicleField(vehicle, "adaptado") === true || resolveVehicleField(vehicle, "categoria") === "PCD";
}

export function formatCategoria(categoria) {
  return CATEGORY_LABELS[categoria] ?? "Não informado";
}

export function formatCambio(cambio) {
  if (!cambio) return "Não informado";
  if (String(cambio).toLowerCase() === "automatico") return "Automático";
  return String(cambio);
}

export function getVehicleCharacteristics(vehicle) {
  const characteristics = [];
  const cambio = resolveVehicleField(vehicle, "cambio");
  const capacidade = resolveVehicleField(vehicle, "capacidade");
  const categoria = resolveVehicleField(vehicle, "categoria");

  if (cambio) characteristics.push(formatCambio(cambio));
  if (capacidade !== undefined && capacidade !== null && capacidade !== "") {
    characteristics.push(`${capacidade} lugares`);
  }
  if (categoria) characteristics.push(formatCategoria(categoria));
  if (resolveVehicleField(vehicle, "eletrico") === true) characteristics.push("Elétrico");
  if (isVeiculoPcd(vehicle)) characteristics.push("Adaptado PCD");

  return characteristics;
}

export function resolveTipoIcon(tipoFiltro) {
  if (tipoFiltro === "executivo") return executivoImg;
  if (tipoFiltro === "espacoso") return executivoImg;
  if (tipoFiltro === "adaptado") return adaptadoImg;
  if (tipoFiltro === "eletrico") return eletricoImg;
  return economicoImg;
}

/**
 * Imagem do veículo sem inventar: 1) foto real da API (com alt do locador);
 * 2) foto ilustrativa empacotada do mesmo modelo, rotulada como tal;
 * 3) nenhuma — a UI mostra um marcador "sem foto" em vez de um ícone de
 * categoria fingindo ser o carro.
 */
export function resolveVehicleImages(vehicle) {
  const marca = resolveVehicleField(vehicle, "marca") || "";
  const modelo = resolveVehicleField(vehicle, "modelo") || "";
  const nome = `${marca} ${modelo}`.trim() || "Veículo";
  const reais = (Array.isArray(vehicle?.imagens) ? vehicle.imagens : [])
    .filter((imagem) => imagem?.url)
    .map((imagem) => ({ src: imagem.url, alt: imagem.altText || `Foto de ${nome}`, kind: "real" }));
  if (reais.length) return reais;
  const ilustrativa = MODEL_DETAILS[nome.toLowerCase()]?.image;
  return ilustrativa ? [{ src: ilustrativa, alt: `Foto ilustrativa de ${nome}`, kind: "illustrative" }] : [];
}

export function resolveModelDetails(marca, modelo, tipoFiltro) {
  const key = `${marca} ${modelo}`.trim().toLowerCase();
  const details = MODEL_DETAILS[key];

  return {
    image: details?.image || resolveTipoIcon(tipoFiltro),
  };
}
