import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Star } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getJourneyStep } from "../utils/journeyStorage";
import { METODO_PAGAMENTO_LABELS, rotulo, STATUS_RESERVA } from "../services/apiEnums";
import { formatMoneyBRL } from "../utils/reservationMath";
import { getReservaById } from "../services/reservaService";
import { createAvaliacao, getAvaliacaoDaReserva } from "../services/avaliacaoService";
import "../styles/journey.css";
import "../styles/postcompra.css";

function resolveField(value, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function resolveVeiculoNome(reserva, veiculoJourney) {
  const veiculo = reserva?.veiculo ?? reserva?.Veiculo ?? {};
  const modeloVeiculo = veiculo.modeloVeiculo ?? {};
  const marca = veiculo.marca ?? modeloVeiculo.marca ?? veiculoJourney?.marca;
  const modelo = veiculo.modelo ?? modeloVeiculo.modelo ?? veiculoJourney?.modelo;

  if (marca || modelo) {
    return `${marca ?? ""} ${modelo ?? ""}`.trim();
  }

  return veiculoJourney?.nome || "Veículo";
}

function formatarDataHora(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return `${data.toLocaleDateString("pt-BR")} ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function AvaliacaoReserva() {
  const location = useLocation();

  // A tela e alcancada de duas formas: (1) logo apos o desbloqueio, no
  // fluxo linear de reserva (dados ainda na journeyStorage da sessao), ou
  // (2) clicando numa reserva concluida no Historico (recebe o id via
  // location.state). Nos dois casos, o id real da reserva manda.
  const veiculoJourney = getJourneyStep("veiculo");
  const reservaId = location.state?.reservaId || getJourneyStep("reserva")?.id;
  const semReservaId = !reservaId;

  const [reserva, setReserva] = useState(null);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroAvaliacao, setErroAvaliacao] = useState("");

  useEffect(() => {
    document.title = "MOVA - Avalie sua Experiência";
  }, []);

  useEffect(() => {
    if (!reservaId) {
      return;
    }

    let active = true;

    Promise.all([
      getReservaById(reservaId).catch((error) => ({ erro: error })),
      getAvaliacaoDaReserva(reservaId).catch(() => null),
    ]).then(([reservaResult, avaliacaoResult]) => {
      if (!active) return;
      if (reservaResult?.erro) {
        setErroCarregamento(reservaResult.erro.message || "Não foi possível carregar a reserva.");
        setCarregando(false);
        return;
      }
      setReserva(reservaResult);
      if (avaliacaoResult) {
        setAvaliacaoExistente(avaliacaoResult);
        setRating(Math.round(avaliacaoResult.nota) || 5);
        setComentario(avaliacaoResult.comentario || "");
      }
      setCarregando(false);
    });

    return () => {
      active = false;
    };
  }, [reservaId]);

  const nomeVeiculo = resolveVeiculoNome(reserva, veiculoJourney);
  const jaAvaliada = Boolean(avaliacaoExistente);
  const podeAvaliar = reserva?.status === STATUS_RESERVA.REALIZADA;
  const mensagemCarregamento = semReservaId
    ? "Não encontramos a reserva a ser avaliada."
    : erroCarregamento;

  function handleEnviarAvaliacao(event) {
    event.preventDefault();
    setErroAvaliacao("");

    if (!reservaId || !podeAvaliar) {
      setErroAvaliacao("A avaliação fica disponível após a devolução da reserva.");
      return;
    }

    setEnviando(true);
    createAvaliacao({
      idReserva: reservaId,
      nota: rating,
      ...(comentario.trim() ? { comentario: comentario.trim() } : {}),
    })
      .then((avaliacao) => {
        setAvaliacaoExistente(avaliacao);
      })
      .catch((error) => {
        setErroAvaliacao(error?.message || "Não foi possível enviar sua avaliação.");
      })
      .finally(() => setEnviando(false));
  }

  const notaExibida = hoverRating || rating;

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Avalie sua Experiência</h1>
      </header>

      {!semReservaId && carregando && (
        <p className="loading-state" aria-live="polite"><span className="spinner" aria-hidden="true" />Carregando dados da reserva…</p>
      )}

      {((semReservaId || !carregando) && mensagemCarregamento && !reserva) && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{mensagemCarregamento}</p>
        </div>
      )}

      {!carregando && (reserva || veiculoJourney) && (
        <div className="journey-layout">
          <section className="post-panel" aria-labelledby="avaliacao-titulo">
            <h2 id="avaliacao-titulo">Sua nota</h2>

            {jaAvaliada && (
              <div className="alert alert--success" role="status">
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                <div className="alert__body">
                  <p>Você já avaliou esta reserva com nota {avaliacaoExistente.nota}.</p>
                  {avaliacaoExistente.comentario && <p>“{avaliacaoExistente.comentario}”</p>}
                </div>
              </div>
            )}

            <div className="rating">
              <p className="rating__label" id="rating-label">Avaliação em estrelas</p>
              <div className="rating__stars" role="group" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= notaExibida;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="rating__star"
                      onClick={() => !jaAvaliada && setRating(star)}
                      onMouseEnter={() => !jaAvaliada && setHoverRating(star)}
                      onMouseLeave={() => !jaAvaliada && setHoverRating(0)}
                      aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                      aria-pressed={star === rating}
                      disabled={jaAvaliada}
                    >
                      <Star size={28} aria-hidden="true" fill={filled ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>
              <p className="rating__value" aria-live="polite">
                Nota selecionada: <span className="tabular">{rating}</span> de 5
              </p>
            </div>

            {erroAvaliacao && (
              <div className="alert alert--danger">
                <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
                <p className="alert__body" role="alert">{erroAvaliacao}</p>
              </div>
            )}

            {!jaAvaliada && !podeAvaliar && <p className="journey-muted">A avaliação fica disponível após a devolução da reserva.</p>}

            {!jaAvaliada && podeAvaliar && <>
              <div className="field">
                <label className="field__label" htmlFor="comentario-avaliacao">Comentário (opcional)</label>
                <textarea
                  id="comentario-avaliacao"
                  className="field__control"
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  maxLength={255}
                  rows={4}
                  aria-describedby="comentario-contador"
                />
                <p className="rating__counter tabular" id="comentario-contador">{comentario.length}/255</p>
              </div>
              <div className="journey-actions">
                <button type="button" className="btn btn--lg" onClick={handleEnviarAvaliacao} disabled={enviando} aria-busy={enviando || undefined}>
                  {enviando ? "Enviando..." : "Enviar Avaliação"}
                </button>
              </div>
            </>}
          </section>

          <aside className="post-panel" aria-labelledby="avaliacao-reserva">
            <h2 id="avaliacao-reserva">Informações da Reserva</h2>
            <ul className="post-facts">
              <li>Veículo: {nomeVeiculo}</li>
              <li>Início: <span className="tabular">{resolveField(formatarDataHora(reserva?.dataHoraInicio))}</span></li>
              <li>Fim: <span className="tabular">{resolveField(formatarDataHora(reserva?.dataHoraFim))}</span></li>
              <li>Preço: <span className="tabular">{reserva?.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "—"}</span></li>
              <li>Forma de Pagamento: {resolveField(rotulo(METODO_PAGAMENTO_LABELS, reserva?.metodoPagamento))}</li>
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
}
