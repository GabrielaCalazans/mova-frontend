import { t } from "../i18n";
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

const CATEGORIES = new Set(["ECONOMICO", "ESPACOSO", "EXECUTIVO", "PCD", "ELETRICO"]);

function resolveVehicleField(vehicle, field) {
  return vehicle?.[field] ?? vehicle?.modeloVeiculo?.[field];
}

export function vehicleTitle(vehicle) {
  return [resolveVehicleField(vehicle, "marca"), resolveVehicleField(vehicle, "modelo")].filter(Boolean).join(" ") || t("common.vehicle.fallbackName");
}

// RN01 (backend, services/reserva.ts): adaptado OU categoria PCD exige
// deficiência declarada. A UI usa o mesmo predicado.
export function isVeiculoPcd(vehicle) {
  return resolveVehicleField(vehicle, "adaptado") === true || resolveVehicleField(vehicle, "categoria") === "PCD";
}

export function formatCategoria(categoria) {
  return CATEGORIES.has(categoria) ? t(`enums.categoria.${categoria}`) : t("common.vehicle.notInformed");
}

export function formatCambio(cambio) {
  if (!cambio) return t("common.vehicle.notInformed");
  if (String(cambio).toLowerCase() === "automatico") return t("common.vehicle.automatic");
  return String(cambio);
}

export function getVehicleCharacteristics(vehicle) {
  const characteristics = [];
  const cambio = resolveVehicleField(vehicle, "cambio");
  const capacidade = resolveVehicleField(vehicle, "capacidade");
  const categoria = resolveVehicleField(vehicle, "categoria");

  if (cambio) characteristics.push(formatCambio(cambio));
  if (capacidade !== undefined && capacidade !== null && capacidade !== "") {
    characteristics.push(t("common.vehicle.seats", { count: capacidade }));
  }
  if (categoria) characteristics.push(formatCategoria(categoria));
  if (resolveVehicleField(vehicle, "eletrico") === true) characteristics.push(t("common.vehicle.electric"));
  if (isVeiculoPcd(vehicle)) characteristics.push(t("common.vehicle.adapted"));

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
  const nome = `${marca} ${modelo}`.trim();
  const reais = (Array.isArray(vehicle?.imagens) ? vehicle.imagens : [])
    .filter((imagem) => imagem?.url)
    .map((imagem) => ({ src: imagem.url, alt: imagem.altText || t("common.vehicle.photoOf", { name: nome || t("common.vehicle.fallbackName") }), kind: "real" }));
  if (reais.length) return reais;
  const ilustrativa = MODEL_DETAILS[nome.toLowerCase()]?.image;
  return ilustrativa ? [{ src: ilustrativa, alt: t("common.vehicle.illustrativePhotoOf", { name: nome }), kind: "illustrative" }] : [];
}

export function resolveModelDetails(marca, modelo, tipoFiltro) {
  const key = `${marca} ${modelo}`.trim().toLowerCase();
  const details = MODEL_DETAILS[key];

  return {
    image: details?.image || resolveTipoIcon(tipoFiltro),
  };
}
