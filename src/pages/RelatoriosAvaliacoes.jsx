import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard } from "../services/dashboardService";
import "../styles/carselect.css";
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
    carregar();
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
    <main className="carro-page">
      <div className="carro-header"><h1>Relatórios | Avaliações</h1></div>
      <div className="carro-content">
        <form className="filtro-card" onSubmit={aplicarFiltros}>
          <div className="auth-field"><label htmlFor="dataInicio">Data inicial</label><input id="dataInicio" type="date" value={filtros.dataInicio} onChange={(e) => atualizarFiltro("dataInicio", e.target.value)} /></div>
          <div className="auth-field"><label htmlFor="dataFim">Data final</label><input id="dataFim" type="date" value={filtros.dataFim} onChange={(e) => atualizarFiltro("dataFim", e.target.value)} /></div>
          <div className="auth-field"><label htmlFor="idVeiculo">Veículo</label><select id="idVeiculo" value={filtros.idVeiculo} onChange={(e) => atualizarFiltro("idVeiculo", e.target.value)}><option value="">Todos</option>{veiculos.map(({ veiculo }) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa} — {veiculo.marca} {veiculo.modelo}</option>)}</select></div>
          <div className="auth-field"><label htmlFor="notaMin">Nota mínima</label><select id="notaMin" value={filtros.notaMin} onChange={(e) => atualizarFiltro("notaMin", e.target.value)}><option value="">Todas</option>{[1, 2, 3, 4, 5].map((nota) => <option key={nota} value={nota}>{nota}</option>)}</select></div>
          <button type="submit" className="carro-button">Aplicar filtros</button>
        </form>
        {carregando && <p className="carro-status">Carregando relatórios…</p>}
        {erro && <p className="carro-status" role="alert">{erro}</p>}
        {!carregando && !erro && relatorio && (
          <div className="relatorio-grid">
            <section className="relatorio-card">
              <div className="relatorio-card__chart">
                <h2>Resumo</h2>
                <p>{relatorio.resumo?.total ?? 0} avaliações · média {relatorio.resumo?.media ?? 0}</p>
                {!linhas.length && <p>Nenhuma avaliação encontrada para os filtros selecionados.</p>}
                {linhas.length > 0 && <ul>{linhas.map(({ veiculo, quantidade, media }) => <li key={veiculo.id}>{veiculo.placa}: {media} ({quantidade} avaliações)</li>)}</ul>}
              </div>
              <div className="relatorio-card__footer"><div><h3>Avaliações por veículo</h3><p>Dados reais das avaliações recebidas.</p></div><div className="relatorio-card__actions"><button type="button" aria-label="Baixar relatório de avaliações" disabled={!linhas.length} onClick={() => downloadCsv(linhas)}><Download size={20} /></button></div></div>
            </section>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
