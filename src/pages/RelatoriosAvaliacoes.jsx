import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getAvaliacaoDashboard } from "../services/dashboardService";
import { t } from "../i18n";
import "../styles/owner.css";
import "../styles/relatorios.css";

// Texto iniciado por = + - @ ou tab/CR seria interpretado como fórmula pela
// planilha (CSV injection); prefixa com apóstrofo. Números não são afetados.
const csvValue = (value) => {
  const texto = String(value ?? "");
  const seguro = typeof value === "string" && /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replaceAll('"', '""')}"`;
};

function csvAvaliacoes(rows) {
  return [[t("reports.vehicles.csvVehicle"), t("reports.ratings.csvCount"), t("reports.ratings.csvAverage"), t("reports.ratings.csvMax"), t("reports.ratings.csvMin")], ...rows.map(({ veiculo, quantidade, media, maior, menor }) => [veiculo?.placa, quantidade, media, maior, menor])]
    .map((row) => row.map(csvValue).join(";"))
    .join("\n");
}

function downloadCsv(rows) {
  const blob = new Blob([`\uFEFF${csvAvaliacoes(rows)}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = t("reports.ratings.file");
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
      setErro(t("reports.ratings.loadError"));
      setRelatorio(null);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    document.title = t("reports.ratings.docTitle");
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
        <h1 id="relatorio-avaliacoes-title">{t("reports.ratings.title")}</h1>
        <p className="page-head__lede">{t("reports.ratings.lede")}</p>
      </header>
      <div className="owner-section">
        <form className="owner-filter" onSubmit={aplicarFiltros}>
          <fieldset className="fieldset">
            <legend>{t("reports.ratings.filterLegend")}</legend>
            <div className="owner-filter__grid">
              <div className="field"><label className="field__label" htmlFor="dataInicio">{t("owner.common.startDate")}</label><input className="field__control" id="dataInicio" type="date" value={filtros.dataInicio} onChange={(e) => atualizarFiltro("dataInicio", e.target.value)} /></div>
              <div className="field"><label className="field__label" htmlFor="dataFim">{t("owner.common.endDate")}</label><input className="field__control" id="dataFim" type="date" value={filtros.dataFim} onChange={(e) => atualizarFiltro("dataFim", e.target.value)} /></div>
              <div className="field"><label className="field__label" htmlFor="idVeiculo">{t("owner.common.vehicle")}</label><select className="field__control" id="idVeiculo" value={filtros.idVeiculo} onChange={(e) => atualizarFiltro("idVeiculo", e.target.value)}><option value="">{t("reports.ratings.all")}</option>{veiculos.map(({ veiculo }) => <option key={veiculo.id} value={veiculo.id}>{veiculo.placa} — {veiculo.marca} {veiculo.modelo}</option>)}</select></div>
              <div className="field"><label className="field__label" htmlFor="notaMin">{t("reports.ratings.minRating")}</label><select className="field__control" id="notaMin" value={filtros.notaMin} onChange={(e) => atualizarFiltro("notaMin", e.target.value)}><option value="">{t("reports.ratings.allRatings")}</option>{[1, 2, 3, 4, 5].map((nota) => <option key={nota} value={nota}>{nota}</option>)}</select></div>
            </div>
          </fieldset>
          <div className="owner-filter__actions">
            <button type="submit" className="btn">{t("owner.common.applyFilters")}</button>
          </div>
        </form>
        {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("reports.vehicles.loading")}</p>}
        {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      </div>
      {!carregando && !erro && relatorio && (
        <section className="report-block" aria-labelledby="rel-aval-resumo">
          <div className="report-block__head">
            <h2 id="rel-aval-resumo">{t("reports.ratings.byVehicle")}</h2>
            <p className="report-block__source">{t("reports.ratings.source")}</p>
          </div>
          <p className="report-block__figure"><strong>{t("reports.vehicles.ratingsSummary", { count: relatorio.resumo?.total ?? 0, average: relatorio.resumo?.media ?? 0 })}</strong></p>
          {!linhas.length && <p className="report-empty">{t("reports.ratings.empty")}</p>}
          {linhas.length > 0 && <ul className="report-list">{linhas.map(({ veiculo, quantidade, media }) => <li key={veiculo.id}>{t("reports.ratings.item", { plate: veiculo.placa, average: media, count: quantidade })}</li>)}</ul>}
          <div className="report-block__foot">
            <button type="button" className="btn btn--secondary" disabled={!linhas.length} onClick={() => downloadCsv(linhas)}><Download aria-hidden="true" />{t("reports.ratings.download")}</button>
          </div>
        </section>
      )}
      <BottomNav />
    </main>
  );
}
