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
import { formatDate, t } from "../i18n";
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

  return veiculoJourney?.nome || t("reservation.common.vehicle");
}

function formatarDataHora(valor) {
  const data = formatDate(valor);
  return data ? `${data} ${formatDate(valor, { hour: "2-digit", minute: "2-digit" })}` : "";
}

export default function AvaliacaoReserva() {
  const location = useLocation();

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
    document.title = t("reservation.review.documentTitle");
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
        setErroCarregamento(reservaResult.erro.message || t("reservation.return.loadError"));
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
    ? t("reservation.review.notFound")
    : erroCarregamento;

  function handleEnviarAvaliacao(event) {
    event.preventDefault();
    setErroAvaliacao("");

    if (!reservaId || !podeAvaliar) {
      setErroAvaliacao(t("reservation.review.availableAfterReturn"));
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
        setErroAvaliacao(error?.message || t("reservation.review.sendError"));
      })
      .finally(() => setEnviando(false));
  }

  const notaExibida = hoverRating || rating;

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{t("reservation.review.title")}</h1>
      </header>

      {!semReservaId && carregando && (
        <p className="loading-state" aria-live="polite"><span className="spinner" aria-hidden="true" />{t("reservation.review.loading")}</p>
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
            <h2 id="avaliacao-titulo">{t("reservation.review.yourRating")}</h2>

            {jaAvaliada && (
              <div className="alert alert--success" role="status">
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                <div className="alert__body">
                  <p>{t("reservation.review.alreadyRated", { rating: avaliacaoExistente.nota })}</p>
                  {avaliacaoExistente.comentario && <p>“{avaliacaoExistente.comentario}”</p>}
                </div>
              </div>
            )}

            <div className="rating">
              <p className="rating__label" id="rating-label">{t("reservation.review.starsLabel")}</p>
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
                      aria-label={t("reservation.review.star", { count: star })}
                      aria-pressed={star === rating}
                      disabled={jaAvaliada}
                    >
                      <Star size={28} aria-hidden="true" fill={filled ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>
              <p className="rating__value" aria-live="polite">
                {t("reservation.review.selected")} <span className="tabular">{rating}</span> {t("reservation.review.outOf5")}
              </p>
            </div>

            {erroAvaliacao && (
              <div className="alert alert--danger">
                <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
                <p className="alert__body" role="alert">{erroAvaliacao}</p>
              </div>
            )}

            {!jaAvaliada && !podeAvaliar && <p className="journey-muted">{t("reservation.review.availableAfterReturn")}</p>}

            {!jaAvaliada && podeAvaliar && <>
              <div className="field">
                <label className="field__label" htmlFor="comentario-avaliacao">{t("reservation.review.comment")}</label>
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
                  {enviando ? t("reservation.review.sending") : t("reservation.review.submit")}
                </button>
              </div>
            </>}
          </section>

          <aside className="post-panel" aria-labelledby="avaliacao-reserva">
            <h2 id="avaliacao-reserva">{t("reservation.review.infoTitle")}</h2>
            <ul className="post-facts">
              <li>{t("reservation.return.vehicle")} {nomeVeiculo}</li>
              <li>{t("reservation.review.start")} <span className="tabular">{resolveField(formatarDataHora(reserva?.dataHoraInicio))}</span></li>
              <li>{t("reservation.review.end")} <span className="tabular">{resolveField(formatarDataHora(reserva?.dataHoraFim))}</span></li>
              <li>{t("reservation.review.price")} <span className="tabular">{reserva?.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "—"}</span></li>
              <li>{t("reservation.review.paymentMethod")} {resolveField(rotulo(METODO_PAGAMENTO_LABELS, reserva?.metodoPagamento))}</li>
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
}
