import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getRastreamentoReserva } from "../services/reservaService";
import "../styles/carselect.css";

export const INTERVALO_RASTREAMENTO_MS = 15_000;

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Não informado" : data.toLocaleString("pt-BR");
}

export default function RastreamentoReserva() {
  const { id } = useParams();
  const [rastreamento, setRastreamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    let emAndamento = false;
    let interrompido = false;

    const atualizar = async () => {
      if (emAndamento || interrompido) return;
      emAndamento = true;
      try {
        const dados = await getRastreamentoReserva(id);
        if (!ativo) return;
        setRastreamento(dados);
        setErro("");
      } catch (error) {
        if (!ativo) return;
        setErro(error?.message || "Não foi possível atualizar localização.");
        if (error?.status === 409) interrompido = true;
      } finally {
        emAndamento = false;
        if (ativo) setCarregando(false);
      }
    };

    atualizar();
    const timer = setInterval(atualizar, INTERVALO_RASTREAMENTO_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [id]);

  const veiculo = rastreamento?.veiculo;
  const localizacao = rastreamento?.localizacao;

  return (
    <main className="carro-page">
      <div className="carro-header"><h1>Acompanhar veículo</h1></div>
      <div className="carro-content" style={{ textAlign: "left" }}>
        {carregando && <p className="carro-status">Carregando localização…</p>}
        {erro && <p className="carro-status" role="alert">{erro}</p>}
        {veiculo && (
          <section aria-label="Rastreamento da reserva" className="payment-method-card">
            <h2>{veiculo.nome}</h2>
            <p>Placa: {veiculo.placa}</p>
            {!localizacao && <p>Localização ainda indisponível para este veículo.</p>}
            {localizacao && (
              <>
                <p>Localização: {Number(localizacao.latitude).toFixed(5)}, {Number(localizacao.longitude).toFixed(5)}</p>
                <p>Última atualização: {formatarDataHora(localizacao.dataHora)}</p>
              </>
            )}
          </section>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
