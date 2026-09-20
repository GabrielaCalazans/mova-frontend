import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";
import fiatArgoImg from "../assets/fiat-argo-drive.png";
import hb20Img from "../assets/hiunday-hb20-plus.png";
import onixImg from "../assets/chevrolet-onix-flex.png";

// Detalhes ilustrativos de imagem, cor, autonomia e garagem. O preço sempre
// vem de valorDiaria retornado pela API, nunca deste catálogo visual.
const MODEL_DETAILS = {
  "fiat argo": { image: fiatArgoImg, cor: "Branco", autonomia: "455km", garagem: "Garagem Norte" },
  "hyundai hb20": { image: hb20Img, cor: "Cinza", autonomia: "255km", garagem: "Garagem Sul" },
  "chevrolet onix": { image: onixImg, cor: "Branco", autonomia: "380km", garagem: "Garagem Centro" },
  "honda civic": { image: null, cor: "Branco", autonomia: "480km", garagem: "Garagem Centro" },
};

export function resolveTipoIcon(tipoFiltro) {
  if (tipoFiltro === "executivo") return executivoImg;
  if (tipoFiltro === "espacoso") return executivoImg;
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
    garagem: details?.garagem || "—",
  };
}
