import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard } from "../services/dashboardService";
import "../styles/owner.css";
import "../styles/relatorios.css";

const csvValue = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function csvAvaliacoes(rows) {
  return [["Veículo", "Quantidade", "Nota média", "Maior nota", "Menor nota"], ...rows.map(({ veiculo, quantidade, media, maior, menor }) => [veiculo?.placa, quantidade, media, maior, menor])]
    .map((row) => row.map(csvValue).join(";"))
    .join("\n");
}

function downloadCsv(rows) {
  const blob = new Blob([`\uFEFF${csvAvaliacoes(rows)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "relatorio-avaliacoes.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function RelatoriosAvaliacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState(() => ({
    dataInicio: searchParams.get("dataInicio") || "",
    dataFim: searchParams.get("dataFim") || "",
    idVeiculo: searchParams.get("idVeiculo") || "",
    notaMin: searchParams.get("notaMin") || "",
  }));
  const [relatorio, setRelatorio] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = async (filtrosAtuais = filtros) => {
    setCarregando(true);
    setErro("");
    try {
      setRelatorio(await getAvaliacaoDashboard(filtrosAtuais));
    } catch {
      setErro("Não foi possível carregar o relatório de avaliações.");
      setRelatorio(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    document.title = "MOVA - Relatórios de Avaliações";
    queueMicrotask(() => {
      void carregar();
    });
    // A carga inicial deve acontecer apenas uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linhas = relatorio?.mediaPorVeiculo || [];
  const veiculos = relatorio?.ranking || [];
  const atualizarFiltro = (campo, valor) => setFiltros((atual) => ({ ...atual, [campo]: valor }));
  const aplicarFiltros = (event) => {
    event.preventDefault();
    const proximos = { ...filtros };
    const params = new URLSearchParams();
    Object.entries(proximos).forEach(([chave, valor]) => {
      if (valor) params.set(chave, valor);
    });
    setSearchParams(params);
    carregar(proximos);
  };

  return (
    <main className="owner-page" aria-labelledby="relatorio-avaliacoes-title">
      <header className="page-head">
        <h1 id="relatorio-avaliacoes-title">Relatórios | Avaliações</h1>
        <p className="page-head__lede">Notas recebidas pelos veículos da sua frota, por período, veículo e nota mínima.</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={aplicarFiltros}>
          <fieldset className="fieldset">
            <legend>Filtrar avaliações</legend>
            <div className="owner-filter__grid">
              <div className="field"><label className="field__label" htmlFor="dataInicio">Data inicial</label><input className="field__control" id="dataInicio" type="date" value={filtros.dataInicio} onChange={(e) => atualizarFiltro("dataInicio", e.target.value)} /></div>
              <div className="field"><label className="field__label" htmlFor="dataFim">Data final</label><input className="field__control" id="dataFim" type="date" value={filtros.dataFim} onChange={(e) => atualizarFiltro("dataFim", e.target.value)} /></div>
              <div className="field"><label className="field__label" htmlFor="idVeiculo">Veículo</label><select className="field__control" id="idVeiculo" value={filtros.idVeiculo} onChange={(e) => atualizarFiltro("idVeiculo", e.target.value)}><option value="">Todos</option>{veiculos.map(({ veiculo }) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa} — {veiculo.marca} {veiculo.modelo}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="notaMin">Nota mínima</label><select className="field__control" id="notaMin" value={filtros.notaMin} onChange={(e) => atualizarFiltro("notaMin", e.target.value)}><option value="">Todas</option>{[1, 2, 3, 4, 5].map((nota) => <option key={nota} value={nota}>{nota}</option>)}</select></div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button type="submit" className="btn">Aplicar filtros</button>
          </div>
        </form>
        {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando relatórios…</p>}
        {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      </div>
      {!carregando && !erro && relatorio && (
        <section className="report-block" aria-labelledby="rel-aval-resumo">
          <div className="report-block__head">
            <h2 id="rel-aval-resumo">Avaliações por veículo</h2>
            <p className="report-block__source">Dados reais das avaliações recebidas.</p>
          </div>
          <p className="report-block__figure"><strong>{relatorio.resumo?.total ?? 0} avaliações · média {relatorio.resumo?.media ?? 0}</strong></p>
          {!linhas.length && <p className="report-empty">Nenhuma avaliação encontrada para os filtros selecionados.</p>}
          {linhas.length > 0 && <ul className="report-list">{linhas.map(({ veiculo, quantidade, media }) => <li key={veiculo.id}>{veiculo.placa}: {media} ({quantidade} avaliações)</li>)}</ul>}
          <div className="report-block__foot">
            <button type="button" className="btn btn--secondary" disabled={!linhas.length} onClick={() => downloadCsv(linhas)}><Download aria-hidden="true" />Baixar relatório de avaliações</button>
          </div>
        </section>
      )}
      <BottomNav />
    </main>
  );
}
