import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getJourneyStep } from "../utils/journeyStorage";
import {
  calculateReservationDays,
  formatMoneyBRL,
  parseJourneyDateTime,
} from "../utils/reservationMath";
import { getReservationPricing } from "../services/reservationPricing";
import { createAvaliacao } from "../services/avaliacaoService";
import "../styles/carselect.css";
import "../styles/payment.css";

function resolveField(value, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

export default function AvaliacaoReserva() {
  const navigate = useNavigate();

  const veiculo = useMemo(() => getJourneyStep("veiculo"), []);
  const retirada = useMemo(() => getJourneyStep("retirada"), []);
  const devolucao = useMemo(() => getJourneyStep("devolucao"), []);
  const pagamento = useMemo(() => getJourneyStep("pagamento"), []);

  const [pricing, setPricing] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroAvaliacao, setErroAvaliacao] = useState("");

  useEffect(() => {
    document.title = "MOVA - Avalie sua Experiência";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPricing() {
      const pickupDateTime = parseJourneyDateTime(retirada);
      const dropoffDateTime = parseJourneyDateTime(devolucao);
      const totalDiarias = calculateReservationDays(pickupDateTime, dropoffDateTime);
      const pricingDetails = await getReservationPricing({ days: totalDiarias, vehicle: veiculo });

      if (active) {
        setPricing({ ...pricingDetails, totalDiarias });
      }
    }

    loadPricing();
    return () => {
      active = false;
    };
  }, [retirada, devolucao, veiculo]);

  const nomeVeiculo = veiculo?.nome || `${veiculo?.marca || ""} ${veiculo?.modelo || ""}`.trim();
  const garagemRetiradaDevolucao =
    retirada?.garageName && devolucao?.garageName && retirada.garageName !== devolucao.garageName
      ? `${retirada.garageName} / ${devolucao.garageName}`
      : resolveField(retirada?.garageName || devolucao?.garageName);

  function handleEnviarAvaliacao(event) {
    event.preventDefault();
    setErroAvaliacao("");

    const idReserva = getJourneyStep("reserva")?.id;
    if (!idReserva) {
      setErroAvaliacao("Não encontramos a reserva associada a esta viagem.");
      return;
    }

    setEnviando(true);
    createAvaliacao({ idReserva, nota: rating })
      .then(() => {
        setEnviado(true);
        setTimeout(() => navigate("/home"), 1400);
      })
      .catch((error) => {
        setErroAvaliacao(error?.message || "Não foi possível enviar sua avaliação.");
      })
      .finally(() => setEnviando(false));
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Avalie sua Experiência</h1>
      </div>

      <div className="carro-content">
        <div className="payment-method-card" style={{ textAlign: "center" }}>
          {veiculo?.imagem && (
            <img
              src={veiculo.imagem}
              alt={nomeVeiculo || "Veículo"}
              style={{ width: "100%", maxHeight: "150px", objectFit: "contain", marginBottom: "1rem" }}
            />
          )}

          <div style={{ textAlign: "left" }}>
            <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
              Informações da Reserva
            </h2>
            <p className="carro-list-card__specs" style={{ marginBottom: "1rem" }}>
              Início: {resolveField(retirada?.date)}
              <br />
              Fim: {resolveField(devolucao?.date)}
              <br />
              Quantidade de Dias: {resolveField(pricing?.totalDiarias)}
              <br />
              Retirada e Devolução: {garagemRetiradaDevolucao}
              <br />
              Preço: {pricing ? formatMoneyBRL(pricing.total) : "—"}
              <br />
              Forma de Pagamento: {resolveField(pagamento?.metodo)}
            </p>

            <h2 style={{ color: "var(--color-primary-strong)", fontSize: "1.05rem", margin: "0 0 0.6rem" }}>
              Informações do Veículo
            </h2>
            <p className="carro-list-card__specs" style={{ marginBottom: "1.1rem" }}>
              Modelo: {resolveField(veiculo?.modelo)}
              <br />
              Marca: {resolveField(veiculo?.marca)}
              <br />
              Ano: {resolveField(veiculo?.ano)}
              <br />
              Placa: {resolveField(veiculo?.placa)}
              <br />
              Categoria: {resolveField(veiculo?.categoria)}
              <br />
              Cor: {resolveField(veiculo?.cor)}
              <br />
              Tanque: {resolveField(veiculo?.tanque)}
              <br />
              Desbloqueios: Chave/QR Code
            </p>
          </div>

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
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
                  aria-pressed={star === rating}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
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

          <button type="button" className="carro-button" onClick={handleEnviarAvaliacao} disabled={enviado || enviando}>
            {enviado ? "Avaliação enviada ✓" : enviando ? "Enviando..." : "Enviar Avaliação"}
          </button>
        </div>
      </div>
          <BottomNav />
    </main>
  );
}
