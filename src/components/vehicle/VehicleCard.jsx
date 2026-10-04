import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faCheck, faHeart as faHeartSolid, faLocationDot, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { formatCambio, formatCategoria, vehicleTitle } from "../../utils/vehicleDisplay";
import { formatMoneyBRL } from "../../utils/reservationMath";
import VehicleMedia from "./VehicleMedia";

const STATUS_LABEL = {
  RESERVADO: "Reservado",
  MANUTENCAO: "Em manutenção",
  INATIVO: "Indisponível",
};

function field(vehicle, name) {
  return vehicle?.[name] ?? vehicle?.modeloVeiculo?.[name];
}

/**
 * Cartão de veículo (catálogo, lista da jornada e favoritos).
 * Ordem de leitura do brief: foto → nome/ano → dados principais →
 * acessibilidade → garagem → preço → ações. A acessibilidade aparece sempre,
 * inclusive no "não": escondê-la tiraria a informação de quem depende dela.
 * O título é o único link do cartão; as ações ficam em botões próprios.
 */
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
  const adaptado = field(vehicle, "adaptado") === true;
  const eletrico = field(vehicle, "eletrico") === true;
  const diaria = field(vehicle, "valorDiaria");
  const status = STATUS_LABEL[vehicle?.status];
  const garagem = garageLabel ?? vehicle?.garagem?.nome ?? vehicle?.garagemNome ?? "Local não informado";

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
            <span className="sr-only">{favorite.active ? `Remover ${nome} dos favoritos` : `Adicionar ${nome} aos favoritos`}</span>
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

        <ul className="vcard__specs" aria-label="Características">
          {cambio ? <li>{formatCambio(cambio)}</li> : null}
          {capacidade ? <li>{capacidade} lugares</li> : null}
        </ul>

        <p className="vcard__access">
          {adaptado ? (
            <span className="vcard__access-yes"><FontAwesomeIcon icon={faCheck} aria-hidden="true" />Adaptado PCD</span>
          ) : (
            <span className="vcard__access-no"><FontAwesomeIcon icon={faXmark} aria-hidden="true" />Sem adaptação PCD</span>
          )}
          {eletrico ? <span className="vcard__access-energy"><FontAwesomeIcon icon={faBolt} aria-hidden="true" />Elétrico</span> : null}
        </p>

        <p className="vcard__garage">
          <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
          <span><span className="sr-only">Retirada: </span>{garagem}</span>
        </p>

        <div className="vcard__foot">
          <p className="vcard__price">
            {diaria != null && Number.isFinite(Number(diaria)) ? (
              <><strong className="tabular">{formatMoneyBRL(Number(diaria))}</strong> <span>/dia</span></>
            ) : (
              <span>Diária indisponível</span>
            )}
          </p>
          {actions ? <div className="vcard__actions">{actions}</div> : null}
        </div>
        {note ? <p className="vcard__note" id={noteId}>{note}</p> : null}
      </div>
    </article>
  );
}
