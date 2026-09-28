import { Link } from "react-router-dom";

const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}
function vehicleName(reservation) {
  const vehicle = reservation?.veiculo || {};
  const model = vehicle.modeloVeiculo || vehicle;
  return [model.marca, model.modelo].filter(Boolean).join(" ") || "Veículo reservado";
}

export default function ActiveReservationCard({ reservation }) {
  if (!reservation) return null;

  const inProgress = reservation.status === "EM_ANDAMENTO";
  const action = inProgress
    ? { to: `/reserva/${reservation.id}/localizacao`, label: "Acompanhar viagem" }
    : { to: "/desbloqueio", state: { reservaId: reservation.id }, label: "Abrir reserva" };

  return (
    <aside className="active-reservation-card" aria-labelledby="active-reservation-title">
      <div>
        <p className="mova-eyebrow">Estado atual</p>
        <h2 id="active-reservation-title">Sua reserva ativa</h2>
        <p className="active-reservation-card__status">{inProgress ? "Em andamento" : "Confirmada"}</p>
      </div>
      <dl>
        <div><dt>Veículo</dt><dd>{vehicleName(reservation)}</dd></div>
        <div><dt>Retirada</dt><dd>{formatDate(reservation.dataHoraInicio)}</dd></div>
        <div><dt>Devolução</dt><dd>{formatDate(reservation.dataHoraFim)}</dd></div>
        <div><dt>Garagem</dt><dd>{reservation.garagemRetirada?.nome || "Não informada"}</dd></div>
      </dl>
      <div className="active-reservation-card__actions">
        <Link className="mova-button" to={action.to} state={action.state}>{action.label}</Link>
        <Link className="mova-button mova-button--secondary" to="/historico">Ver reservas</Link>
      </div>
    </aside>
  );
}
