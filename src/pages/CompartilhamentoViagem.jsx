import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCompartilhamentoPublico } from "../services/compartilhamentoService";
import "../styles/carselect.css";

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
    setCarregando(true);
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
    <main className="carro-page">
      <div className="carro-header"><h1>Viagem compartilhada</h1></div>
      <div className="carro-content" style={{ textAlign: "left" }}>
        {carregando && <p className="carro-status">Carregando viagem…</p>}
        {!carregando && erro && <p className="carro-status" role="alert">{erro}</p>}
        {!carregando && !erro && dados && (
          <section className="payment-method-card" aria-label="Detalhes públicos da viagem">
            <h2>{dados.veiculo?.marca} {dados.veiculo?.modelo}</h2>
            <p>Status: {STATUS_LABELS[dados.viagem?.status] ?? dados.viagem?.status ?? "Não informado"}</p>
            <p>Retirada: {localLabel(dados.retirada)}</p>
            <p>Devolução: {localLabel(dados.devolucao)}</p>
            <p>Início: {formatarDataHora(dados.viagem?.dataHoraInicio)}</p>
            <p>Fim: {formatarDataHora(dados.viagem?.dataHoraFim)}</p>
          </section>
        )}
      </div>
    </main>
  );
}
