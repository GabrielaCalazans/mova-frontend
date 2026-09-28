import { useEffect, useMemo, useState } from "react";
import { getReservas } from "../services/dashboardService";
import { listFrota } from "../services/veiculoService";

const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";
const STATUS_OPTIONS = [
  ["AGUARDANDO_PAGAMENTO", "Aguardando pagamento"],
  ["CONFIRMADA", "Confirmada"],
  ["EM_ANDAMENTO", "Em andamento"],
  ["REALIZADA", "Realizada"],
  ["CANCELADA", "Cancelada"],
];

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
        <header className="owner-page__intro">
          <p className="mova-eyebrow">Inventário primeiro</p>
          <h1 id="owner-reservations-title">Reservas da frota</h1>
          <p>Dados retornados pelo relatório do locador. Horários exibidos em {DISPLAY_TIME_ZONE}.</p>
        </header>
        <form className="owner-filter" onSubmit={applyFilters} aria-describedby="owner-reservations-filter-help">
          <fieldset>
            <legend>Filtrar reservas</legend>
            <div className="owner-filter__grid">
              <div>
                <label htmlFor="owner-reservations-start">Data inicial</label>
                <input id="owner-reservations-start" type="date" value={filters.dataInicio} onChange={(event) => setFilters((current) => ({ ...current, dataInicio: event.target.value }))} />
              </div>
              <div>
                <label htmlFor="owner-reservations-end">Data final</label>
                <input id="owner-reservations-end" type="date" value={filters.dataFim} onChange={(event) => setFilters((current) => ({ ...current, dataFim: event.target.value }))} />
              </div>
              <div>
                <label htmlFor="owner-reservations-status">Status</label>
                <select id="owner-reservations-status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                  <option value="">Todos os status</option>
                  {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="owner-reservations-vehicle">Veículo</label>
                <select id="owner-reservations-vehicle" value={filters.idVeiculo} onChange={(event) => setFilters((current) => ({ ...current, idVeiculo: event.target.value }))}>
                  <option value="">Todos os veículos</option>
                  {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <button className="mova-button" type="submit" disabled={loading}>Aplicar filtros</button>
        </form>
        <p id="owner-reservations-filter-help" className="owner-filter__help">Datas são dias UTC inclusivos no contrato. Horários exibidos em {DISPLAY_TIME_ZONE}.</p>
        {error && <p role="alert">{error}</p>}
        {loading && <p role="status" aria-busy="true">{report ? "Atualizando reservas…" : "Carregando reservas…"}</p>}
        {report && (
          <section className="owner-panel" aria-label="Lista de reservas">
            <div>
              <p className="mova-eyebrow">{report.total ?? 0} reserva(s)</p>
              <h2>Período completo</h2>
            </div>
            {!report.reservas?.length && <p>Nenhuma reserva encontrada.</p>}
            {!!report.reservas?.length && (
              <div className="owner-table-wrap" tabIndex="0" aria-label="Tabela de reservas; use rolagem horizontal quando necessário">
                <table className="owner-table">
                  <caption className="sr-only">Reservas retornadas para a frota do locador</caption>
                  <thead><tr><th scope="col">Veículo</th><th scope="col">Período</th><th scope="col">Status</th><th scope="col">Retirada</th></tr></thead>
                  <tbody>{report.reservas.map((reserva) => (
                    <tr key={reserva.id}>
                      <th scope="row">{[reserva.veiculo?.marca || reserva.veiculo?.modeloVeiculo?.marca, reserva.veiculo?.modelo || reserva.veiculo?.modeloVeiculo?.modelo].filter(Boolean).join(" ") || reserva.idVeiculo}</th>
                      <td data-label="Período"><span><time dateTime={reserva.dataHoraInicio}>{formatDate(reserva.dataHoraInicio)}</time> — <time dateTime={reserva.dataHoraFim}>{formatDate(reserva.dataHoraFim)}</time></span></td>
                      <td data-label="Status">{reserva.status}</td>
                      <td data-label="Retirada">{reserva.garagemRetirada?.nome || "Garagem não informada"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {(report.pagination?.totalPages || 0) > 1 && (
              <nav className="owner-pagination" aria-label="Paginação de reservas">
                <button type="button" aria-label="Página anterior" disabled={page <= 1 || loading} onClick={() => void loadReservations(appliedFilters, page - 1)}>Anterior</button>
                <span aria-live="polite">Página {page} de {report.pagination.totalPages} ({report.pagination.total})</span>
                <button type="button" aria-label="Próxima página" disabled={page >= report.pagination.totalPages || loading} onClick={() => void loadReservations(appliedFilters, page + 1)}>Próxima</button>
              </nav>
            )}
          </section>
        )}
    </main>
  );
}
