import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { updateReserva } from "../services/reservaService";
import "../styles/carselect.css";
import "../styles/auth.css";
import "../styles/payment.css";
import {
  QrPlaceholder,
  QrCell,
  ModalOverlay,
  SuccessModal,
  IconCircle,
  SuccessTitle,
  SuccessSubtitle,
} from "../styles/authStyle";

const QR_PATTERN = [
  1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 1, 1, 0, 1,
  1, 0, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1,
];

function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatValidade(value) {
  return value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
}

export default function Pagamento() {
  const navigate = useNavigate();

  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");

  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [boletoModalOpen, setBoletoModalOpen] = useState(false);
  const [pixGerado, setPixGerado] = useState(false);
  const [boletoGerado, setBoletoGerado] = useState(false);

  const [validando, setValidando] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  const [erroPagamento, setErroPagamento] = useState("");

  useEffect(() => {
    document.title = "MOVA - Pagamento";
  }, []);

  function handleCopyBoleto() {
    navigator.clipboard?.writeText("00190000090341950047918230620704337370000010000");
  }

  function handleFinalizar(event) {
    event.preventDefault();
    setErroPagamento("");

    const metodo = pixGerado
      ? "Pix"
      : boletoGerado
        ? "Boleto Bancário"
        : "Cartão de Crédito";
    updateJourneyStep("pagamento", { metodo });

    const reservaId = getJourneyStep("reserva")?.id;
    if (!reservaId) {
      setErroPagamento(
        "Não encontramos sua reserva. Volte para o checkout e confirme a reserva antes de pagar."
      );
      return;
    }

    setValidando(true);

    updateReserva(reservaId, { statusPagamento: "SUCESSO" })
      .then((reserva) => {
        updateJourneyStep("reserva", {
          id: reserva.id ?? reservaId,
          codigoDesbloqueio: reserva.codigoDesbloqueio || "",
        });
        setValidando(false);
        setPagamentoConfirmado(true);
      })
      .catch((error) => {
        setValidando(false);
        setErroPagamento(error?.message || "Não foi possível confirmar o pagamento.");
      });
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <TopBar showLogo iconColor="white" />
        <h1>Pagamento</h1>
      </div>

      <div className="carro-content">
        <p className="payment-subtitle">Escolha seu método de pagamento</p>

        <form className="auth-form" onSubmit={handleFinalizar} noValidate>
          <div className="payment-method-card">
            <h2>Cartão de Crédito</h2>

            <div className="auth-field">
              <label htmlFor="numeroCartao">Número do Cartão*</label>
              <input
                id="numeroCartao"
                type="text"
                inputMode="numeric"
                placeholder="Número do cartão"
                value={numeroCartao}
                onChange={(e) => setNumeroCartao(formatCardNumber(e.target.value))}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="nomeTitular">Nome do Titular*</label>
              <input
                id="nomeTitular"
                type="text"
                placeholder="Nome do Titular"
                value={nomeTitular}
                onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="validade">Validade (MM/AA)</label>
              <input
                id="validade"
                type="text"
                inputMode="numeric"
                placeholder="Validade (MM/AA)"
                value={validade}
                onChange={(e) => setValidade(formatValidade(e.target.value))}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="cvv">CVV*</label>
              <input
                id="cvv"
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>

          <div className="payment-method-card payment-method-card--action">
            <h2>Pix</h2>
            <button
              type="button"
              className="carro-button"
              onClick={() => {
                setPixGerado(true);
                setPixModalOpen(true);
              }}
            >
              Gerar QR Code
            </button>
            {pixGerado && <p className="payment-generated">QR Code Pix gerado ✓</p>}
          </div>

          <div className="payment-method-card payment-method-card--action">
            <h2>Boleto Bancário</h2>
            <button
              type="button"
              className="carro-button"
              onClick={() => {
                setBoletoGerado(true);
                setBoletoModalOpen(true);
              }}
            >
              Gerar Boleto
            </button>
            {boletoGerado && <p className="payment-generated">Boleto gerado ✓</p>}
          </div>

          <button type="submit" className="carro-button payment-finalizar" disabled={validando}>
            {validando ? "Processando..." : "Finalizar Pagamento"}
          </button>
        </form>

        {erroPagamento && (
          <p className="auth-feedback auth-feedback--error" role="status" aria-live="polite">
            {erroPagamento}
          </p>
        )}

        <p className="payment-secure-note">🔒 Pagamento 100% seguro e criptografado</p>
        <p className="payment-footer-text">
          Dúvidas? <a href="#">Fale com o suporte</a>
        </p>
      </div>

      {pixModalOpen && (
        <div className="payment-validating-overlay" onClick={() => setPixModalOpen(false)}>
          <div className="payment-validating-card" onClick={(event) => event.stopPropagation()}>
            <h2>Pix</h2>
            <QrPlaceholder style={{ margin: "0 auto" }}>
              {QR_PATTERN.map((filled, i) => (
                <QrCell key={i} filled={filled} />
              ))}
            </QrPlaceholder>
            <p className="payment-modal-note">O pix deve ser feito em até 5 minutos</p>
          </div>
        </div>
      )}

      {boletoModalOpen && (
        <div className="payment-validating-overlay" onClick={() => setBoletoModalOpen(false)}>
          <div className="payment-validating-card" onClick={(event) => event.stopPropagation()}>
            <h2>Boleto</h2>
            <QrPlaceholder style={{ margin: "0 auto" }}>
              {QR_PATTERN.map((filled, i) => (
                <QrCell key={i} filled={filled} />
              ))}
            </QrPlaceholder>
            <p className="payment-modal-note">
              ou clique{" "}
              <a href="#" onClick={(event) => { event.preventDefault(); handleCopyBoleto(); }}>
                aqui
              </a>{" "}
              para copiar o código de barras
            </p>
            <p className="payment-modal-note">O boleto deve ser pago em até 5 minutos</p>
          </div>
        </div>
      )}

      {validando && (
        <div className="payment-validating-overlay" role="status" aria-live="polite">
          <div className="payment-validating-card">
            <h2>Validando pagamento</h2>
            <div className="payment-spinner" />
          </div>
        </div>
      )}

      {pagamentoConfirmado && (
        <ModalOverlay>
          <SuccessModal>
            <IconCircle>
              <CheckCircle size={48} color="#2e7d32" strokeWidth={1.5} />
            </IconCircle>
            <SuccessTitle>Pagamento Confirmado!</SuccessTitle>
            <SuccessSubtitle>
              Seu pagamento foi processado com sucesso. Agora você pode desbloquear o veículo.
            </SuccessSubtitle>
            <button type="button" className="carro-button" onClick={() => navigate("/desbloqueio")}>
              Desbloquear Veículo
            </button>
          </SuccessModal>
        </ModalOverlay>
      )}
          <BottomNav />
    </main>
  );
}
