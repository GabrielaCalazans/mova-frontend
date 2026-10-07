import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faCheck, faHeart as faHeartSolid, faLocationDot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { formatCambio, formatCategoria, isVeiculoPcd, vehicleTitle } from "../../utils/vehicleDisplay";
import { formatMoneyBRL } from "../../utils/reservationMath";
import VehicleMedia from "./VehicleMedia";
import { t } from "../../i18n";

const UNAVAILABLE = new Set(["RESERVADO", "MANUTENCAO", "INATIVO"]);

function field(vehicle, name) {
  return vehicle?.[name] ?? vehicle?.modeloVeiculo?.[name];
}

export default function VehicleCard({
  vehicle,
  headingLevel = 3,
  titleTo,
  actions,
  favorite,
  note,
  noteId,
  className = "",
  garageLabel,
}) {
  const Heading = `h${headingLevel}`;
  const nome = vehicleTitle(vehicle);
  const ano = field(vehicle, "ano");
  const categoria = field(vehicle, "categoria");
  const cambio = field(vehicle, "cambio");
  const capacidade = field(vehicle, "capacidade");
  const adaptado = isVeiculoPcd(vehicle);
  const eletrico = field(vehicle, "eletrico") === true;
  const diaria = field(vehicle, "valorDiaria");
  const status = UNAVAILABLE.has(vehicle?.status) ? t(`common.vehicle.status.${vehicle.status}`) : null;
  const garagem = garageLabel ?? vehicle?.garagem?.nome ?? vehicle?.garagemNome ?? t("common.vehicle.unknownLocation");

  return (
    <article className={`vcard cursor-card${status ? " vcard--unavailable" : ""} ${className}`.trim()}>
      <div className="vcard__media-wrap">
        <VehicleMedia vehicle={vehicle} />
        {favorite && (
          <button
            type="button"
            className="vcard__favorite"
            aria-pressed={favorite.active}
            onClick={favorite.onToggle}
            disabled={favorite.busy}
          >
            <FontAwesomeIcon icon={favorite.active ? faHeartSolid : faHeart} aria-hidden="true" />
            <span className="sr-only">{t(favorite.active ? "common.vehicle.removeFavorite" : "common.vehicle.addFavorite", { name: nome })}</span>
          </button>
        )}
      </div>

      <div className="vcard__body">
        <div className="vcard__head">
          <Heading className="vcard__title">
            {titleTo ? <Link to={titleTo}>{nome}</Link> : nome}
          </Heading>
          <p className="vcard__meta">
            {ano ? <span className="tabular">{ano}</span> : null}
            {categoria ? <span>{formatCategoria(categoria)}</span> : null}
            {status ? <span className="badge badge--warning">{status}</span> : null}
          </p>
        </div>

        <ul className="vcard__specs" aria-label={t("common.vehicle.features")}>
          {cambio ? <li>{formatCambio(cambio)}</li> : null}
          {capacidade ? <li>{t("common.vehicle.seats", { count: capacidade })}</li> : null}
        </ul>

        <p className="vcard__access">
          {adaptado ? (
            <span className="vcard__access-yes"><FontAwesomeIcon icon={faCheck} aria-hidden="true" />{t("common.vehicle.adapted")}</span>
          ) : (
            <span className="vcard__access-no"><FontAwesomeIcon icon={faXmark} aria-hidden="true" />{t("common.vehicle.notAdapted")}</span>
          )}
          {eletrico ? <span className="vcard__access-energy"><FontAwesomeIcon icon={faBolt} aria-hidden="true" />{t("common.vehicle.electric")}</span> : null}
        </p>

        <p className="vcard__garage">
          <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
          <span><span className="sr-only">{t("common.vehicle.pickupAt")}</span>{garagem}</span>
        </p>

        <div className="vcard__foot">
          <p className="vcard__price">
            {diaria != null && Number.isFinite(Number(diaria)) ? (
              <><strong className="tabular">{formatMoneyBRL(Number(diaria))}</strong> <span>{t("common.vehicle.perDay")}</span></>
            ) : (
              <span>{t("common.vehicle.dailyUnavailable")}</span>
            )}
          </p>
          {actions ? <div className="vcard__actions">{actions}</div> : null}
        </div>
        {note ? <p className="vcard__note" id={noteId}>{note}</p> : null}
      </div>
    </article>
  );
}
