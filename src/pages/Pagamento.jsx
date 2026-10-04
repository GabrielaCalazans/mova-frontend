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
  STATUS_ESTORNO_LABELS,
  STATUS_PAGAMENTO,
  STATUS_PAGAMENTO_LABELS,
  rotulo,
  PRAZO_PAGAMENTO_MINUTOS,
} from "../services/apiEnums";
import { getPagamentoReserva, getReservaById, iniciarPagamento } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { vehicleTitle } from "../utils/vehicleDisplay";
import { formatDate, t } from "../i18n";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/payment.css";
import "../styles/postcompra.css";

const TIMEZONE_EXIBICAO = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "short", timeStyle: "short", timeZone: TIMEZONE_EXIBICAO }) || t("payment.dateMissing");
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

// Espelha o schema do backend (pagamento.schema.ts) para não exibir as
// mensagens em inglês do Zod; o cartão vale até o fim do mês de validade.
function validarCartao({ numero, nome, validade, cvv }, hoje = new Date()) {
  if (numero.replace(/\D/g, "").length < 13) return t("payment.card.errors.number");
  if (nome.trim().length < 3) return t("payment.card.errors.holder");
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(validade);
  if (!match) return t("payment.card.errors.expiryFormat");
  const fimDoMes = new Date(2000 + Number(match[2]), Number(match[1]), 1);
  if (fimDoMes <= hoje) return t("payment.card.errors.expired");
  if (!/^\d{3,4}$/.test(cvv)) return t("payment.card.errors.cvv");
  return "";
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
    document.title = t("payment.documentTitle");
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
          error?.message || t("payment.errors.load"),
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
        t("payment.errors.stillProcessing"),
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
            error?.message || t("payment.errors.verify"),
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
      t("payment.errors.declined"),
    );
  }

  function handleFinalizar(event) {
    event.preventDefault();
    setErroPagamento("");

    if (!reservaId) {
      setErroPagamento(
        t("payment.errors.noReservation"),
      );
      return;
    }

    const usaCartao = METODOS_COM_CARTAO.includes(metodo);
    const erroCartao = usaCartao
      ? validarCartao({ numero: numeroCartao, nome: nomeTitular, validade, cvv })
      : "";
    if (erroCartao) {
      setErroPagamento(erroCartao);
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
          error?.message || t("payment.errors.start"),
        );
      });
  }

  const reservaForaDaEtapaDePagamento = ["CANCELADA", "REALIZADA", "EM_ANDAMENTO"].includes(reserva?.status);
  const aprovado = statusPagamento === STATUS_PAGAMENTO.SUCESSO && !reservaForaDaEtapaDePagamento;
  const usaCartao = METODOS_COM_CARTAO.includes(metodo);

  const semReserva = !reservaId;
  const mensagemDeErro = semReserva
    ? t("payment.errors.noReservation")
    : erroCarregamento;

  const head = (
    <>
      <JourneySteps current="pagamento" />
      <header className="journey-head">
        <h1>{t("payment.title")}</h1>
        <p className="page-head__lede">{t("payment.sandboxLede")}</p>
      </header>
    </>
  );

  if (carregando && !semReserva) {
    return (
      <main className="journey-page">
        {head}
        <p className="loading-state" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          {t("payment.loading")}
        </p>
      </main>
    );
  }

  if (mensagemDeErro) {
    return (
      <main className="journey-page">
        {head}
        <div className="state-block state-block--error" role="status" aria-live="polite">
          <h2 className="state-block__title">{t("payment.errors.openTitle")}</h2>
          <p className="state-block__text">{mensagemDeErro}</p>
          <button type="button" className="btn" onClick={() => navigate("/checkout-reserva")}>
            {t("payment.backToCheckout")}
          </button>
        </div>
      </main>
    );
  }

  if (reservaForaDaEtapaDePagamento) {
    return (
      <main className="journey-page">
        <header className="journey-head">
          <h1>{t("payment.title")}</h1>
        </header>
        <section className="state-block" role="status">
          <h2 className="state-block__title">
            {reserva?.expiradaEm
              ? t("payment.closed.expiredTitle")
              : reserva?.status === "CANCELADA"
              ? t("payment.closed.cancelledTitle")
              : reserva?.status === "REALIZADA"
                ? t("payment.closed.completedTitle")
                : t("payment.closed.inProgressTitle")}
          </h2>
          <p className="state-block__text">
            {reserva?.expiradaEm
              ? t("payment.closed.expiredText", { minutos: PRAZO_PAGAMENTO_MINUTOS })
              : reserva?.status === "CANCELADA"
              ? t("payment.closed.cancelledText")
              : reserva?.status === "REALIZADA"
                ? t("payment.closed.completedText")
                : t("payment.closed.inProgressText")}
          </p>
          <button type="button" className="btn" onClick={() => navigate("/historico")}>
            {t("payment.myReservations")}
          </button>
        </section>
      </main>
    );
  }

  const veiculo = reserva?.veiculo;
  // Task 10: a reserva não paga segura o veículo só até criadaEm + 15 min.
  const prazoPagamento = reserva?.status === "AGUARDANDO_PAGAMENTO" && reserva?.criadaEm
    ? new Date(new Date(reserva.criadaEm).getTime() + PRAZO_PAGAMENTO_MINUTOS * 60 * 1000)
    : null;
  const tomPagamento = TOM_PAGAMENTO[statusPagamento] ?? "neutral";

  const resumo = (
    <section className="price-summary pay-summary" aria-labelledby="pay-summary-title">
      <h2 id="pay-summary-title">{t("payment.summary.title")}</h2>
      <div className="vehicle-strip pay-summary__vehicle">
        <VehicleMedia vehicle={veiculo} />
        <div>
          <p className="vehicle-strip__name">{veiculo ? vehicleTitle(veiculo) : t("payment.summary.vehicleFallback")}</p>
          {veiculo?.placa ? <p className="journey-muted">{t("payment.summary.plate")} <span className="tabular">{veiculo.placa}</span></p> : null}
        </div>
      </div>
      <dl className="price-summary__rows">
        <div>
          <dt>{t("payment.summary.pickup")}</dt>
          <dd>
            <span className="pay-summary__garage">{reserva?.garagemRetirada?.nome || t("payment.summary.garageMissing")}</span>
            <span className="tabular">{formatarDataHora(reserva?.dataHoraInicio)}</span>
          </dd>
        </div>
        <div>
          <dt>{t("payment.summary.return")}</dt>
          <dd>
            <span className="pay-summary__garage">{reserva?.garagemDevolucao?.nome || t("payment.summary.garageMissing")}</span>
            <span className="tabular">{formatarDataHora(reserva?.dataHoraFim)}</span>
          </dd>
        </div>
        {statusPagamento ? (
          <div>
            <dt>{t("payment.summary.payment")}</dt>
            <dd><span className={`badge badge--${tomPagamento}`}>{rotulo(STATUS_PAGAMENTO_LABELS, statusPagamento)}</span></dd>
          </div>
        ) : null}
      </dl>
      <div className="price-summary__total">
        <span>{t("payment.summary.total")}</span>
        {/* Valor calculado pelo backend — o frontend só exibe. */}
        <strong className="tabular" data-testid="valor-reserva">{formatMoneyBRL(reserva?.valorTotal)}</strong>
      </div>
      <p className="price-summary__note">{t("payment.summary.sandboxNote")}</p>
      {/* Só quando há estorno em curso: antes de pagar, "Não solicitado" é ruído. */}
      {pagamento?.statusEstorno && pagamento.statusEstorno !== "NAO_SOLICITADO" && (
        <p className="price-summary__note">
          {t("payment.summary.refund", { status: rotulo(STATUS_ESTORNO_LABELS, pagamento.statusEstorno) })} <span className="tabular">{formatMoneyBRL(pagamento.valorPago)}</span>.
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
                {t("payment.success.title")}
              </h2>
              <p>{t("payment.success.text")}</p>
              {reserva?.codigoDesbloqueio ? (
                <div className="pay-success__code">
                  <span className="journey-muted">{t("payment.success.unlockCode")}</span>
                  <strong className="unlock-code">{reserva.codigoDesbloqueio}</strong>
                </div>
              ) : null}
              <div className="journey-actions">
                <button type="button" className="btn btn--lg" onClick={() => navigate("/desbloqueio")}>
                  {t("payment.success.unlock")}
                </button>
                <button type="button" className="btn btn--secondary btn--lg" onClick={() => navigate("/historico")}>
                  {t("payment.myReservations")}
                </button>
              </div>
            </section>
          ) : (
            <section className="journey-section" aria-labelledby="pay-method-title">
              <h2 id="pay-method-title">{t("payment.method.title")}</h2>

              {processando && (
                <div className="pay-status" role="status" aria-live="polite">
                  <span className="spinner" aria-hidden="true" />
                  <div>
                    <h3 className="pay-status__title">{t("payment.processing.title")}</h3>
                    <p className="journey-muted">{t("payment.processing.text")}</p>
                  </div>
                </div>
              )}

              <form className="pay-form" onSubmit={handleFinalizar} noValidate aria-busy={processando || undefined}>
                <div className="field">
                  <label className="field__label" htmlFor="metodoPagamento">{t("payment.method.label")}</label>
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
                      {t("payment.card.sandboxHint")}
                    </p>

                    <div className="field">
                      <label className="field__label" htmlFor="numeroCartao">{t("payment.card.number")}</label>
                      <input
                        id="numeroCartao"
                        className="field__control tabular"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        aria-required="true"
                        value={numeroCartao}
                        onChange={(e) => setNumeroCartao(formatCardNumber(e.target.value))}
                      />
                    </div>

                    <div className="field">
                      <label className="field__label" htmlFor="nomeTitular">{t("payment.card.holder")}</label>
                      <input
                        id="nomeTitular"
                        className="field__control"
                        type="text"
                        autoComplete="cc-name"
                        aria-required="true"
                        value={nomeTitular}
                        onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="pay-card__row">
                      <div className="field">
                        <label className="field__label" htmlFor="validade">{t("payment.card.expiry")}</label>
                        <input
                          id="validade"
                          className="field__control tabular"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          value={validade}
                          onChange={(e) => setValidade(formatValidade(e.target.value))}
                        />
                      </div>

                      <div className="field">
                        <label className="field__label" htmlFor="cvv">{t("payment.card.cvv")}</label>
                        <input
                          id="cvv"
                          className="field__control tabular"
                          type="password"
                          inputMode="numeric"
                          autoComplete="cc-csc"
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
                    <p>{t("payment.pix.sandboxNote")}</p>
                    <button type="button" className="btn btn--secondary" ref={pixTrigger} onClick={() => setPixModalOpen(true)} disabled={processando}>
                      {t("payment.pix.show")}
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

                {prazoPagamento && (
                  <p className="journey-muted">
                    {t("payment.deadline", {
                      hora: formatDate(prazoPagamento, { timeStyle: "short", timeZone: TIMEZONE_EXIBICAO }),
                      minutos: PRAZO_PAGAMENTO_MINUTOS,
                    })}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn--lg btn--block"
                  disabled={processando}
                  aria-busy={processando || undefined}
                >
                  {processando ? t("payment.processing.button") : t("payment.pay")}
                </button>
                <p className="journey-muted">
                  {t("payment.afterConfirmation")}
                </p>
              </form>

              <p className="journey-muted">
                {t("payment.questions")}{" "}
                <button type="button" className="btn btn--quiet" onClick={() => navigate("/suporte")}>
                  {t("payment.contactSupport")}
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
        <h2 id="pix-dialog-title">{t("payment.pix.title")}</h2>
        <div className="pay-qr" aria-hidden="true">
          {QR_PATTERN.map((filled, i) => (
            <span key={i} className={filled ? "pay-qr__cell pay-qr__cell--on" : "pay-qr__cell"} />
          ))}
        </div>
        <p className="alert alert--info">
          <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
          <span className="alert__body">{t("payment.pix.dialogNote")}</span>
        </p>
        <button type="button" className="btn btn--block" ref={closeRef} onClick={onClose}>
          {t("payment.close")}
        </button>
      </div>
    </div>
  );
}
