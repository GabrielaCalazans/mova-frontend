import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { cancelarReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "—" : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function CancelamentoReserva() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.reservaId || getJourneyStep("reserva")?.id;
  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.title = "MOVA - Cancelamento";
    if (!id) return;
    getReservaById(id).then(setReserva).catch((error) => {
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
      setConfirmando(false);
    } catch (error) { setErro(error?.message || "Não foi possível cancelar a reserva."); }
    finally { setEnviando(false); }
  }

  const cancelada = reserva?.status === STATUS_RESERVA.CANCELADA;
  return <AuthenticatedLayout title="Cancelar reserva" align="left">
    {carregando && id && <p className="carro-status">Carregando reserva…</p>}
    {!id && <p role="alert">Selecione uma reserva no Histórico para cancelar.</p>}
    {erro && <p role="alert" className="carro-status">{erro}</p>}
    {reserva && <div className="payment-method-card" style={{ textAlign: "left" }}>
      <h2>Reserva</h2>
      <p>Veículo: {veiculo}</p>
      <p>Retirada prevista: {formatarDataHora(reserva.dataHoraInicio)}</p>
      <p>Valor da reserva: {formatMoneyBRL(reserva.valorTotal)}</p>
      <p>Status: {reserva.status}</p>
      {!cancelada && cancelavel && <p>O sistema verificará o prazo e aplicará, se houver, a multa de cancelamento.</p>}
      {!cancelada && !cancelavel && <p>Esta reserva não pode ser cancelada porque já está em andamento, foi realizada ou já foi cancelada.</p>}
      {!cancelada && cancelavel && !confirmando && <button type="button" className="carro-button" onClick={() => setConfirmando(true)}>Solicitar cancelamento</button>}
      {!cancelada && cancelavel && confirmando && <div role="dialog" aria-label="Confirmar cancelamento" className="payment-method-card">
        <p>Confirma o cancelamento desta reserva? O impacto financeiro será informado pelo sistema.</p>
        <button type="button" onClick={() => setConfirmando(false)} disabled={enviando}>Voltar</button>
        <button type="button" className="carro-button" onClick={cancelar} disabled={enviando}>{enviando ? "Cancelando…" : "Confirmar cancelamento"}</button>
      </div>}
      {cancelada && <div role="status">
        <p>Cancelamento confirmado pelo sistema.</p>
        <p data-testid="multa-cancelamento">Multa de cancelamento: {formatMoneyBRL(reserva.multaCancelamento ?? 0)}</p>
        <p>Reembolso: não informado pelo backend.</p>
        <button type="button" className="carro-button" onClick={() => navigate("/historico")}>Ver minhas reservas</button>
      </div>}
    </div>}
  </AuthenticatedLayout>;
}
