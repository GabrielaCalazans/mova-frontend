import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { devolverReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/journey.css";
import "../styles/postcompra.css";

function formatarDataHora(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
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
    document.title = "MOVA - Devolução";
    let ativo = true;
    if (!id) return () => { ativo = false; };
    getReservaById(id).then((resultado) => {
      if (ativo) setReserva(resultado);
    }).catch((error) => {
      if (ativo) setErro(error?.message || "Não foi possível carregar a reserva.");
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
        throw new Error("A devolução não foi confirmada pelo sistema. Atualize a reserva e tente novamente.");
      }
      setReserva(atualizada);
    } catch (error) {
      setErro(error?.message || "Não foi possível registrar a devolução.");
    } finally {
      setEnviando(false);
    }
  }

  const realizada = reserva?.status === STATUS_RESERVA.REALIZADA && Boolean(reserva.devolvidoEm);
  const podeDevolver = reserva?.status === STATUS_RESERVA.EM_ANDAMENTO && Boolean(reserva.codigoUsadoEm);
  const modelo = reserva?.veiculo?.modeloVeiculo;
  const veiculo = [modelo?.marca, modelo?.modelo].filter(Boolean).join(" ") || "Veículo";

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Devolução</h1>
      </header>
      {carregando && id && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando reserva…</p>
      )}
      {!id && (
        <div className="state-block">
          <p className="state-block__text" role="alert">Selecione uma reserva no Histórico para devolver o veículo.</p>
          <button type="button" className="btn" onClick={() => navigate("/historico")}>Ver minhas reservas</button>
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
            <h2 id="devolucao-reserva">Reserva</h2>
            <StatusBadge status={reserva.status} />
          </div>
          <ul className="post-facts">
            <li>Veículo: {veiculo}{reserva.veiculo?.placa ? ` · ${reserva.veiculo.placa}` : ""}</li>
            <li>Data prevista para devolução: <span className="tabular">{formatarDataHora(reserva.dataHoraFim)}</span></li>
            <li>Data/hora real da devolução: {realizada ? <span className="tabular">{formatarDataHora(reserva.devolvidoEm)}</span> : "Será registrada pelo sistema ao confirmar."}</li>
          </ul>
          {realizada && (
            <p className="post-amount" data-testid="cobranca-atraso">
              <span>Cobrança por atraso: </span>
              <strong>{formatMoneyBRL(reserva.cobrancaAtraso ?? 0)}</strong>
            </p>
          )}
          {realizada && (
            <div className="alert alert--success">
              <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
              <p className="alert__body" role="status">Devolução confirmada pelo sistema.</p>
            </div>
          )}
          {!realizada && podeDevolver && <>
            <p className="journey-muted">Se houver atraso, o sistema calculará a cobrança ao registrar a devolução.</p>
            <div className="journey-actions">
              <button type="button" className="btn btn--lg" disabled={enviando} aria-busy={enviando || undefined} onClick={confirmar}>
                {enviando ? "Registrando…" : "Confirmar devolução"}
              </button>
            </div>
          </>}
          {!realizada && !podeDevolver && <p className="journey-muted">Esta reserva não está em andamento ou o veículo ainda não foi desbloqueado.</p>}
          {realizada && (
            <div className="journey-actions">
              <button type="button" className="btn btn--lg" onClick={() => navigate("/avaliacao", { state: { reservaId: reserva.id } })}>Avaliar experiência</button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
