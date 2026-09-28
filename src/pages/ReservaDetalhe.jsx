import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AuthenticatedLayout from "../layout/AuthenticatedLayout";
import {
  criarCompartilhamentoReserva,
  getReservaById,
  revogarCompartilhamentoReserva,
} from "../services/reservaService";
import {
  STATUS_PAGAMENTO_LABELS,
  STATUS_RESERVA,
  STATUS_RESERVA_LABELS,
  rotulo,
} from "../services/apiEnums";
import { formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import "../styles/reservation-detail.css";

const TIMEZONE_EXIBICAO = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatarDataHora(valor) {
  if (!valor) return "Não informado";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE_EXIBICAO,
  }).format(data);
}

function resolveVeiculoNome(reserva) {
  const modelo = reserva?.veiculo?.modeloVeiculo || reserva?.veiculo || {};
  return [modelo.marca, modelo.modelo].filter(Boolean).join(" ") || "Veículo não informado";
}

function nomeGaragem(garagem, id) {
  return garagem?.nome || id || "Não informada";
}

function copiarLink(link) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(link);

  const area = document.createElement("textarea");
  area.value = link;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copiado = typeof document.execCommand === "function" && document.execCommand("copy");
  area.remove();
  return copiado ? Promise.resolve() : Promise.reject(new Error("Não foi possível copiar o link."));
}

function destinoDaReserva(reserva) {
  if (reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO) {
    return { path: "/pagamento", label: "Pagar reserva" };
  }
  if (reserva.status === STATUS_RESERVA.CONFIRMADA && reserva.statusPagamento === "SUCESSO") {
    return { path: "/desbloqueio", label: "Desbloquear veículo" };
  }
  if (reserva.status === STATUS_RESERVA.EM_ANDAMENTO) {
    return { path: `/reserva/${reserva.id}/localizacao`, label: "Acompanhar viagem" };
  }
  if (reserva.status === STATUS_RESERVA.REALIZADA) {
    return { path: "/avaliacao", label: "Avaliar reserva" };
  }
  return null;
}

export default function ReservaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [compartilhamento, setCompartilhamento] = useState({});

  useEffect(() => {
    document.title = "MOVA - Detalhe da reserva";
    let ativo = true;
    setCarregando(true);
    setErro("");

    if (!id) {
      setErro("Reserva não informada.");
      setCarregando(false);
      return () => { ativo = false; };
    }

    getReservaById(id)
      .then((resultado) => { if (ativo) setReserva(resultado); })
      .catch((error) => { if (ativo) setErro(error?.message || "Não foi possível carregar a reserva."); })
      .finally(() => { if (ativo) setCarregando(false); });

    return () => { ativo = false; };
  }, [id]);

  const destino = useMemo(() => (reserva ? destinoDaReserva(reserva) : null), [reserva]);
  const podeCancelar = reserva?.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO
    || reserva?.status === STATUS_RESERVA.CONFIRMADA;

  function navegarComReserva(path) {
    updateJourneyStep("reserva", {
      id: reserva.id,
      valorTotal: reserva.valorTotal,
      codigoDesbloqueio: reserva.codigoDesbloqueio || "",
    });
    navigate(path, { state: { reservaId: reserva.id } });
  }

  async function compartilhar() {
    setCompartilhamento((atual) => ({ ...atual, carregando: true, erro: "" }));
    try {
      const resultado = await criarCompartilhamentoReserva(reserva.id);
      let mensagem = "Link pronto para compartilhar.";
      let compartilhado = false;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `Viagem MOVA — ${resolveVeiculoNome(reserva)}`,
            text: "Confira os detalhes desta viagem.",
            url: resultado.url,
          });
          compartilhado = true;
          mensagem = "Compartilhamento aberto.";
        } catch {
          // Se a pessoa fechar o compartilhamento nativo, mantém cópia como alternativa.
        }
      }
      if (!compartilhado) {
        await copiarLink(resultado.url);
        mensagem = "Link copiado.";
      }
      setCompartilhamento({ url: resultado.url, mensagem, carregando: false, erro: "" });
    } catch (error) {
      setCompartilhamento((atual) => ({
        ...atual,
        carregando: false,
        erro: error?.message || "Não foi possível compartilhar.",
      }));
    }
  }

  async function revogar() {
    setCompartilhamento((atual) => ({ ...atual, carregando: true, erro: "" }));
    try {
      await revogarCompartilhamentoReserva(reserva.id);
      setCompartilhamento({ mensagem: "Compartilhamento revogado.", carregando: false, erro: "" });
    } catch (error) {
      setCompartilhamento((atual) => ({
        ...atual,
        carregando: false,
        erro: error?.message || "Não foi possível revogar o compartilhamento.",
      }));
    }
  }

  return (
    <AuthenticatedLayout title="Detalhe da reserva" align="left">
      <div className="reservation-detail">
        <button type="button" className="reservation-detail__back" onClick={() => navigate("/historico")}>
          Voltar para histórico
        </button>

        {carregando && <p className="carro-status" role="status">Carregando reserva…</p>}
        {!carregando && erro && <p className="carro-status" role="alert">{erro}</p>}

        {!carregando && !erro && reserva && (
          <>
            <header className="reservation-detail__header">
              <p className="mova-eyebrow">Ficha da reserva</p>
              <h2>{resolveVeiculoNome(reserva)}</h2>
              <p className="reservation-detail__status" role="status">
                {rotulo(STATUS_RESERVA_LABELS, reserva.status)}
              </p>
            </header>

            <dl className="reservation-detail__facts">
              <div><dt>Retirada</dt><dd>{formatarDataHora(reserva.dataHoraInicio)}</dd></div>
              <div><dt>Devolução</dt><dd>{formatarDataHora(reserva.dataHoraFim)}</dd></div>
              <div><dt>Garagem de retirada</dt><dd>{nomeGaragem(reserva.garagemRetirada, reserva.idGaragemRetirada)}</dd></div>
              <div><dt>Garagem de devolução</dt><dd>{nomeGaragem(reserva.garagemDevolucao, reserva.idGaragemDevolucao)}</dd></div>
              <div><dt>Pagamento</dt><dd>{rotulo(STATUS_PAGAMENTO_LABELS, reserva.statusPagamento)}</dd></div>
              <div><dt>Valor total</dt><dd>{reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "Valor não informado"}</dd></div>
            </dl>

            {reserva.servicos?.length > 0 && (
              <section className="reservation-detail__section" aria-labelledby="servicos-title">
                <h3 id="servicos-title">Serviços contratados</h3>
                <ul>
                  {reserva.servicos.map((servico) => (
                    <li key={servico.idServico || servico.id}>
                      <strong>{servico.nome || "Serviço"}</strong> — {formatMoneyBRL(servico.valor)}
                      {servico.descricao && <p>{servico.descricao}</p>}
                      {servico.detalhesCobertura && <details><summary>Ver detalhes da cobertura</summary><p>{servico.detalhesCobertura}</p></details>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {reserva.codigoDesbloqueio && (
              <section className="reservation-detail__section" aria-labelledby="codigo-title">
                <h3 id="codigo-title">Código de desbloqueio</h3>
                <p className="reservation-detail__code">{reserva.codigoDesbloqueio}</p>
                <p>Use o código somente na janela autorizada. O servidor valida reserva, usuário, horário e localização.</p>
              </section>
            )}

            <section className="reservation-detail__actions" aria-label="Ações da reserva">
              {destino && <button type="button" className="reservation-detail__primary" onClick={() => navegarComReserva(destino.path)}>{destino.label}</button>}
              {podeCancelar && <button type="button" onClick={() => navegarComReserva("/cancelamento")}>Cancelar reserva</button>}
              {reserva.status === STATUS_RESERVA.EM_ANDAMENTO && <button type="button" onClick={() => navegarComReserva("/devolucao")}>Devolver veículo</button>}
              {!destino && reserva.status === STATUS_RESERVA.CANCELADA && <p role="status">Esta reserva foi cancelada. Nenhuma ação operacional está disponível.</p>}
            </section>

            <section className="reservation-detail__share" aria-labelledby="share-title">
              <h3 id="share-title">Compartilhar viagem</h3>
              <p>Gere um link estático. O link não libera veículo nem exibe localização ao vivo.</p>
              <button type="button" disabled={compartilhamento.carregando} onClick={() => void compartilhar()}>
                {compartilhamento.carregando ? "Gerando link…" : "Compartilhar viagem"}
              </button>
              {compartilhamento.url && <p><a href={compartilhamento.url} target="_blank" rel="noreferrer">Abrir link compartilhável</a></p>}
              {compartilhamento.url && <div className="reservation-detail__share-actions">
                <button type="button" onClick={() => void copiarLink(compartilhamento.url).then(() => setCompartilhamento((atual) => ({ ...atual, mensagem: "Link copiado.", erro: "" }))).catch((error) => setCompartilhamento((atual) => ({ ...atual, erro: error.message })))}>Copiar link</button>
                <button type="button" onClick={() => void revogar()}>Revogar compartilhamento</button>
              </div>}
              {compartilhamento.mensagem && <p aria-live="polite">{compartilhamento.mensagem}</p>}
              {compartilhamento.erro && <p aria-live="assertive" role="alert">{compartilhamento.erro}</p>}
            </section>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
