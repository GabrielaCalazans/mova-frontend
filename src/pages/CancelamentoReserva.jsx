import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { cancelarReserva, getPagamentoReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { formatDate, t } from "../i18n";
import "../styles/journey.css";
import "../styles/postcompra.css";

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "short", timeStyle: "short" }) || "—";
}

export default function CancelamentoReserva() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.reservaId || getJourneyStep("reserva")?.id;
  const [reserva, setReserva] = useState(null);
  const [pagamento, setPagamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = t("reservation.cancel.documentTitle");
    if (!id) return;
    const financeiro = typeof getPagamentoReserva === "function" ? Promise.resolve(getPagamentoReserva(id)) : Promise.resolve(null);
    Promise.all([getReservaById(id), financeiro]).then(([resultado, statusFinanceiro]) => {
      setReserva(resultado);
      setPagamento(statusFinanceiro);
    }).catch((error) => {
      setErro(error?.message || t("reservation.return.loadError"));
    }).finally(() => setCarregando(false));
  }, [id]);

  const cancelavel = reserva?.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO || reserva?.status === STATUS_RESERVA.CONFIRMADA;
  const modelo = reserva?.veiculo?.modeloVeiculo;
  const veiculo = [modelo?.marca, modelo?.modelo].filter(Boolean).join(" ") || t("reservation.common.vehicle");

  async function cancelar() {
    if (!cancelavel || enviando) return;
    setEnviando(true); setErro("");
    try {
      const atualizada = await cancelarReserva(reserva.id);
      if (atualizada.status !== STATUS_RESERVA.CANCELADA) throw new Error(t("reservation.cancel.notConfirmed"));
      setReserva(atualizada);
      if (typeof getPagamentoReserva === "function") setPagamento(await getPagamentoReserva(reserva.id));
      setConfirmando(false);
    } catch (error) { setErro(error?.message || t("reservation.cancel.error")); }
    finally { setEnviando(false); }
  }

  const cancelada = reserva?.status === STATUS_RESERVA.CANCELADA;
  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{t("reservation.cancel.title")}</h1>
      </header>
      {carregando && id && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("reservation.return.loading")}</p>
      )}
      {!id && (
        <div className="state-block">
          <p className="state-block__text" role="alert">{t("reservation.cancel.selectReservation")}</p>
          <button type="button" className="btn" onClick={() => navigate("/historico")}>{t("reservation.common.myReservations")}</button>
        </div>
      )}
      {erro && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{erro}</p>
        </div>
      )}
      {reserva && (
        <section className="post-panel" aria-labelledby="cancelamento-reserva">
          <div className="post-panel__head">
            <h2 id="cancelamento-reserva">{t("reservation.return.reservation")}</h2>
            <StatusBadge status={reserva.status} expiradaEm={reserva.expiradaEm} />
          </div>
          <ul className="post-facts">
            <li>{t("reservation.return.vehicle")} {veiculo}</li>
            <li>{t("reservation.cancel.expectedPickup")} <span className="tabular">{formatarDataHora(reserva.dataHoraInicio)}</span></li>
            <li>{t("reservation.cancel.amount")} <span className="tabular">{formatMoneyBRL(reserva.valorTotal)}</span></li>
          </ul>

          {!cancelada && cancelavel && (
            <div className="alert alert--warning">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <div className="alert__body">
                <p className="alert__title">{t("reservation.cancel.feeRuleTitle")}</p>
                <p>{t("reservation.cancel.feeRule")}</p>
                <p>{t("reservation.cancel.ownerCancelRule")}</p>
              </div>
            </div>
          )}
          {!cancelada && !cancelavel && <p className="journey-muted">{t("reservation.cancel.notCancellable")}</p>}
          {!cancelada && cancelavel && !confirmando && (
            <div className="journey-actions">
              <button type="button" className="btn btn--danger btn--lg" onClick={() => setConfirmando(true)}>{t("reservation.cancel.request")}</button>
            </div>
          )}
          {!cancelada && cancelavel && confirmando && (
            <div role="dialog" aria-label={t("reservation.cancel.confirm")} className="post-confirm">
              <p>{t("reservation.cancel.confirmQuestion")}</p>
              <div className="journey-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setConfirmando(false)} disabled={enviando}>{t("reservation.common.back")}</button>
                <button type="button" className="btn btn--danger" onClick={cancelar} disabled={enviando} aria-busy={enviando || undefined}>{enviando ? t("reservation.cancel.cancelling") : t("reservation.cancel.confirm")}</button>
              </div>
            </div>
          )}
          {cancelada && (
            <div className="post-result" role="status">
              <p className="alert alert--success">
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                <span className="alert__body">{t("reservation.cancel.confirmed")}</span>
              </p>
              <p className="post-amount" data-testid="multa-cancelamento">
                <span>{t("reservation.cancel.fee")} </span>
                <strong>{formatMoneyBRL(reserva.multaCancelamento ?? 0)}</strong>
              </p>
              <ul className="post-facts">
                <li>{t("payment.summary.sandboxNote")}</li>
                <li>{t("reservation.cancel.refundStatus")} {pagamento?.statusEstorno || t("reservation.cancel.awaitingServer")}</li>
                <li>{t("reservation.cancel.refundableAmount")} {pagamento?.valorElegivelEstorno != null ? <span className="tabular">{formatMoneyBRL(pagamento.valorElegivelEstorno)}</span> : t("reservation.cancel.awaitingServer")}</li>
              </ul>
              <div className="journey-actions">
                <button type="button" className="btn" onClick={() => navigate("/historico")}>{t("reservation.common.myReservations")}</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
