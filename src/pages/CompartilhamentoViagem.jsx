import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCompartilhamentoPublico } from "../services/compartilhamentoService";
import "../styles/journey.css";
import "../styles/postcompra.css";

const STATUS_LABELS = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  CONFIRMADA: "Confirmada",
  EM_ANDAMENTO: "Em andamento",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
};

function formatarDataHora(valor) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Não informado" : data.toLocaleString("pt-BR");
}

function localLabel(local) {
  return local ? `${local.nome} — ${local.endereco}` : "Não informado";
}

export default function CompartilhamentoViagem() {
  const { token } = useParams();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (ativo) setCarregando(true);
    });
    getCompartilhamentoPublico(token)
      .then((resultado) => {
        if (!ativo) return;
        setDados(resultado);
        setErro("");
      })
      .catch((error) => {
        if (!ativo) return;
        setErro(error?.message || "Compartilhamento não encontrado.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>Viagem compartilhada</h1>
      </header>
      {carregando && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando viagem…</p>
      )}
      {!carregando && erro && (
        <div className="state-block state-block--error">
          <p className="state-block__text" role="alert">{erro}</p>
        </div>
      )}
      {!carregando && !erro && dados && (
        <section className="post-panel" aria-label="Detalhes públicos da viagem">
          <h2>{dados.veiculo?.marca} {dados.veiculo?.modelo}</h2>
          <ul className="post-facts">
            <li>Status: {STATUS_LABELS[dados.viagem?.status] ?? dados.viagem?.status ?? "Não informado"}</li>
            <li>Retirada: {localLabel(dados.retirada)}</li>
            <li>Devolução: {localLabel(dados.devolucao)}</li>
            <li>Início: <span className="tabular">{formatarDataHora(dados.viagem?.dataHoraInicio)}</span></li>
            <li>Fim: <span className="tabular">{formatarDataHora(dados.viagem?.dataHoraFim)}</span></li>
          </ul>
        </section>
      )}
    </main>
  );
}
