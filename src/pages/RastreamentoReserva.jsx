import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getRastreamentoReserva } from "../services/reservaService";
import "../styles/journey.css";
import "../styles/postcompra.css";

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
    <main className="journey-page">
      <header className="journey-head">
        <h1>Acompanhar veículo</h1>
        <p className="page-head__lede">A posição é atualizada automaticamente enquanto esta tela estiver aberta.</p>
      </header>
      {carregando && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando localização…</p>
      )}
      {erro && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{erro}</p>
        </div>
      )}
      {veiculo && (
        <section aria-label="Rastreamento da reserva" className="post-panel">
          <h2>{veiculo.nome}</h2>
          <ul className="post-facts">
            <li>Placa: <span className="tabular">{veiculo.placa}</span></li>
            {!localizacao && <li>Localização ainda indisponível para este veículo.</li>}
            {localizacao && (
              <>
                <li className="tabular">Localização: {Number(localizacao.latitude).toFixed(5)}, {Number(localizacao.longitude).toFixed(5)}</li>
                <li>Última atualização: <span className="tabular">{formatarDataHora(localizacao.dataHora)}</span></li>
              </>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
