import { useEffect, useMemo, useState } from "react";
import { rotulo, STATUS_RESERVA_LABELS } from "../services/apiEnums";
import { CircleCheck, CircleX, Clock, ChevronLeft, ChevronRight, KeyRound, CalendarCheck } from "lucide-react";
import { getReservas } from "../services/dashboardService";
import { listFrota } from "../services/veiculoService";
import { formatDate, t } from "../i18n";
import "../styles/owner.css";

const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";
const STATUS_OPTIONS = ["AGUARDANDO_PAGAMENTO", "CONFIRMADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"];

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
      {status ? rotulo(STATUS_RESERVA_LABELS, status) : t("owner.reservations.notInformed")}
    </span>
  );
}

function reservationQuery(filters, page) {
  const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined && value !== null));
  if (page > 1) query.page = page;
  return query;
}

function formatDateTime(value) {
  return formatDate(value, { dateStyle: "short", timeStyle: "short", timeZone: DISPLAY_TIME_ZONE }) || t("owner.reservations.dateNotInformed");
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
      setError(requestError?.message || t("owner.reservations.loadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = t("owner.reservations.docTitle");
    let active = true;
    Promise.allSettled([getReservas(), listFrota()]).then(([reservasResult, fleetResult]) => {
      if (!active) return;
      if (reservasResult.status === "fulfilled") setReport(reservasResult.value);
      else setError(reservasResult.reason?.message || t("owner.reservations.loadError"));
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
      setError(t("owner.common.dateRangeError"));
      return;
    }
    setAppliedFilters(filters);
    void loadReservations(filters, 1);
  }

  return (
    <main className="owner-page" aria-labelledby="owner-reservations-title">
      <header className="page-head">
        <h1 id="owner-reservations-title">{t("owner.reservations.title")}</h1>
        <p className="page-head__lede">{t("owner.reservations.lede", { timeZone: DISPLAY_TIME_ZONE })}</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={applyFilters} aria-describedby="owner-reservations-filter-help">
          <fieldset className="fieldset">
            <legend>{t("owner.common.filterReservations")}</legend>
            <div className="owner-filter__grid">
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-start">{t("owner.common.startDate")}</label>
                <input className="field__control" id="owner-reservations-start" type="date" value={filters.dataInicio} onChange={(event) => setFilters((current) => ({ ...current, dataInicio: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-end">{t("owner.common.endDate")}</label>
                <input className="field__control" id="owner-reservations-end" type="date" value={filters.dataFim} onChange={(event) => setFilters((current) => ({ ...current, dataFim: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-status">{t("owner.common.status")}</label>
                <select className="field__control" id="owner-reservations-status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                  <option value="">{t("owner.reservations.allStatuses")}</option>
                  {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{t(`owner.reservations.statusOptions.${value}`)}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="owner-reservations-vehicle">{t("owner.common.vehicle")}</label>
                <select className="field__control" id="owner-reservations-vehicle" value={filters.idVeiculo} onChange={(event) => setFilters((current) => ({ ...current, idVeiculo: event.target.value }))}>
                  <option value="">{t("owner.common.allVehicles")}</option>
                  {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button className="btn" type="submit" disabled={loading}>{t("owner.common.applyFilters")}</button>
            <p id="owner-reservations-filter-help" className="owner-filter__help">{t("owner.reservations.filterHelp", { timeZone: DISPLAY_TIME_ZONE })}</p>
          </div>
        </form>
        {error && <p className="alert alert--danger" role="alert">{error}</p>}
        {loading && <p className="loading-state" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" />{report ? t("owner.reservations.updating") : t("owner.reservations.loadingList")}</p>}
      </div>
      {report && (
        <section className="owner-section" aria-label={t("owner.reservations.listLabel")}>
          <p className="resultbar"><span><strong>{report.total ?? 0}</strong> {t("owner.reservations.resultCount", { count: report.total ?? 0 })}</span></p>
          {!report.reservas?.length && (
            <div className="state-block">
              <p className="state-block__title">{t("owner.common.noReservations")}</p>
              <p className="state-block__text">{t("owner.reservations.emptyText")}</p>
            </div>
          )}
          {!!report.reservas?.length && (
            <div className="owner-table-wrap" tabIndex="0" aria-label={t("owner.reservations.tableLabel")}>
              <table className="owner-table">
                <caption className="sr-only">{t("owner.reservations.tableCaption")}</caption>
                <thead><tr><th scope="col">{t("owner.common.vehicle")}</th><th scope="col">{t("owner.reservations.colPeriod")}</th><th scope="col">{t("owner.common.status")}</th><th scope="col">{t("owner.reservations.colPickup")}</th></tr></thead>
                <tbody>{report.reservas.map((reserva) => (
                  <tr key={reserva.id}>
                    <th scope="row" data-label={t("owner.common.vehicle")}>{[reserva.veiculo?.marca || reserva.veiculo?.modeloVeiculo?.marca, reserva.veiculo?.modelo || reserva.veiculo?.modeloVeiculo?.modelo].filter(Boolean).join(" ") || reserva.idVeiculo}</th>
                    <td data-label={t("owner.reservations.colPeriod")}><span><time dateTime={reserva.dataHoraInicio}>{formatDateTime(reserva.dataHoraInicio)}</time> — <time dateTime={reserva.dataHoraFim}>{formatDateTime(reserva.dataHoraFim)}</time></span></td>
                    <td data-label={t("owner.common.status")}><ReservationStatus status={reserva.status} /></td>
                    <td data-label={t("owner.reservations.colPickup")}>{reserva.garagemRetirada?.nome || t("owner.reservations.garageNotInformed")}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {(report.pagination?.totalPages || 0) > 1 && (
            <nav className="owner-pagination" aria-label={t("owner.reservations.paginationLabel")}>
              <button className="btn btn--secondary" type="button" aria-label={t("owner.reservations.prevPage")} disabled={page <= 1 || loading} onClick={() => void loadReservations(appliedFilters, page - 1)}><ChevronLeft className="icon" aria-hidden="true" />{t("owner.reservations.prev")}</button>
              <span aria-live="polite">{t("owner.reservations.pageOf", { page, pages: report.pagination.totalPages, total: report.pagination.total })}</span>
              <button className="btn btn--secondary" type="button" aria-label={t("owner.reservations.nextPage")} disabled={page >= report.pagination.totalPages || loading} onClick={() => void loadReservations(appliedFilters, page + 1)}>{t("owner.reservations.next")}<ChevronRight className="icon" aria-hidden="true" /></button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}
