import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import BottomNav from "../components/BottomNav";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import {
  METODO_PAGAMENTO,
  METODO_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO,
} from "../services/apiEnums";
import { getReservaById, iniciarPagamento } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
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

// Pagamento em SANDBOX.
//
// O frontend nunca declara o resultado: envia o método (e, para cartão, os
// dados de teste) e o backend decide, registra a cobrança e entrega o desfecho
// ao gateway simulado, que responde por webhook assinado. Aqui só se observa o
// statusPagamento até ele sair de PROCESSANDO.
//
// Nenhuma credencial ou segredo de assinatura vive no frontend.
// Ver auditoria/PAGAMENTO.md.

const QR_PATTERN = [
  1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 1, 1, 0, 1,
  1, 0, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1,
];

const METODOS = [
  METODO_PAGAMENTO.CARTAO_CREDITO,
  METODO_PAGAMENTO.CARTAO_DEBITO,
  METODO_PAGAMENTO.PIX,
  METODO_PAGAMENTO.CARTEIRA_DIGITAL,
];

const METODOS_COM_CARTAO = [
  METODO_PAGAMENTO.CARTAO_CREDITO,
  METODO_PAGAMENTO.CARTAO_DEBITO,
];

// Enquanto o gateway não decide, a reserva fica PROCESSANDO. Observa-se até
// resolver; se não resolver, o usuário acompanha pelo histórico.
const INTERVALO_POLLING_MS = 2000;
const TENTATIVAS_POLLING = 15;

function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatValidade(value) {
  return value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
}

export default function Pagamento() {
  const navigate = useNavigate();

  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  const [metodo, setMetodo] = useState(METODO_PAGAMENTO.CARTAO_CREDITO);
  const [numeroCartao, setNumeroCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");

  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState("");
  const [erroPagamento, setErroPagamento] = useState("");

  const montado = useRef(true);
  const timer = useRef(null);

  const reservaId = getJourneyStep("reserva")?.id;

  useEffect(() => {
    document.title = "MOVA - Pagamento";
  }, []);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    // Sem reserva na jornada nao ha o que carregar; o estado e derivado no
    // render (SEM_RESERVA), nao por setState dentro do efeito.
    if (!reservaId) return;

    getReservaById(reservaId)
      .then((encontrada) => {
        if (!montado.current) return;
        setReserva(encontrada);
        setStatusPagamento(encontrada?.statusPagamento ?? "");
        if (encontrada?.metodoPagamento) setMetodo(encontrada.metodoPagamento);
      })
      .catch((error) => {
        if (!montado.current) return;
        setErroCarregamento(
          error?.message || "Não foi possível carregar sua reserva.",
        );
      })
      .finally(() => {
        if (montado.current) setCarregando(false);
      });
  }, [reservaId]);

  // Observa a reserva até o gateway decidir. Só o backend muda esse status.
  // Laço agendado (nao recursivo) para nao depender de uma funcao antes de ela
  // existir — e para poder ser cancelado na desmontagem.
  const acompanhar = (tentativasRestantes) => {
    if (tentativasRestantes <= 0) {
      setProcessando(false);
      setErroPagamento(
        "O pagamento ainda está em análise. Acompanhe pelo histórico de reservas.",
      );
      return;
    }

    timer.current = setTimeout(() => {
      getReservaById(reservaId)
        .then((atual) => {
          if (!montado.current) return;
          setReserva(atual);
          setStatusPagamento(atual?.statusPagamento ?? "");

          if (atual?.statusPagamento === STATUS_PAGAMENTO.PROCESSANDO) {
            acompanhar(tentativasRestantes - 1);
            return;
          }

          setProcessando(false);
          concluir(atual);
        })
        .catch((error) => {
          if (!montado.current) return;
          setProcessando(false);
          setErroPagamento(
            error?.message || "Não foi possível verificar o pagamento.",
          );
        });
    }, INTERVALO_POLLING_MS);
  };

  // Desfecho final: só o statusPagamento vindo do backend decide.
  function concluir(atual) {
    if (atual?.statusPagamento === STATUS_PAGAMENTO.SUCESSO) {
      updateJourneyStep("reserva", {
        id: atual.id,
        valorTotal: atual.valorTotal,
        codigoDesbloqueio: atual.codigoDesbloqueio || "",
      });
      return;
    }
    setErroPagamento(
      "Pagamento não aprovado. Confira os dados e tente novamente.",
    );
  }

  function handleFinalizar(event) {
    event.preventDefault();
    setErroPagamento("");

    if (!reservaId) {
      setErroPagamento(
        "Não encontramos sua reserva. Volte para o checkout e confirme a reserva antes de pagar.",
      );
      return;
    }

    const usaCartao = METODOS_COM_CARTAO.includes(metodo);
    if (usaCartao && numeroCartao.replace(/\D/g, "").length < 13) {
      setErroPagamento("Informe um número de cartão válido.");
      return;
    }

    setProcessando(true);

    // Só o MEIO e os dados de teste. Nada de valor, status ou resultado: o
    // backend calcula o valor pela reserva e decide o desfecho.
    iniciarPagamento(reservaId, {
      metodoPagamento: metodo,
      ...(usaCartao
        ? {
            cartao: {
              numero: numeroCartao.replace(/\D/g, ""),
              nome: nomeTitular,
              validade,
              cvv,
            },
          }
        : {}),
    })
      .then((resultado) => {
        if (!montado.current) return;
        const atual = resultado?.reserva ?? null;
        setReserva(atual);
        setStatusPagamento(atual?.statusPagamento ?? "");

        if (atual?.statusPagamento === STATUS_PAGAMENTO.PROCESSANDO) {
          acompanhar(TENTATIVAS_POLLING);
          return;
        }

        setProcessando(false);
        concluir(atual);
      })
      .catch((error) => {
        if (!montado.current) return;
        setProcessando(false);
        setErroPagamento(
          error?.message || "Não foi possível iniciar o pagamento.",
        );
      });
  }

  const aprovado = statusPagamento === STATUS_PAGAMENTO.SUCESSO;
  const usaCartao = METODOS_COM_CARTAO.includes(metodo);

  const semReserva = !reservaId;
  const mensagemDeErro = semReserva
    ? "Não encontramos sua reserva. Volte para o checkout e confirme a reserva antes de pagar."
    : erroCarregamento;

  if (carregando && !semReserva) {
    return (
      <main className="carro-page">
        <div className="carro-header">
          <h1>Pagamento</h1>
        </div>
        <div className="carro-content">
          <p role="status" aria-live="polite">
            Carregando sua reserva...
          </p>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (mensagemDeErro) {
    return (
      <main className="carro-page">
        <div className="carro-header">
          <h1>Pagamento</h1>
        </div>
        <div className="carro-content">
          <p
            className="auth-feedback auth-feedback--error"
            role="status"
            aria-live="polite"
          >
            {mensagemDeErro}
          </p>
          <button
            type="button"
            className="carro-button"
            onClick={() => navigate("/checkout-reserva")}
          >
            Voltar ao checkout
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="carro-page">
      <div className="carro-header">
        <h1>Pagamento</h1>
      </div>

      <div className="carro-content">
        <section className="payment-method-card">
          <h2>Valor da reserva</h2>
          {/* Valor calculado pelo backend — o frontend só exibe. */}
          <p className="payment-total" data-testid="valor-reserva">
            {formatMoneyBRL(reserva?.valorTotal)}
          </p>
        </section>

        <p className="payment-subtitle">Escolha seu método de pagamento</p>

        <form className="auth-form" onSubmit={handleFinalizar} noValidate>
          <div className="auth-field">
            <label htmlFor="metodoPagamento">Método de pagamento*</label>
            <select
              id="metodoPagamento"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              {METODOS.map((codigo) => (
                <option key={codigo} value={codigo}>
                  {METODO_PAGAMENTO_LABELS[codigo]}
                </option>
              ))}
            </select>
          </div>

          {usaCartao && (
            <div className="payment-method-card">
              <h2>{METODO_PAGAMENTO_LABELS[metodo]}</h2>
              <p className="payment-modal-note">
                Ambiente de teste: use qualquer cartão fictício. Final 0000
                simula recusa e final 0001 simula análise.
              </p>

              <div className="auth-field">
                <label htmlFor="numeroCartao">Número do Cartão*</label>
                <input
                  id="numeroCartao"
                  type="text"
                  inputMode="numeric"
                  placeholder="Número do cartão"
                  value={numeroCartao}
                  onChange={(e) =>
                    setNumeroCartao(formatCardNumber(e.target.value))
                  }
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
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </div>
            </div>
          )}

          {metodo === METODO_PAGAMENTO.PIX && (
            <div className="payment-method-card payment-method-card--action">
              <h2>Pix</h2>
              <button
                type="button"
                className="carro-button"
                onClick={() => setPixModalOpen(true)}
              >
                Ver QR Code
              </button>
            </div>
          )}

          <button
            type="submit"
            className="carro-button payment-finalizar"
            disabled={processando}
          >
            {processando ? "Processando..." : "Pagar"}
          </button>
        </form>

        {erroPagamento && (
          <p
            className="auth-feedback auth-feedback--error"
            role="status"
            aria-live="polite"
          >
            {erroPagamento}
          </p>
        )}

        <p className="payment-secure-note">
          🔒 Ambiente de teste — nenhum valor é cobrado de verdade
        </p>
        <p className="payment-footer-text">
          Dúvidas? <a href="#">Fale com o suporte</a>
        </p>
      </div>

      {pixModalOpen && (
        <div
          className="payment-validating-overlay"
          onClick={() => setPixModalOpen(false)}
        >
          <div
            className="payment-validating-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Pix</h2>
            <QrPlaceholder style={{ margin: "0 auto" }}>
              {QR_PATTERN.map((filled, i) => (
                <QrCell key={i} filled={filled} />
              ))}
            </QrPlaceholder>
            <p className="payment-modal-note">
              O pix deve ser feito em até 5 minutos
            </p>
          </div>
        </div>
      )}

      {processando && (
        <div
          className="payment-validating-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="payment-validating-card">
            <h2>Processando pagamento</h2>
            <p className="payment-modal-note">
              Aguardando a confirmação do gateway.
            </p>
            <div className="payment-spinner" />
          </div>
        </div>
      )}

      {/* Sucesso só aparece com a confirmação REAL do backend. */}
      {aprovado && (
        <ModalOverlay>
          <SuccessModal>
            <IconCircle>
              <CheckCircle size={48} color="#2e7d32" strokeWidth={1.5} />
            </IconCircle>
            <SuccessTitle>Pagamento aprovado</SuccessTitle>
            <SuccessSubtitle>
              Sua reserva está confirmada.
              {reserva?.codigoDesbloqueio
                ? ` Código de desbloqueio: ${reserva.codigoDesbloqueio}`
                : ""}
            </SuccessSubtitle>
            <button
              type="button"
              className="carro-button"
              onClick={() => navigate("/desbloqueio")}
            >
              Desbloquear veículo
            </button>
            <button
              type="button"
              className="carro-button"
              onClick={() => navigate("/historico")}
            >
              Ver minhas reservas
            </button>
          </SuccessModal>
        </ModalOverlay>
      )}
      <BottomNav />
    </main>
  );
}
