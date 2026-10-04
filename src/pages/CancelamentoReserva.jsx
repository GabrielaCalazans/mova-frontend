import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { cancelarReserva, getPagamentoReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/journey.css";
import "../styles/postcompra.css";

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
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
    document.title = "MOVA - Cancelamento";
    if (!id) return;
    const financeiro = typeof getPagamentoReserva === "function" ? Promise.resolve(getPagamentoReserva(id)) : Promise.resolve(null);
    Promise.all([getReservaById(id), financeiro]).then(([resultado, statusFinanceiro]) => {
      setReserva(resultado);
      setPagamento(statusFinanceiro);
    }).catch((error) => {
      setErro(error?.message || "Não foi possível carregar a reserva.");
    }).finally(() => setCarregando(false));
  }, [id]);

  const cancelavel = reserva?.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO || reserva?.status === STATUS_RESERVA.CONFIRMADA;
  const modelo = reserva?.veiculo?.modeloVeiculo;
  const veiculo = [modelo?.marca, modelo?.modelo].filter(Boolean).join(" ") || "Veículo";

  async function cancelar() {
    if (!cancelavel || enviando) return;
    setEnviando(true); setErro("");
    try {
      const atualizada = await cancelarReserva(reserva.id);
      if (atualizada.status !== STATUS_RESERVA.CANCELADA) throw new Error("O cancelamento não foi confirmado pelo sistema.");
      setReserva(atualizada);
      if (typeof getPagamentoReserva === "function") setPagamento(await getPagamentoReserva(reserva.id));
      setConfirmando(false);
    } catch (error) { setErro(error?.message || "Não foi possível cancelar a reserva."); }
    finally { setEnviando(false); }
  }

  const cancelada = reserva?.status === STATUS_RESERVA.CANCELADA;
  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Cancelar reserva</h1>
      </header>
      {carregando && id && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando reserva…</p>
      )}
      {!id && (
        <div className="state-block">
          <p className="state-block__text" role="alert">Selecione uma reserva no Histórico para cancelar.</p>
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
        <section className="post-panel" aria-labelledby="cancelamento-reserva">
          <div className="post-panel__head">
            <h2 id="cancelamento-reserva">Reserva</h2>
            <StatusBadge status={reserva.status} />
          </div>
          <ul className="post-facts">
            <li>Veículo: {veiculo}</li>
            <li>Retirada prevista: <span className="tabular">{formatarDataHora(reserva.dataHoraInicio)}</span></li>
            <li>Valor da reserva: <span className="tabular">{formatMoneyBRL(reserva.valorTotal)}</span></li>
          </ul>

          {!cancelada && cancelavel && (
            <div className="alert alert--warning">
              <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
              <div className="alert__body">
                <p className="alert__title">Regra de multa</p>
                <p>Até 2 horas antes da retirada, o cancelamento não tem multa. Depois desse prazo, o sistema aplica multa de 20% sobre o valor da reserva; o valor final exibido após o cancelamento é calculado pelo servidor.</p>
              </div>
            </div>
          )}
          {!cancelada && !cancelavel && <p className="journey-muted">Esta reserva não pode ser cancelada porque já está em andamento, foi realizada ou já foi cancelada.</p>}
          {!cancelada && cancelavel && !confirmando && (
            <div className="journey-actions">
              <button type="button" className="btn btn--danger btn--lg" onClick={() => setConfirmando(true)}>Solicitar cancelamento</button>
            </div>
          )}
          {!cancelada && cancelavel && confirmando && (
            <div role="dialog" aria-label="Confirmar cancelamento" className="post-confirm">
              <p>Confirma o cancelamento? A regra é sem multa até 2 horas antes e multa de 20% depois; o servidor calculará o valor final.</p>
              <div className="journey-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setConfirmando(false)} disabled={enviando}>Voltar</button>
                <button type="button" className="btn btn--danger" onClick={cancelar} disabled={enviando} aria-busy={enviando || undefined}>{enviando ? "Cancelando…" : "Confirmar cancelamento"}</button>
              </div>
            </div>
          )}
          {cancelada && (
            <div className="post-result" role="status">
              <p className="alert alert--success">
                <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
                <span className="alert__body">Cancelamento confirmado pelo sistema.</span>
              </p>
              <p className="post-amount" data-testid="multa-cancelamento">
                <span>Multa de cancelamento: </span>
                <strong>{formatMoneyBRL(reserva.multaCancelamento ?? 0)}</strong>
              </p>
              <ul className="post-facts">
                <li>Pagamento e estorno simulados — nenhum dinheiro real movimentado.</li>
                <li>Status do estorno: {pagamento?.statusEstorno || "Aguardando consulta do servidor"}</li>
                <li>Valor elegível ao estorno: {pagamento?.valorElegivelEstorno != null ? <span className="tabular">{formatMoneyBRL(pagamento.valorElegivelEstorno)}</span> : "Aguardando consulta do servidor"}</li>
              </ul>
              <div className="journey-actions">
                <button type="button" className="btn" onClick={() => navigate("/historico")}>Ver minhas reservas</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
