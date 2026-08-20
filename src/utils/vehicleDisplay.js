import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";
import fiatArgoImg from "../assets/fiat-argo-drive.png";
import hb20Img from "../assets/hiunday-hb20-plus.png";
import onixImg from "../assets/chevrolet-onix-flex.png";

// Detalhes ilustrativos (imagem, cor, preco, autonomia e garagem) para os
// modelos mais comuns do catalogo. Modelos fora desta lista usam um icone
// generico do tipo e valores de preco/autonomia indisponiveis.
const MODEL_DETAILS = {
  "fiat argo": { image: fiatArgoImg, cor: "Branco", autonomia: "455km", precoDia: 95, garagem: "Garagem Norte" },
  "hyundai hb20": { image: hb20Img, cor: "Cinza", autonomia: "255km", precoDia: 90, garagem: "Garagem Sul" },
  "chevrolet onix": { image: onixImg, cor: "Branco", autonomia: "380km", precoDia: 80, garagem: "Garagem Centro" },
  "honda civic": { image: null, cor: "Branco", autonomia: "480km", precoDia: 99, garagem: "Garagem Centro" },
};

export function resolveTipoIcon(tipoFiltro) {
  if (tipoFiltro === "executivo") return executivoImg;
  if (tipoFiltro === "adaptado") return adaptadoImg;
  if (tipoFiltro === "eletrico") return eletricoImg;
  return economicoImg;
}

export function resolveModelDetails(marca, modelo, tipoFiltro) {
  const key = `${marca} ${modelo}`.trim().toLowerCase();
  const details = MODEL_DETAILS[key];

  return {
    image: details?.image || resolveTipoIcon(tipoFiltro),
    cor: details?.cor || "—",
    autonomia: details?.autonomia || "—",
    precoDia: details?.precoDia ?? null,
    garagem: details?.garagem || "—",
  };
}
