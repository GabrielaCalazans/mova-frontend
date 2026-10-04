import { Link } from "react-router-dom";
import { formatDate as formatLocaleDate, t } from "../i18n";

const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatDate(value) {
  return formatLocaleDate(value, { dateStyle: "short", timeStyle: "short", timeZone: DISPLAY_TIME_ZONE })
    || t("common.activeReservation.dateMissing");
}
function vehicleName(reservation) {
  const vehicle = reservation?.veiculo || {};
  const model = vehicle.modeloVeiculo || vehicle;
  return [model.marca, model.modelo].filter(Boolean).join(" ") || t("common.activeReservation.fallbackVehicle");
}

export default function ActiveReservationCard({ reservation }) {
  if (!reservation) return null;

  const inProgress = reservation.status === "EM_ANDAMENTO";
  const action = inProgress
    ? { to: `/reserva/${reservation.id}/localizacao`, label: t("common.activeReservation.track") }
    : { to: "/desbloqueio", state: { reservaId: reservation.id }, label: t("common.activeReservation.open") };

  return (
    <aside className="active-reservation-card" aria-labelledby="active-reservation-title">
      <div>
        <h2 id="active-reservation-title">{t("common.activeReservation.title")}</h2>
        <p className={`badge ${inProgress ? "badge--info" : "badge--success"} active-reservation-card__status`}>
          {t(inProgress ? "common.activeReservation.inProgress" : "common.activeReservation.confirmed")}
        </p>
      </div>
      <dl>
        <div><dt>{t("common.activeReservation.vehicle")}</dt><dd>{vehicleName(reservation)}</dd></div>
        <div><dt>{t("common.activeReservation.garage")}</dt><dd>{reservation.garagemRetirada?.nome || t("common.activeReservation.garageMissing")}</dd></div>
        <div><dt>{t("common.activeReservation.pickup")}</dt><dd className="tabular">{formatDate(reservation.dataHoraInicio)}</dd></div>
        <div><dt>{t("common.activeReservation.return")}</dt><dd className="tabular">{formatDate(reservation.dataHoraFim)}</dd></div>
      </dl>
      <div className="active-reservation-card__actions">
        <Link className="btn" to={action.to} state={action.state}>{action.label}</Link>
        <Link className="btn btn--secondary" to="/historico">{t("common.activeReservation.viewAll")}</Link>
      </div>
    </aside>
  );
}
