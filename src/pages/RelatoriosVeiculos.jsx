import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard, getFinanceiro, getReservas, getUtilizacao } from "../services/dashboardService";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import "../styles/owner.css";
import "../styles/relatorios.css";

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function csvFinanceiro(porVeiculo) {
  return [["Veículo", "Faturamento"], ...porVeiculo.map(({ placa, total }) => [placa, total])]
    .map((row) => row.map(csvValue).join(";"))
    .join("\n");
}

function downloadCsv(porVeiculo) {
  const blob = new Blob([`\uFEFF${csvFinanceiro(porVeiculo)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-financeiro-veiculos.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const moeda = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor || 0));
const percentual = (valor) => `${(Number(valor || 0) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
const DISPLAY_TIME_ZONE = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";
const data = (valor) => valor ? new Intl.DateTimeFormat("pt-BR", { timeZone: DISPLAY_TIME_ZONE }).format(new Date(valor)) : "—";

const compacto = (valor) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(Number(valor || 0));

// Gráfico de barras com uma única cor de ação: a cor vem do CSS (relatorios.css),
// então segue o tema. A lista abaixo do gráfico é a alternativa textual.
function GraficoBarras({ dados, campo, formatar }) {
  return (
    <div className="report-chart" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="placa" tickLine={false} interval={0} />
          <YAxis tickFormatter={compacto} width={48} tickLine={false} axisLine={false} />
          <Tooltip formatter={(valor) => formatar(valor)} contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} labelStyle={{ color: "var(--text-primary)" }} itemStyle={{ color: "var(--text-secondary)" }} />
          <Bar dataKey={campo} radius={[2, 2, 0, 0]} maxBarSize={48} isAnimationActive={false} />
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
      setErro("Não foi possível carregar os relatórios.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    document.title = "MOVA - Relatórios de Veículos";
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
      setErro("A data final deve ser igual ou posterior à data inicial.");
      return;
    }
    void carregarRelatorios(filtros);
  }

  return (
    <main className="owner-page" aria-labelledby="relatorio-veiculos-title">
      <header className="page-head">
        <h1 id="relatorio-veiculos-title">Relatórios | Veículos</h1>
        <p className="page-head__lede">Dados reais da frota, reservas, receita e avaliações do Locador autenticado.</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={aplicarFiltros} aria-describedby="relatorio-filtros-ajuda">
          <fieldset className="fieldset">
            <legend>Filtrar reservas</legend>
            <div className="owner-filter__grid">
              <div className="field">
                <label className="field__label" htmlFor="relatorio-data-inicio">Data inicial</label>
                <input className="field__control" id="relatorio-data-inicio" type="date" value={filtros.dataInicio} onChange={(event) => setFiltros((atual) => ({ ...atual, dataInicio: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="relatorio-data-fim">Data final</label>
                <input className="field__control" id="relatorio-data-fim" type="date" value={filtros.dataFim} onChange={(event) => setFiltros((atual) => ({ ...atual, dataFim: event.target.value }))} />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="relatorio-veiculo">Veículo</label>
                <select className="field__control" id="relatorio-veiculo" value={filtros.idVeiculo} onChange={(event) => setFiltros((atual) => ({ ...atual, idVeiculo: event.target.value }))}>
                  <option value="">Todos os veículos</option>
                  {veiculosFiltro.map((veiculo) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa}</option>)}
                </select>
              </div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button type="submit" className="btn" disabled={carregando}>Aplicar filtros</button>
            <p id="relatorio-filtros-ajuda" className="owner-filter__help">Período e veículo filtram as reservas conforme o contrato atual. Financeiro, utilização e avaliações seguem seus endpoints agregados sem esses filtros.</p>
          </div>
        </form>
        {carregando && <p className="loading-state" role="status" aria-busy="true"><span className="spinner" aria-hidden="true" />{relatorios ? "Atualizando relatórios…" : "Carregando relatórios…"}</p>}
        {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      </div>
      {relatorios && (
        <div className="report-grid">
          <section className="report-block report-block--wide" aria-labelledby="rel-reservas">
            <div className="report-block__head">
              <h2 id="rel-reservas">Reservas</h2>
              <p className="report-block__source">Reservas da frota · dados reais filtrados pelo backend.</p>
            </div>
            <p className="report-block__figure"><strong>{relatorios.reservas?.total ?? reservas.length}</strong> reservas no período consultado.</p>
            {reservas.length ? (
              <ul className="report-list">{reservas.map((reserva) => <li key={reserva.id}>{reserva.veiculo?.placa || reserva.idVeiculo}: {reserva.status} · {data(reserva.dataHoraInicio)} a {data(reserva.dataHoraFim)} · {moeda(reserva.valorTotal)}</li>)}</ul>
            ) : <p className="report-empty">Nenhuma reserva encontrada.</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-financeiro">
            <div className="report-block__head">
              <h2 id="rel-financeiro">Financeiro</h2>
              <p className="report-block__source">Relatório financeiro por veículo · pagamentos concluídos.</p>
            </div>
            <p className="report-block__figure"><strong>{moeda(relatorios.financeiro?.faturamentoBruto)}</strong> de faturamento bruto</p>
            {porVeiculo.length ? (
              <>
                <GraficoBarras dados={porVeiculo} campo="total" formatar={moeda} />
                <ul className="report-list">{porVeiculo.map(({ idVeiculo, placa, total }) => <li key={idVeiculo}>{placa}: {moeda(total)}</li>)}</ul>
              </>
            ) : <p className="report-empty">Nenhum faturamento encontrado.</p>}
            <div className="report-block__foot">
              <button type="button" className="btn btn--secondary" disabled={!porVeiculo.length} onClick={() => downloadCsv(porVeiculo)}><Download aria-hidden="true" />Baixar relatório financeiro</button>
            </div>
          </section>
          <section className="report-block" aria-labelledby="rel-utilizacao">
            <div className="report-block__head">
              <h2 id="rel-utilizacao">Utilização</h2>
              <p className="report-block__source">Uso dos veículos · dados reais de reservas.</p>
            </div>
            <p className="report-block__figure"><strong>{percentual(relatorios.utilizacao?.taxaOcupacao)} de ocupação</strong>{relatorios.utilizacao?.tempoMedioReservadoHoras ?? 0}h em média por reserva</p>
            {maisUtilizados.length ? (
              <>
                <GraficoBarras dados={maisUtilizados} campo="horasReservadas" formatar={(valor) => `${valor}h`} />
                <ul className="report-list">{maisUtilizados.map(({ idVeiculo, placa, reservas, horasReservadas }) => <li key={idVeiculo}>{placa}: {reservas} reservas, {horasReservadas}h</li>)}</ul>
              </>
            ) : <p className="report-empty">Nenhuma utilização encontrada.</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-avaliacoes">
            <div className="report-block__head">
              <h2 id="rel-avaliacoes">Avaliações</h2>
              <p className="report-block__source">Avaliações dos usuários vinculadas aos veículos do Locador.</p>
            </div>
            <p className="report-block__figure"><strong>{avaliacoes.total ?? 0} avaliações · média {avaliacoes.media ?? 0}</strong></p>
            {!avaliacoes.total && <p className="report-empty">Nenhuma avaliação encontrada.</p>}
          </section>
          <section className="report-block" aria-labelledby="rel-km">
            <div className="report-block__head">
              <h2 id="rel-km">Quilometragem</h2>
              <p className="report-block__source">O sistema não possui uma fonte persistida confiável para este indicador.</p>
            </div>
            <p className="report-empty">Dados de quilometragem indisponíveis.</p>
          </section>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
