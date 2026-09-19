import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import { getJourneyStep } from "../utils/journeyStorage";
import { STATUS_RESERVA } from "../services/apiEnums";
import { devolverReserva, getReservaById } from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import "../styles/carselect.css";

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
    <AuthenticatedLayout title="Devolução" align="left">
      {carregando && id && <p className="carro-status">Carregando reserva…</p>}
      {!id && <p role="alert">Selecione uma reserva no Histórico para devolver o veículo.</p>}
      {erro && <p className="carro-status" role="alert">{erro}</p>}
      {reserva && <div className="payment-method-card" style={{ textAlign: "left" }}>
        <h2>Reserva</h2>
        <p>Veículo: {veiculo}{reserva.veiculo?.placa ? ` · ${reserva.veiculo.placa}` : ""}</p>
        <p>Data prevista para devolução: {formatarDataHora(reserva.dataHoraFim)}</p>
        <p>Data/hora real da devolução: {realizada ? formatarDataHora(reserva.devolvidoEm) : "Será registrada pelo sistema ao confirmar."}</p>
        <p>Status: {reserva.status}</p>
        {realizada && <p data-testid="cobranca-atraso">Cobrança por atraso: {formatMoneyBRL(reserva.cobrancaAtraso ?? 0)}</p>}
        {realizada && <p role="status">Devolução confirmada pelo sistema.</p>}
        {!realizada && podeDevolver && <>
          <p>Se houver atraso, o sistema calculará a cobrança ao registrar a devolução.</p>
          <button type="button" className="carro-button" disabled={enviando} onClick={confirmar}>
            {enviando ? "Registrando…" : "Confirmar devolução"}
          </button>
        </>}
        {!realizada && !podeDevolver && <p>Esta reserva não está em andamento ou o veículo ainda não foi desbloqueado.</p>}
        {realizada && <button type="button" className="carro-button" onClick={() => navigate("/avaliacao", { state: { reservaId: reserva.id } })}>Avaliar experiência</button>}
      </div>}
    </AuthenticatedLayout>
  );
}
