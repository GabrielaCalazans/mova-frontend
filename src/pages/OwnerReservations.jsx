import { useEffect, useMemo, useState } from "react";
import { rotulo, STATUS_RESERVA_LABELS } from "../services/apiEnums";
import { CircleCheck, CircleX, Clock, ChevronLeft, ChevronRight, KeyRound, CalendarCheck } from "lucide-react";
import { getReservas } from "../services/dashboardService";
import { listFrota } from "../services/veiculoService";
import "../styles/owner.css";

const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";
const STATUS_OPTIONS = [
  ["AGUARDANDO_PAGAMENTO", "Aguardando pagamento"],
  ["CONFIRMADA", "Confirmada"],
  ["EM_ANDAMENTO", "Em andamento"],
  ["REALIZADA", "Realizada"],
  ["CANCELADA", "Cancelada"],
];

// Status com ícone e texto: nunca só cor.
const STATUS_TONE = {
  AGUARDANDO_PAGAMENTO: ["warning", Clock],
  PENDENTE: ["warning", Clock],
  CONFIRMADA: ["info", CalendarCheck],
  EM_ANDAMENTO: ["info", KeyRound],
  REALIZADA: ["success", CircleCheck],
  FINALIZADA: ["success", CircleCheck],
  CANCELADA: ["danger", CircleX],
};

function ReservationStatus({ status }) {
  const [tone, Icon] = STATUS_TONE[status] || ["neutral", null];
  return (
    <span className={`badge badge--${tone}`}>
      {Icon && <Icon className="icon-sm" aria-hidden="true" />}
      {status ? rotulo(STATUS_RESERVA_LABELS, status) : "Não informado"}
    </span>
  );
}

function reservationQuery(filters, page) {
  const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined && value !== null));
  if (page > 1) query.page = page;
  return query;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: DISPLAY_TIME_ZONE }).format(date);
}

export default function OwnerReservations() {
  const [report, setReport] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ dataInicio: "", dataFim: "", status: "", idVeiculo: "" });
  const [appliedFilters, setAppliedFilters] = useState({});

  async function loadReservations(nextFilters = {}, nextPage = 1) {
    setLoading(true);
    setError("");
    try {
      setReport(await getReservas(reservationQuery(nextFilters, nextPage)));
      setPage(nextPage);
    } catch (requestError) {
      setReport(null);
      setPage(1);
      setError(requestError?.message || "Não foi possível carregar as reservas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "MOVA - Reservas da frota";
    let active = true;
    Promise.allSettled([getReservas(), listFrota()]).then(([reservasResult, fleetResult]) => {
      if (!active) return;
      if (reservasResult.status === "fulfilled") setReport(reservasResult.value);
      else setError(reservasResult.reason?.message || "Não foi possível carregar as reservas.");
      if (fleetResult.status === "fulfilled") setFleet(fleetResult.value || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const vehicleOptions = useMemo(() => {
    const options = new Map();
    [...fleet, ...(report?.reservas || [])].forEach((item) => {
      const vehicle = item.veiculo || item;
      const id = vehicle.id || item.idVeiculo;
      if (!id) return;
      const name = [vehicle.marca || vehicle.modeloVeiculo?.marca, vehicle.modelo || vehicle.modeloVeiculo?.modelo]
        .filter(Boolean)
        .join(" ");
      options.set(id, { id, label: vehicle.placa || name || id });
    });
    if (filters.idVeiculo && !options.has(filters.idVeiculo)) options.set(filters.idVeiculo, { id: filters.idVeiculo, label: filters.idVeiculo });
    return [...options.values()];
  }, [fleet, filters.idVeiculo, report?.reservas]);

  function applyFilters(event) {
    event.preventDefault();
    if (filters.dataInicio && filters.dataFim && filters.dataFim < filters.dataInicio) {
      setError("A data final deve ser igual ou posterior à data inicial.");
      return;
    }
    setAppliedFilters(filters);
    void loadReservations(filters, 1);
  }

  return (
    <main className="owner-page" aria-labelledby="owner-reservations-title">
      <header className="page-head">
        <h1 id="owner-reservations-title">Reservas da frota</h1>
        <p className="page-head__lede">Dados retornados pelo relatório do locador. Horários exibidos em {DISPLAY_TIME_ZONE}.</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={applyFilters} aria-describedby="owner-reservations-filter-help">
          <fieldset className="fieldset">
            <legend>Filtrar reservas</legend>
            <div className="owner-filter__grid">
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-start">Data inicial</label>
                <input className="field__control" id="owner-reservations-start" type="date" value={filters.dataInicio} onChange={(event) => setFilters((current) => ({ ...current, dataInicio: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-end">Data final</label>
                <input className="field__control" id="owner-reservations-end" type="date" value={filters.dataFim} onChange={(event) => setFilters((current) => ({ ...current, dataFim: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-status">Status</label>
                <select className="field__control" id="owner-reservations-status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                  <option value="">Todos os status</option>
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-vehicle">Veículo</label>
                <select className="field__control" id="owner-reservations-vehicle" value={filters.idVeiculo} onChange={(event) => setFilters((current) => ({ ...current, idVeiculo: event.target.value }))}>
                  <option value="">Todos os veículos</option>
                  {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button className="btn" type="submit" disabled={loading}>Aplicar filtros</button>
            <p id="owner-reservations-filter-help" className="owner-filter__help">Datas são dias UTC inclusivos no contrato. Horários exibidos em {DISPLAY_TIME_ZONE}.</p>
          </div>
        </form>
        {error && <p className="alert alert--danger" role="alert">{error}</p>}
        {loading && <p className="loading-state" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" />{report ? "Atualizando reservas…" : "Carregando reservas…"}</p>}
      </div>
      {report && (
        <section className="owner-section" aria-label="Lista de reservas">
          <p className="resultbar"><span><strong>{report.total ?? 0}</strong> reserva(s) · período completo</span></p>
          {!report.reservas?.length && (
            <div className="state-block">
              <p className="state-block__title">Nenhuma reserva encontrada.</p>
              <p className="state-block__text">Ajuste o período, o status ou o veículo e aplique os filtros novamente.</p>
            </div>
          )}
          {!!report.reservas?.length && (
            <div className="owner-table-wrap" tabIndex="0" aria-label="Tabela de reservas; use rolagem horizontal quando necessário">
              <table className="owner-table">
                <caption className="sr-only">Reservas retornadas para a frota do locador</caption>
                <thead><tr><th scope="col">Veículo</th><th scope="col">Período</th><th scope="col">Status</th><th scope="col">Retirada</th></tr></thead>
                <tbody>{report.reservas.map((reserva) => (
                  <tr key={reserva.id}>
                    <th scope="row">{[reserva.veiculo?.marca || reserva.veiculo?.modeloVeiculo?.marca, reserva.veiculo?.modelo || reserva.veiculo?.modeloVeiculo?.modelo].filter(Boolean).join(" ") || reserva.idVeiculo}</th>
                    <td data-label="Período"><span><time dateTime={reserva.dataHoraInicio}>{formatDate(reserva.dataHoraInicio)}</time> — <time dateTime={reserva.dataHoraFim}>{formatDate(reserva.dataHoraFim)}</time></span></td>
                    <td data-label="Status"><ReservationStatus status={reserva.status} /></td>
                    <td data-label="Retirada">{reserva.garagemRetirada?.nome || "Garagem não informada"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {(report.pagination?.totalPages || 0) > 1 && (
            <nav className="owner-pagination" aria-label="Paginação de reservas">
              <button className="btn btn--secondary" type="button" aria-label="Página anterior" disabled={page <= 1 || loading} onClick={() => void loadReservations(appliedFilters, page - 1)}><ChevronLeft className="icon" aria-hidden="true" />Anterior</button>
              <span aria-live="polite">Página {page} de {report.pagination.totalPages} ({report.pagination.total})</span>
              <button className="btn btn--secondary" type="button" aria-label="Próxima página" disabled={page >= report.pagination.totalPages || loading} onClick={() => void loadReservations(appliedFilters, page + 1)}>Próxima<ChevronRight className="icon" aria-hidden="true" /></button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}
