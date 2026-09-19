import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Star } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getJourneyStep } from "../utils/journeyStorage";
import { METODO_PAGAMENTO_LABELS, rotulo, STATUS_RESERVA } from "../services/apiEnums";
import { formatMoneyBRL } from "../utils/reservationMath";
import { getReservaById } from "../services/reservaService";
import { createAvaliacao, getAvaliacaoDaReserva } from "../services/avaliacaoService";
import "../styles/carselect.css";
import "../styles/payment.css";

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

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Avalie sua Experiência</h1>
      </div>

      <div className="carro-content">
        {!semReservaId && carregando && <p className="carro-status">Carregando dados da reserva…</p>}

        {((semReservaId || !carregando) && mensagemCarregamento && !reserva) && (
          <p className="carro-status" role="alert">{mensagemCarregamento}</p>
        )}

        {!carregando && (reserva || veiculoJourney) && (
          <div className="payment-method-card" style={{ textAlign: "center" }}>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
                Informações da Reserva
              </h2>
              <p className="carro-list-card__specs" style={{ marginBottom: "1rem" }}>
                Início: {resolveField(formatarDataHora(reserva?.dataHoraInicio))}
                <br />
                Fim: {resolveField(formatarDataHora(reserva?.dataHoraFim))}
                <br />
                Preço: {reserva?.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "—"}
                <br />
                Forma de Pagamento:{" "}
                {resolveField(
                  rotulo(METODO_PAGAMENTO_LABELS, reserva?.metodoPagamento),
                )}
              </p>

              <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
                Informações do Veículo
              </h2>
              <p className="carro-list-card__specs" style={{ marginBottom: "1.1rem" }}>
                Veículo: {nomeVeiculo}
              </p>
            </div>

            {jaAvaliada && (
              <div role="status" style={{ color: "var(--color-primary-strong)", fontWeight: 600, marginBottom: "0.8rem" }}>
                <p>Você já avaliou esta reserva com nota {avaliacaoExistente.nota}.</p>
                {avaliacaoExistente.comentario && <p style={{ fontWeight: 400 }}>“{avaliacaoExistente.comentario}”</p>}
              </div>
            )}

            <div
              role="radiogroup"
              aria-label="Avaliação em estrelas"
              style={{ display: "flex", justifyContent: "center", gap: "0.35rem", marginBottom: "1.25rem" }}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !jaAvaliada && setRating(star)}
                    onMouseEnter={() => !jaAvaliada && setHoverRating(star)}
                    onMouseLeave={() => !jaAvaliada && setHoverRating(0)}
                    aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                    aria-pressed={star === rating}
                    disabled={jaAvaliada}
                    style={{ background: "none", border: "none", cursor: jaAvaliada ? "default" : "pointer", padding: 0 }}
                  >
                    <Star
                      size={28}
                      color="var(--color-primary-strong)"
                      fill={filled ? "var(--color-primary-strong)" : "none"}
                    />
                  </button>
                );
              })}
            </div>

            {erroAvaliacao && (
              <p className="auth-feedback auth-feedback--error" role="alert">
                {erroAvaliacao}
              </p>
            )}

            {!jaAvaliada && !podeAvaliar && <p>A avaliação fica disponível após a devolução da reserva.</p>}

            {!jaAvaliada && podeAvaliar && <>
              <label htmlFor="comentario-avaliacao" style={{ display: "block", textAlign: "left", marginBottom: "0.35rem" }}>Comentário (opcional)</label>
              <textarea
                id="comentario-avaliacao"
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                maxLength={255}
                rows={4}
                placeholder="Conte como foi sua experiência"
                style={{ width: "100%", boxSizing: "border-box", marginBottom: "0.25rem" }}
              />
              <p style={{ marginTop: 0, textAlign: "right", fontSize: "0.8rem" }}>{comentario.length}/255</p>
              <button type="button" className="carro-button" onClick={handleEnviarAvaliacao} disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar Avaliação"}
              </button>
            </>}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
