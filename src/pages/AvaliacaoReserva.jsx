import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getJourneyStep } from "../utils/journeyStorage";
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
  const navigate = useNavigate();
  const location = useLocation();

  // A tela e alcancada de duas formas: (1) logo apos o desbloqueio, no
  // fluxo linear de reserva (dados ainda na journeyStorage da sessao), ou
  // (2) clicando numa reserva concluida no Historico (recebe o id via
  // location.state). Nos dois casos, o id real da reserva manda.
  const veiculoJourney = getJourneyStep("veiculo");
  const pagamentoJourney = getJourneyStep("pagamento");
  const reservaId = location.state?.reservaId || getJourneyStep("reserva")?.id;

  const [reserva, setReserva] = useState(null);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroAvaliacao, setErroAvaliacao] = useState("");

  useEffect(() => {
    document.title = "MOVA - Avalie sua Experiência";
  }, []);

  useEffect(() => {
    if (!reservaId) {
      setCarregando(false);
      setErroCarregamento("Não encontramos a reserva a ser avaliada.");
      return;
    }

    let active = true;
    setCarregando(true);
    setErroCarregamento("");

    Promise.all([
      getReservaById(reservaId).catch(() => null),
      getAvaliacaoDaReserva(reservaId).catch(() => null),
    ]).then(([reservaResult, avaliacaoResult]) => {
      if (!active) return;
      setReserva(reservaResult);
      if (avaliacaoResult) {
        setAvaliacaoExistente(avaliacaoResult);
        setRating(Math.round(avaliacaoResult.nota) || 5);
      }
      setCarregando(false);
    });

    return () => {
      active = false;
    };
  }, [reservaId]);

  const nomeVeiculo = resolveVeiculoNome(reserva, veiculoJourney);
  const jaAvaliada = Boolean(avaliacaoExistente);

  function handleEnviarAvaliacao(event) {
    event.preventDefault();
    setErroAvaliacao("");

    if (!reservaId) {
      setErroAvaliacao("Não encontramos a reserva associada a esta viagem.");
      return;
    }

    setEnviando(true);
    createAvaliacao({ idReserva: reservaId, nota: rating })
      .then(() => {
        setEnviado(true);
        setTimeout(() => navigate("/historico"), 1400);
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
        {carregando && <p className="carro-status">Carregando dados da reserva…</p>}

        {!carregando && erroCarregamento && !reserva && (
          <p className="carro-status">{erroCarregamento}</p>
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
                Forma de Pagamento: {resolveField(pagamentoJourney?.metodo)}
              </p>

              <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
                Informações do Veículo
              </h2>
              <p className="carro-list-card__specs" style={{ marginBottom: "1.1rem" }}>
                Veículo: {nomeVeiculo}
              </p>
            </div>

            {jaAvaliada && (
              <p style={{ color: "var(--color-primary-strong)", fontWeight: 600, marginBottom: "0.5rem" }}>
                Você já avaliou esta reserva.
              </p>
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
              <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
                {erroAvaliacao}
              </p>
            )}

            {!jaAvaliada && (
              <button type="button" className="carro-button" onClick={handleEnviarAvaliacao} disabled={enviado || enviando}>
                {enviado ? "Avaliação enviada ✓" : enviando ? "Enviando..." : "Enviar Avaliação"}
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
