import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarSide } from "@fortawesome/free-solid-svg-icons";
import { resolveVehicleImages } from "../../utils/vehicleDisplay";
import { t } from "../../i18n";

/**
 * Mídia do veículo em proporção fixa e `object-fit: contain`: o carro inteiro
 * aparece, sem cortar para-choque nem rodas. Sem foto, um marcador neutro
 * diz isso em texto — nunca um ícone de categoria posando de foto.
 */
export default function VehicleMedia({ vehicle, index = 0, eager = false, className = "" }) {
  const images = resolveVehicleImages(vehicle);
  const image = images[index] ?? images[0];

  if (!image) {
    return (
      <div className={`vmedia vmedia--empty ${className}`.trim()}>
        <FontAwesomeIcon icon={faCarSide} aria-hidden="true" />
        <span>{t("common.vehicle.noPhoto")}</span>
      </div>
    );
  }

  return (
    <figure className={`vmedia ${className}`.trim()}>
      <img src={image.src} alt={image.alt} loading={eager ? "eager" : "lazy"} decoding="async" />
      {image.kind === "illustrative" ? <figcaption className="vmedia__flag">{t("common.vehicle.illustrativePhoto")}</figcaption> : null}
    </figure>
  );
}
