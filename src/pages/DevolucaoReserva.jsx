import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { devolverReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { formatDate, t } from "../i18n";
import "../styles/journey.css";
import "../styles/postcompra.css";

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "short", timeStyle: "short" }) || "—";
}

export default function DevolucaoReserva() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.reservaId || getJourneyStep("reserva")?.id;
  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = t("reservation.return.documentTitle");
    let ativo = true;
    if (!id) return () => { ativo = false; };
    getReservaById(id).then((resultado) => {
      if (ativo) setReserva(resultado);
    }).catch((error) => {
      if (ativo) setErro(error?.message || t("reservation.return.loadError"));
    }).finally(() => {
      if (ativo) setCarregando(false);
    });
    return () => { ativo = false; };
  }, [id]);

  async function confirmar() {
    if (enviando || reserva?.status !== STATUS_RESERVA.EM_ANDAMENTO || !reserva?.codigoUsadoEm) return;
    setEnviando(true);
    setErro("");
    try {
      const atualizada = await devolverReserva(reserva.id);
      if (atualizada.status !== STATUS_RESERVA.REALIZADA || !atualizada.devolvidoEm) {
        throw new Error(t("reservation.return.notConfirmed"));
      }
      setReserva(atualizada);
    } catch (error) {
      setErro(error?.message || t("reservation.return.error"));
    } finally {
      setEnviando(false);
    }
  }

  const realizada = reserva?.status === STATUS_RESERVA.REALIZADA && Boolean(reserva.devolvidoEm);
  const podeDevolver = reserva?.status === STATUS_RESERVA.EM_ANDAMENTO && Boolean(reserva.codigoUsadoEm);
  const modelo = reserva?.veiculo?.modeloVeiculo;
  const veiculo = [modelo?.marca, modelo?.modelo].filter(Boolean).join(" ") || t("reservation.common.vehicle");

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{t("reservation.return.title")}</h1>
      </header>
      {carregando && id && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("reservation.return.loading")}</p>
      )}
      {!id && (
        <div className="state-block">
          <p className="state-block__text" role="alert">{t("reservation.return.selectReservation")}</p>
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
        <section className="post-panel" aria-labelledby="devolucao-reserva">
          <div className="post-panel__head">
            <h2 id="devolucao-reserva">{t("reservation.return.reservation")}</h2>
            <StatusBadge status={reserva.status} expiradaEm={reserva.expiradaEm} />
          </div>
          <ul className="post-facts">
            <li>{t("reservation.return.vehicle")} {veiculo}{reserva.veiculo?.placa ? ` · ${reserva.veiculo.placa}` : ""}</li>
            <li>{t("reservation.return.expectedDate")} <span className="tabular">{formatarDataHora(reserva.dataHoraFim)}</span></li>
            <li>{t("reservation.return.actualDate")} {realizada ? <span className="tabular">{formatarDataHora(reserva.devolvidoEm)}</span> : t("reservation.return.willBeRecorded")}</li>
          </ul>
          {realizada && (
            <p className="post-amount" data-testid="cobranca-atraso">
              <span>{t("reservation.return.lateFee")} </span>
              <strong>{formatMoneyBRL(reserva.cobrancaAtraso ?? 0)}</strong>
            </p>
          )}
          {realizada && (
            <div className="alert alert--success">
              <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
              <p className="alert__body" role="status">{t("reservation.return.confirmed")}</p>
            </div>
          )}
          {!realizada && podeDevolver && <>
            <p className="journey-muted">{t("reservation.return.lateNotice")}</p>
            <div className="journey-actions">
              <button type="button" className="btn btn--lg" disabled={enviando} aria-busy={enviando || undefined} onClick={confirmar}>
                {enviando ? t("reservation.return.submitting") : t("reservation.return.submit")}
              </button>
            </div>
          </>}
          {!realizada && !podeDevolver && <p className="journey-muted">{t("reservation.return.notInProgress")}</p>}
          {realizada && (
            <div className="journey-actions">
              <button type="button" className="btn btn--lg" onClick={() => navigate("/avaliacao", { state: { reservaId: reserva.id } })}>{t("reservation.return.rate")}</button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
