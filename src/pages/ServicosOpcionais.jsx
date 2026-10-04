import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JourneySteps from "../components/reservation/JourneySteps";
import { listServicos } from "../services/servicoService";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/journey.css";

const UNIDADE = { POR_DIA: "por dia", POR_RESERVA: "por reserva" };

export default function ServicosOpcionais() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState([]);
  const [selecionados, setSelecionados] = useState(() => getJourneyStep("servicos")?.selecionados ?? []);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = "MOVA - Serviços adicionais";
    listServicos().then(setServicos).catch((error) => {
      setErro(error?.message || "Não foi possível carregar os serviços.");
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
        <h1>Serviços adicionais</h1>
        <p className="page-head__lede">Escolha serviços para esta reserva. O valor final será recalculado pelo sistema ao confirmar.</p>
      </header>

      {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando serviços…</p>}
      {erro && <p role="alert" className="alert alert--danger">{erro}</p>}
      {!carregando && !erro && servicos.length === 0 && <p className="journey-muted">Nenhum serviço adicional está disponível.</p>}

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
                    {formatMoneyBRL(servico.valor)}
                    {UNIDADE[servico.tipoCobranca] && <span className="choice__unit">{UNIDADE[servico.tipoCobranca]}</span>}
                  </span>
                </label>
                {servico.detalhesCobertura && (
                  <details className="line-list__details">
                    <summary>Ver detalhes da cobertura</summary>
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
          <span>Estimativa dos serviços</span>
          <strong className="tabular" data-testid="estimativa-servicos">{formatMoneyBRL(estimativa)}</strong>
        </p>
        <p className="price-summary__note">Diárias e total final aparecem no resumo, calculados pelo servidor.</p>
      </div>

      <div className="journey-footer">
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/escolha-garagem-devolucao")}>Voltar para devolução</button>
        <button type="button" className="btn btn--lg" onClick={continuar}>Continuar para checkout</button>
      </div>
    </main>
  );
}
