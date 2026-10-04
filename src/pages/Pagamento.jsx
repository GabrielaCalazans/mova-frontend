import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import JourneySteps from "../components/reservation/JourneySteps";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import {
  METODO_PAGAMENTO,
  METODO_PAGAMENTO_LABELS,
  STATUS_PAGAMENTO,
  STATUS_PAGAMENTO_LABELS,
  rotulo,
} from "../services/apiEnums";
import { getPagamentoReserva, getReservaById, iniciarPagamento } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { vehicleTitle } from "../utils/vehicleDisplay";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/payment.css";
import "../styles/postcompra.css";

const TIMEZONE_EXIBICAO = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatarDataHora(valor) {
  if (!valor) return "Data não informada";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: TIMEZONE_EXIBICAO }).format(data);
}

const TOM_PAGAMENTO = {
  [STATUS_PAGAMENTO.AGUARDANDO_PAGAMENTO]: "warning",
  [STATUS_PAGAMENTO.PROCESSANDO]: "info",
  [STATUS_PAGAMENTO.SUCESSO]: "success",
  [STATUS_PAGAMENTO.FALHA]: "danger",
};

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
  const [pagamento, setPagamento] = useState(null);
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
  const pixTrigger = useRef(null);

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
        const statusAtual = encontrada?.statusPagamento ?? "";
        setStatusPagamento(statusAtual);
        if (encontrada?.metodoPagamento) setMetodo(encontrada.metodoPagamento);
        if (statusAtual === STATUS_PAGAMENTO.PROCESSANDO) {
          setProcessando(true);
          acompanhar(TENTATIVAS_POLLING);
        }
        if (typeof getPagamentoReserva === "function") {
          return Promise.resolve(getPagamentoReserva(reservaId)).then((statusFinanceiro) => {
            if (montado.current) setPagamento(statusFinanceiro);
          });
        }
        return null;
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
    // Acompanhamento deve iniciar uma vez por reserva; incluir a função recriada
    // em cada render reiniciaria o polling e poderia duplicar timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (typeof getPagamentoReserva === "function") {
            void Promise.resolve(getPagamentoReserva(reservaId)).then((statusFinanceiro) => {
              if (montado.current) setPagamento(statusFinanceiro);
            });
          }

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
        if (typeof getPagamentoReserva === "function") {
          void Promise.resolve(getPagamentoReserva(reservaId)).then((statusFinanceiro) => {
            if (montado.current) setPagamento(statusFinanceiro);
          });
        }

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

  const reservaForaDaEtapaDePagamento = ["CANCELADA", "REALIZADA", "EM_ANDAMENTO"].includes(reserva?.status);
  const aprovado = statusPagamento === STATUS_PAGAMENTO.SUCESSO && !reservaForaDaEtapaDePagamento;
  const usaCartao = METODOS_COM_CARTAO.includes(metodo);

  const semReserva = !reservaId;
  const mensagemDeErro = semReserva
    ? "Não encontramos sua reserva. Volte para o checkout e confirme a reserva antes de pagar."
    : erroCarregamento;

  const head = (
    <>
      <JourneySteps current="pagamento" />
      <header className="journey-head">
        <h1>Pagamento</h1>
        <p className="page-head__lede">Ambiente de teste: nenhum valor é cobrado de verdade.</p>
      </header>
    </>
  );

  if (carregando && !semReserva) {
    return (
      <main className="journey-page">
        {head}
        <p className="loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          Carregando sua reserva...
        </p>
      </main>
    );
  }

  if (mensagemDeErro) {
    return (
      <main className="journey-page">
        {head}
        <div className="state-block state-block--error" role="status" aria-live="polite">
          <h2 className="state-block__title">Não foi possível abrir o pagamento</h2>
          <p className="state-block__text">{mensagemDeErro}</p>
          <button type="button" className="btn" onClick={() => navigate("/checkout-reserva")}>
            Voltar ao checkout
          </button>
        </div>
      </main>
    );
  }

  if (reservaForaDaEtapaDePagamento) {
    return (
      <main className="journey-page">
        <header className="journey-head">
          <h1>Pagamento</h1>
        </header>
        <section className="state-block" role="status">
          <h2 className="state-block__title">
            {reserva?.status === "CANCELADA"
              ? "Reserva cancelada"
              : reserva?.status === "REALIZADA"
                ? "Reserva concluída"
                : "Locação em andamento"}
          </h2>
          <p className="state-block__text">
            {reserva?.status === "CANCELADA"
              ? "Esta reserva não pode receber pagamento nem liberar o veículo."
              : reserva?.status === "REALIZADA"
                ? "O pagamento e a retirada já foram encerrados para esta reserva."
                : "O pagamento já foi confirmado e a locação está em andamento."}
          </p>
          <button type="button" className="btn" onClick={() => navigate("/historico")}>
            Ver minhas reservas
          </button>
        </section>
      </main>
    );
  }

  const veiculo = reserva?.veiculo;
  const tomPagamento = TOM_PAGAMENTO[statusPagamento] ?? "neutral";

  const resumo = (
    <section className="price-summary pay-summary" aria-labelledby="pay-summary-title">
      <h2 id="pay-summary-title">O que você está pagando</h2>
      <div className="vehicle-strip pay-summary__vehicle">
        <VehicleMedia vehicle={veiculo} />
        <div>
          <p className="vehicle-strip__name">{veiculo ? vehicleTitle(veiculo) : "Veículo da reserva"}</p>
          {veiculo?.placa ? <p className="journey-muted">Placa <span className="tabular">{veiculo.placa}</span></p> : null}
        </div>
      </div>
      <dl className="price-summary__rows">
        <div>
          <dt>Retirada</dt>
          <dd>
            <span className="pay-summary__garage">{reserva?.garagemRetirada?.nome || "Garagem não informada"}</span>
            <span className="tabular">{formatarDataHora(reserva?.dataHoraInicio)}</span>
          </dd>
        </div>
        <div>
          <dt>Devolução</dt>
          <dd>
            <span className="pay-summary__garage">{reserva?.garagemDevolucao?.nome || "Garagem não informada"}</span>
            <span className="tabular">{formatarDataHora(reserva?.dataHoraFim)}</span>
          </dd>
        </div>
        {statusPagamento ? (
          <div>
            <dt>Pagamento</dt>
            <dd><span className={`badge badge--${tomPagamento}`}>{rotulo(STATUS_PAGAMENTO_LABELS, statusPagamento)}</span></dd>
          </div>
        ) : null}
      </dl>
      <div className="price-summary__total">
        <span>Total</span>
        {/* Valor calculado pelo backend — o frontend só exibe. */}
        <strong className="tabular" data-testid="valor-reserva">{formatMoneyBRL(reserva?.valorTotal)}</strong>
      </div>
      <p className="price-summary__note">Pagamento e estorno simulados — nenhum dinheiro real movimentado.</p>
      {pagamento?.statusEstorno && (
        <p className="price-summary__note" role="status">
          Status do estorno: {pagamento.statusEstorno}. Valor pago: <span className="tabular">{formatMoneyBRL(pagamento.valorPago)}</span>.
        </p>
      )}
    </section>
  );

  return (
    <main className="journey-page">
      {head}

      <div className="journey-layout pay-layout">
        <div className="journey-layout__main">
          {/* Sucesso só aparece com a confirmação REAL do backend. */}
          {aprovado ? (
            <section className="pay-success" aria-labelledby="pay-success-title" role="status">
              <h2 className="pay-success__title" id="pay-success-title">
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                Pagamento aprovado
              </h2>
              <p>Sua reserva está confirmada.</p>
              {reserva?.codigoDesbloqueio ? (
                <div className="pay-success__code">
                  <span className="journey-muted">Código de desbloqueio</span>
                  <strong className="unlock-code">{reserva.codigoDesbloqueio}</strong>
                </div>
              ) : null}
              <div className="journey-actions">
                <button type="button" className="btn btn--lg" onClick={() => navigate("/desbloqueio")}>
                  Desbloquear veículo
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate("/historico")}>
                  Ver minhas reservas
                </button>
              </div>
            </section>
          ) : (
            <section className="journey-section" aria-labelledby="pay-method-title">
              <h2 id="pay-method-title">Como você quer pagar</h2>

              {processando && (
                <div className="pay-status" role="status" aria-live="polite">
                  <span className="spinner" aria-hidden="true" />
                  <div>
                    <h3 className="pay-status__title">Processando pagamento</h3>
                    <p className="journey-muted">Aguardando a confirmação do gateway. Não é preciso pagar de novo.</p>
                  </div>
                </div>
              )}

              <form className="pay-form" onSubmit={handleFinalizar} noValidate aria-busy={processando || undefined}>
                <div className="field">
                  <label className="field__label" htmlFor="metodoPagamento">Método de pagamento</label>
                  <select
                    id="metodoPagamento"
                    className="field__control"
                    value={metodo}
                    disabled={processando}
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
                  <fieldset className="fieldset form-panel pay-card" disabled={processando}>
                    <legend>{METODO_PAGAMENTO_LABELS[metodo]}</legend>
                    <p className="field__hint">
                      Ambiente de teste: use qualquer cartão fictício. Final 0000
                      simula recusa e final 0001 simula análise.
                    </p>

                    <div className="field">
                      <label className="field__label" htmlFor="numeroCartao">Número do cartão</label>
                      <input
                        id="numeroCartao"
                        className="field__control tabular"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-required="true"
                        value={numeroCartao}
                        onChange={(e) => setNumeroCartao(formatCardNumber(e.target.value))}
                      />
                    </div>

                    <div className="field">
                      <label className="field__label" htmlFor="nomeTitular">Nome do titular</label>
                      <input
                        id="nomeTitular"
                        className="field__control"
                        type="text"
                        autoComplete="off"
                        aria-required="true"
                        value={nomeTitular}
                        onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="pay-card__row">
                      <div className="field">
                        <label className="field__label" htmlFor="validade">Validade (MM/AA)</label>
                        <input
                          id="validade"
                          className="field__control tabular"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={validade}
                          onChange={(e) => setValidade(formatValidade(e.target.value))}
                        />
                      </div>

                      <div className="field">
                        <label className="field__label" htmlFor="cvv">CVV</label>
                        <input
                          id="cvv"
                          className="field__control tabular"
                          type="password"
                          inputMode="numeric"
                          autoComplete="off"
                          aria-required="true"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                {metodo === METODO_PAGAMENTO.PIX && (
                  <div className="form-panel pay-pix">
                    <p>Pix em ambiente de teste. O QR Code é ilustrativo.</p>
                    <button type="button" className="btn btn--secondary" ref={pixTrigger} onClick={() => setPixModalOpen(true)} disabled={processando}>
                      Ver QR Code
                    </button>
                  </div>
                )}

                {erroPagamento && (
                  <div className="alert alert--danger" role="status" aria-live="polite">
                    <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
                    <div className="alert__body">
                      <p>{erroPagamento}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn--lg btn--block"
                  disabled={processando}
                  aria-busy={processando || undefined}
                >
                  {processando ? "Processando..." : "Pagar"}
                </button>
                <p className="journey-muted">
                  Depois da confirmação, o código de desbloqueio aparece aqui e em Minhas reservas.
                </p>
              </form>

              <p className="journey-muted">
                Dúvidas?{" "}
                <button type="button" className="btn btn--quiet" onClick={() => navigate("/suporte")}>
                  Fale com o suporte
                </button>
              </p>
            </section>
          )}
        </div>

        <aside className="journey-layout__aside">{resumo}</aside>
      </div>

      {pixModalOpen && <PixDialog onClose={() => { setPixModalOpen(false); pixTrigger.current?.focus(); }} />}
    </main>
  );
}

// Diálogo modal do QR ilustrativo: foco no botão de fechar, Esc fecha e o
// Tab fica preso no único controle (é o único elemento focável).
function PixDialog({ onClose }) {
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);

  return (
    <div className="pay-dialog__scrim" onClick={onClose}>
      <div
        className="pay-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pix-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Tab") event.preventDefault();
        }}
      >
        <h2 id="pix-dialog-title">Pix</h2>
        <div className="pay-qr" aria-hidden="true">
          {QR_PATTERN.map((filled, i) => (
            <span key={i} className={filled ? "pay-qr__cell pay-qr__cell--on" : "pay-qr__cell"} />
          ))}
        </div>
        <p className="alert alert--info">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <span className="alert__body">QR Code ilustrativo; nenhuma transferência é feita.</span>
        </p>
        <button type="button" className="btn btn--block" ref={closeRef} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
