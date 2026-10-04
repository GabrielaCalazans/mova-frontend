import { useCallback, useEffect, useState } from "react";
import { rotulo, STATUS_GARAGEM_LABELS, STATUS_NOTIFICACAO_LABELS, STATUS_VEICULO_LABELS } from "../services/apiEnums";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import {
  cancelarInteresse,
  listarInteresses,
  listarNotificacoes,
  listarVeiculosParaInteresse,
  registrarInteresse,
} from "../services/interesseService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/journey.css";
import "../styles/postcompra.css";

function nomeVeiculo(veiculo) {
  return `${veiculo.marca ?? ""} ${veiculo.modelo ?? ""}`.trim() || "Veículo";
}

export default function InteressesDisponibilidade() {
  const navigate = useNavigate();
  const [veiculos, setVeiculos] = useState([]);
  const [interesses, setInteresses] = useState(new Set());
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [processando, setProcessando] = useState(new Set());

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const [descoberta, ativos, avisos] = await Promise.all([
        listarVeiculosParaInteresse(),
        listarInteresses(),
        listarNotificacoes(),
      ]);
      setVeiculos(descoberta);
      setInteresses(new Set(ativos.map((item) => String(item.idVeiculo))));
      setNotificacoes(avisos);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar os interesses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "MOVA - Avisos de disponibilidade";
    queueMicrotask(() => {
      void carregar();
    });
  }, [carregar]);

  async function alternarInteresse(idVeiculo) {
    const chave = String(idVeiculo);
    if (processando.has(chave)) return;
    setProcessando((atual) => new Set(atual).add(chave));
    setFeedback(null);
    try {
      if (interesses.has(chave)) {
        await cancelarInteresse(idVeiculo);
        setInteresses((atual) => {
          const proximo = new Set(atual);
          proximo.delete(chave);
          return proximo;
        });
        setFeedback("Aviso de disponibilidade cancelado.");
      } else {
        await registrarInteresse(idVeiculo);
        setInteresses((atual) => new Set(atual).add(chave));
        setFeedback("Aviso de disponibilidade ativado.");
      }
    } catch (error) {
      setErro(error.message || "Não foi possível atualizar o aviso.");
    } finally {
      setProcessando((atual) => {
        const proximo = new Set(atual);
        proximo.delete(chave);
        return proximo;
      });
    }
  }

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Avisos de disponibilidade</h1>
        <p className="page-head__lede">Escolha um veículo indisponível para receber um aviso quando ele voltar a ficar disponível.</p>
      </header>

      {loading && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando veículos indisponíveis…</p>
      )}
      {!loading && erro && (
        <div className="alert alert--danger" role="alert">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body">{erro}</p>
        </div>
      )}
      {!loading && !erro && veiculos.length === 0 && (
        <div className="state-block">
          <p className="state-block__text">Nenhum veículo indisponível encontrado.</p>
        </div>
      )}

      {!loading && !erro && veiculos.length > 0 && (
        <ul className="post-list">
          {veiculos.map((veiculo) => {
            const id = String(veiculo.id);
            const ativo = interesses.has(id);
            const busy = processando.has(id);
            return (
              <li className="post-item" key={veiculo.id}>
                <div className="post-item__body">
                  <h2 className="post-item__title">{nomeVeiculo(veiculo)}</h2>
                  <p className="post-item__meta">
                    Indisponível — {rotulo(STATUS_VEICULO_LABELS, veiculo.status)}
                    {veiculo.garagem?.status && veiculo.garagem.status !== "ATIVA"
                      ? ` (garagem ${rotulo(STATUS_GARAGEM_LABELS, veiculo.garagem.status).toLowerCase()})`
                      : ""}
                  </p>
                  {veiculo.ano && <p className="post-item__meta">Ano <span className="tabular">{veiculo.ano}</span></p>}
                  {veiculo.valorDiaria != null && <p className="post-item__meta tabular">{formatMoneyBRL(veiculo.valorDiaria)} /dia</p>}
                  {veiculo.garagem?.nome && <p className="post-item__meta">{veiculo.garagem.nome}</p>}
                </div>
                <button
                  type="button"
                  className={ativo ? "btn btn--secondary" : "btn"}
                  aria-pressed={ativo}
                  disabled={busy}
                  aria-busy={busy || undefined}
                  onClick={() => alternarInteresse(veiculo.id)}
                >
                  {ativo ? "Cancelar aviso" : "Avisar quando disponível"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {feedback && (
        <p className="alert alert--success" role="status">
          <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
          <span className="alert__body">{feedback}</span>
        </p>
      )}

      {notificacoes.length > 0 && (
        <section className="journey-section" aria-labelledby="avisos-recebidos">
          <h2 id="avisos-recebidos">Avisos recebidos</h2>
          <ul className="line-list">
            {notificacoes.map((notificacao) => (
              <li key={notificacao.id} className="line-list__item">
                <span className="post-item__title">{notificacao.assunto}</span>
                <span className="badge badge--neutral">{rotulo(STATUS_NOTIFICACAO_LABELS, notificacao.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="journey-actions">
        <button type="button" className="btn btn--secondary" onClick={() => navigate("/carros")}>Voltar ao catálogo</button>
      </div>
    </main>
  );
}
