import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard, getFinanceiro, getReservas, getUtilizacao } from "../services/dashboardService";
import "../styles/carselect.css";
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
const data = (valor) => valor ? new Intl.DateTimeFormat("pt-BR").format(new Date(valor)) : "—";

export default function RelatoriosVeiculos() {
  const [relatorios, setRelatorios] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = "MOVA - Relatórios de Veículos";
    let ativo = true;
    Promise.all([getReservas(), getFinanceiro(), getUtilizacao(), getAvaliacaoDashboard()])
      .then(([reservas, financeiro, utilizacao, avaliacoes]) => ativo && setRelatorios({ reservas, financeiro, utilizacao, avaliacoes }))
      .catch(() => ativo && setErro("Não foi possível carregar os relatórios."));
    return () => { ativo = false; };
  }, []);

  const porVeiculo = relatorios?.financeiro?.porVeiculo || [];
  const maisUtilizados = relatorios?.utilizacao?.maisUtilizados || [];
  const reservas = relatorios?.reservas?.reservas || [];
  const avaliacoes = relatorios?.avaliacoes?.resumo || {};

  return (
    <main className="carro-page">
      <div className="carro-header"><h1>Relatórios | Veículos</h1></div>
      <div className="carro-content">
        <p className="relatorio-filter-summary">Dados reais da frota, reservas, receita e avaliações do Locador autenticado.</p>
        {!relatorios && !erro && <p className="carro-status">Carregando relatórios…</p>}
        {erro && <p className="carro-status" role="alert">{erro}</p>}
        {relatorios && (
          <div className="relatorio-grid">
            <section className="relatorio-card">
              <div className="relatorio-card__chart">
                <h2>Reservas</h2>
                <p>{relatorios.reservas?.total ?? reservas.length} reservas no período consultado.</p>
                {reservas.length ? (
                  <ul>{reservas.map((reserva) => <li key={reserva.id}>{reserva.veiculo?.placa || reserva.idVeiculo}: {reserva.status} · {data(reserva.dataHoraInicio)} a {data(reserva.dataHoraFim)} · {moeda(reserva.valorTotal)}</li>)}</ul>
                ) : <p>Nenhuma reserva encontrada.</p>}
              </div>
              <div className="relatorio-card__footer"><div><h3>Reservas da frota</h3><p>Dados reais filtrados pelo backend.</p></div></div>
            </section>
            <section className="relatorio-card">
              <div className="relatorio-card__chart">
                <h2>Financeiro</h2>
                <p><strong>{moeda(relatorios.financeiro?.faturamentoBruto)}</strong> de faturamento bruto</p>
                {porVeiculo.length ? (
                  <ul>{porVeiculo.map(({ idVeiculo, placa, total }) => <li key={idVeiculo}>{placa}: {moeda(total)}</li>)}</ul>
                ) : <p>Nenhum faturamento encontrado.</p>}
              </div>
              <div className="relatorio-card__footer">
                <div><h3>Relatório financeiro por veículo</h3><p>Dados reais de pagamentos concluídos.</p></div>
                <div className="relatorio-card__actions">
                  <button type="button" aria-label="Baixar relatório financeiro" disabled={!porVeiculo.length} onClick={() => downloadCsv(porVeiculo)}><Download size={20} /></button>
                </div>
              </div>
            </section>
            <section className="relatorio-card">
              <div className="relatorio-card__chart">
                <h2>Utilização</h2>
                <p>{percentual(relatorios.utilizacao?.taxaOcupacao)} de ocupação · {relatorios.utilizacao?.tempoMedioReservadoHoras ?? 0}h em média</p>
                {maisUtilizados.length ? (
                  <ul>{maisUtilizados.map(({ idVeiculo, placa, reservas, horasReservadas }) => <li key={idVeiculo}>{placa}: {reservas} reservas, {horasReservadas}h</li>)}</ul>
                ) : <p>Nenhuma utilização encontrada.</p>}
              </div>
              <div className="relatorio-card__footer"><div><h3>Uso dos veículos</h3><p>Dados reais de reservas.</p></div></div>
            </section>
            <section className="relatorio-card">
              <div className="relatorio-card__chart">
                <h2>Avaliações</h2>
                <p>{avaliacoes.total ?? 0} avaliações · média {avaliacoes.media ?? 0}</p>
                {!avaliacoes.total && <p>Nenhuma avaliação encontrada.</p>}
              </div>
              <div className="relatorio-card__footer"><div><h3>Avaliações dos usuários</h3><p>Dados reais vinculados aos veículos do Locador.</p></div></div>
            </section>
            <section className="relatorio-card">
              <div className="relatorio-card__chart"><h2>Quilometragem</h2><p>Dados de quilometragem indisponíveis.</p></div>
              <div className="relatorio-card__footer"><div><h3>Quilometragem</h3><p>O sistema não possui uma fonte persistida confiável para este indicador.</p></div></div>
            </section>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
