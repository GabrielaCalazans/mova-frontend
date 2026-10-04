import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JourneySteps from "../components/reservation/JourneySteps";
import { listServicos } from "../services/servicoService";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { formatCurrency, t } from "../i18n";
import "../styles/journey.css";

// Chaves de tradução por tipo de cobrança (o código vem da API).
const UNIDADE = { POR_DIA: "journey.services.perDay", POR_RESERVA: "journey.services.perBooking" };

export default function ServicosOpcionais() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState([]);
  const [selecionados, setSelecionados] = useState(() => getJourneyStep("servicos")?.selecionados ?? []);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = t("journey.services.documentTitle");
    listServicos().then(setServicos).catch((error) => {
      setErro(error?.message || t("journey.services.loadError"));
    }).finally(() => setCarregando(false));
  }, []);

  function alternar(servico) {
    setSelecionados((atual) => atual.some((item) => item.id === servico.id)
      ? atual.filter((item) => item.id !== servico.id)
      : [...atual, servico]);
  }

  function continuar() {
    updateJourneyStep("servicos", { ids: selecionados.map((s) => s.id), selecionados });
    navigate("/checkout-reserva");
  }

  const estimativa = selecionados.reduce((total, servico) => total + Number(servico.valor || 0), 0);

  return (
    <main className="journey-page">
      <JourneySteps current="servicos" />
      <header className="journey-head">
        <h1>{t("journey.services.title")}</h1>
        <p className="page-head__lede">{t("journey.services.lede")}</p>
      </header>

      {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("journey.services.loading")}</p>}
      {erro && <p role="alert" className="alert alert--danger">{erro}</p>}
      {!carregando && !erro && servicos.length === 0 && <p className="journey-muted">{t("journey.services.empty")}</p>}

      {servicos.length > 0 && (
        <ul className="choice-list">
          {servicos.map((servico) => {
            const marcado = selecionados.some((item) => item.id === servico.id);
            return (
              <li key={servico.id}>
                <label className="choice">
                  <input type="checkbox" checked={marcado} onChange={() => alternar(servico)} />
                  <span>
                    <span className="choice__name">{servico.nome}</span>
                    {servico.descricao && <span className="choice__desc"> — {servico.descricao}</span>}
                  </span>
                  <span className="choice__price tabular">
                    {formatCurrency(servico.valor)}
                    {UNIDADE[servico.tipoCobranca] && <span className="choice__unit">{t(UNIDADE[servico.tipoCobranca])}</span>}
                  </span>
                </label>
                {servico.detalhesCobertura && (
                  <details className="line-list__details">
                    <summary>{t("journey.services.coverage")}</summary>
                    <p>{servico.detalhesCobertura}</p>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="price-summary">
        <p className="price-summary__total">
          <span>{t("journey.services.estimate")}</span>
          <strong className="tabular" data-testid="estimativa-servicos">{formatCurrency(estimativa)}</strong>
        </p>
        <p className="price-summary__note">{t("journey.services.note")}</p>
      </div>

      <div className="journey-footer">
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/escolha-garagem-devolucao")}>{t("journey.services.back")}</button>
        <button type="button" className="btn btn--lg" onClick={continuar}>{t("journey.services.next")}</button>
      </div>
    </main>
  );
}
