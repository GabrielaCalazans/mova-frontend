import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard, getFinanceiro, getReservas, getUtilizacao } from "../services/dashboardService";
import { rotulo, STATUS_RESERVA_LABELS } from "../services/apiEnums";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatDate, formatNumber, t } from "../i18n";
import "../styles/owner.css";
import "../styles/relatorios.css";

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function csvFinanceiro(porVeiculo) {
  return [[t("reports.vehicles.csvVehicle"), t("reports.vehicles.csvRevenue")], ...porVeiculo.map(({ placa, total }) => [placa, total])]
    .map((row) => row.map(csvValue).join(";"))
    .join("\n");
}

function downloadCsv(porVeiculo) {
  const blob = new Blob([`\uFEFF${csvFinanceiro(porVeiculo)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = t("reports.vehicles.financeFile");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Formatadores seguem o idioma ativo (lidos a cada render); a moeda é sempre BRL.
const moeda = (valor) => formatCurrency(valor);
const percentual = (valor) => `${formatNumber(Number(valor || 0) * 100, { maximumFractionDigits: 2 })}%`;
const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";
const data = (valor) => formatDate(valor, { timeZone: DISPLAY_TIME_ZONE }) || "—";

const compacto = (valor) => formatNumber(valor, { notation: "compact" });
const horas = (valor) => `${formatNumber(valor, { maximumFractionDigits: 1 })} h`;

// Gráfico de barras com uma única cor de ação: a cor vem do CSS (relatorios.css),
// então segue o tema. A lista abaixo do gráfico é a alternativa textual.
// Barras horizontais: a placa fica no eixo vertical e nunca se sobrepõe à
// vizinha, nem em 320 px; a altura cresce com o número de veículos.
function GraficoBarras({ dados, campo, formatar }) {
  return (
    <div className="report-chart" aria-hidden="true" style={{ height: dados.length * 44 + 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickFormatter={compacto} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="placa" width={76} tickLine={false} interval={0} />
          <Tooltip formatter={(valor) => formatar(valor)} contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-secondary)" }} />
          <Bar dataKey={campo} radius={[0, 2, 2, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RelatoriosVeiculos() {
  const [relatorios, setRelatorios] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({ dataInicio: "", dataFim: "", idVeiculo: "" });

  const carregarRelatorios = useCallback(async (filtrosAtuais = {}, incluirAgregados = false) => {
    setCarregando(true);
    setErro("");
    try {
      if (!incluirAgregados) {
        const reservas = await getReservas(filtrosAtuais);
        setRelatorios((atual) => ({ ...atual, reservas }));
        return;
      }
      const [reservas, financeiro, utilizacao, avaliacoes] = await Promise.all([
        getReservas(filtrosAtuais),
        getFinanceiro(),
        getUtilizacao(),
        getAvaliacaoDashboard(),
      ]);
      setRelatorios({ reservas, financeiro, utilizacao, avaliacoes });
    } catch {
      setErro(t("reports.vehicles.loadError"));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    document.title = t("reports.vehicles.docTitle");
    const carregamentoInicial = window.setTimeout(() => void carregarRelatorios({}, true), 0);
    return () => window.clearTimeout(carregamentoInicial);
  }, [carregarRelatorios]);

  const porVeiculo = relatorios?.financeiro?.porVeiculo || [];
  const maisUtilizados = relatorios?.utilizacao?.maisUtilizados || [];
  const reservas = relatorios?.reservas?.reservas || [];
  const avaliacoes = relatorios?.avaliacoes?.resumo || {};
  const veiculosFiltro = Array.from(new Map([
    ...porVeiculo.map((veiculo) => [veiculo.idVeiculo, { id: veiculo.idVeiculo, placa: veiculo.placa }]),
    ...reservas.map((reserva) => [reserva.idVeiculo, { id: reserva.idVeiculo, placa: reserva.veiculo?.placa || reserva.idVeiculo }]),
    ...(filtros.idVeiculo ? [[filtros.idVeiculo, { id: filtros.idVeiculo, placa: filtros.idVeiculo }]] : []),
  ]).values());

  function aplicarFiltros(event) {
    event.preventDefault();
    if (filtros.dataInicio && filtros.dataFim && filtros.dataFim < filtros.dataInicio) {
      setErro(t("owner.common.dateRangeError"));
      return;
    }
    void carregarRelatorios(filtros);
  }

  return (
    <main className="owner-page" aria-labelledby="relatorio-veiculos-title">
      <header className="page-head">
        <h1 id="relatorio-veiculos-title">{t("reports.vehicles.title")}</h1>
        <p className="page-head__lede">{t("reports.vehicles.lede")}</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={aplicarFiltros} aria-describedby="relatorio-filtros-ajuda">
          <fieldset className="fieldset">
            <legend>{t("owner.common.filterReservations")}</legend>
            <div className="owner-filter__grid">
              <div className="field">
                <label className="field__label" htmlFor="relatorio-data-inicio">{t("owner.common.startDate")}</label>
                <input className="field__control" id="relatorio-data-inicio" type="date" value={filtros.dataInicio} onChange={(event) => setFiltros((atual) => ({ ...atual, dataInicio: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="relatorio-data-fim">{t("owner.common.endDate")}</label>
                <input className="field__control" id="relatorio-data-fim" type="date" value={filtros.dataFim} onChange={(event) => setFiltros((atual) => ({ ...atual, dataFim: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="relatorio-veiculo">{t("owner.common.vehicle")}</label>
                <select className="field__control" id="relatorio-veiculo" value={filtros.idVeiculo} onChange={(event) => setFiltros((atual) => ({ ...atual, idVeiculo: event.target.value }))}>
                  <option value="">{t("owner.common.allVehicles")}</option>
                  {veiculosFiltro.map((veiculo) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button type="submit" className="btn" disabled={carregando}>{t("owner.common.applyFilters")}</button>
            <p id="relatorio-filtros-ajuda" className="owner-filter__help">{t("reports.vehicles.filterHelp")}</p>
          </div>
        </form>
        {carregando && <p className="loading-state" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" />{relatorios ? t("reports.vehicles.updating") : t("reports.vehicles.loading")}</p>}
        {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      </div>
      {relatorios && (
        <div className="report-grid">
          <section className="report-block report-block--wide" aria-labelledby="rel-reservas">
            <div className="report-block__head">
              <h2 id="rel-reservas">{t("reports.vehicles.reservationsTitle")}</h2>
              <p className="report-block__source">{t("reports.vehicles.reservationsSource")}</p>
            </div>
            <p className="report-block__figure"><strong>{relatorios.reservas?.total ?? reservas.length}</strong> {t("reports.vehicles.reservationsFigure", { count: relatorios.reservas?.total ?? reservas.length })}</p>
            {reservas.length ? (
              <ul className="report-list">{reservas.map((reserva) => <li key={reserva.id}>{t("reports.vehicles.reservationItem", { plate: reserva.veiculo?.placa || reserva.idVeiculo, status: rotulo(STATUS_RESERVA_LABELS, reserva.status), start: data(reserva.dataHoraInicio), end: data(reserva.dataHoraFim), value: moeda(reserva.valorTotal) })}</li>)}</ul>
            ) : <p className="report-empty">{t("owner.common.noReservations")}</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-financeiro">
            <div className="report-block__head">
              <h2 id="rel-financeiro">{t("reports.vehicles.financeTitle")}</h2>
              <p className="report-block__source">{t("reports.vehicles.financeSource")}</p>
            </div>
            <p className="report-block__figure"><strong>{moeda(relatorios.financeiro?.faturamentoBruto)}</strong> {t("reports.vehicles.grossRevenue")}</p>
            {porVeiculo.length ? (
              <>
                <GraficoBarras dados={porVeiculo} campo="total" formatar={moeda} />
                <ul className="report-list">{porVeiculo.map(({ idVeiculo, placa, total }) => <li key={idVeiculo}>{placa}: {moeda(total)}</li>)}</ul>
              </>
            ) : <p className="report-empty">{t("reports.vehicles.noRevenue")}</p>}
            <div className="report-block__foot">
              <button type="button" className="btn btn--secondary" disabled={!porVeiculo.length} onClick={() => downloadCsv(porVeiculo)}><Download aria-hidden="true" />{t("reports.vehicles.downloadFinance")}</button>
            </div>
          </section>
          <section className="report-block" aria-labelledby="rel-utilizacao">
            <div className="report-block__head">
              <h2 id="rel-utilizacao">{t("reports.vehicles.usageTitle")}</h2>
              <p className="report-block__source">{t("reports.vehicles.usageSource")}</p>
            </div>
            <p className="report-block__figure"><strong>{t("reports.vehicles.occupancy", { rate: percentual(relatorios.utilizacao?.taxaOcupacao) })}</strong>{t("reports.vehicles.averagePerReservation", { hours: horas(relatorios.utilizacao?.tempoMedioReservadoHoras) })}</p>
            {maisUtilizados.length ? (
              <>
                <GraficoBarras dados={maisUtilizados} campo="horasReservadas" formatar={(valor) => `${formatNumber(valor)}h`} />
                <ul className="report-list">{maisUtilizados.map(({ idVeiculo, placa, reservas, horasReservadas }) => <li key={idVeiculo}>{t("reports.vehicles.usageItem", { plate: placa, count: reservas, hours: formatNumber(horasReservadas) })}</li>)}</ul>
              </>
            ) : <p className="report-empty">{t("reports.vehicles.noUsage")}</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-avaliacoes">
            <div className="report-block__head">
              <h2 id="rel-avaliacoes">{t("reports.vehicles.ratingsTitle")}</h2>
              <p className="report-block__source">{t("reports.vehicles.ratingsSource")}</p>
            </div>
            <p className="report-block__figure"><strong>{t("reports.vehicles.ratingsSummary", { count: avaliacoes.total ?? 0, average: avaliacoes.media ?? 0 })}</strong></p>
            {!avaliacoes.total && <p className="report-empty">{t("reports.vehicles.noRatings")}</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-km">
            <div className="report-block__head">
              <h2 id="rel-km">{t("reports.vehicles.mileageTitle")}</h2>
              <p className="report-block__source">{t("reports.vehicles.mileageSource")}</p>
            </div>
            <p className="report-empty">{t("reports.vehicles.mileageEmpty")}</p>
          </section>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
