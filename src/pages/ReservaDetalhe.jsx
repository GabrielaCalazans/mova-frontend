import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRightFromBracket, faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import {
  criarCompartilhamentoReserva,
  getPagamentoReserva,
  getReservaById,
  revogarCompartilhamentoReserva,
} from "../services/reservaService";
import {
  STATUS_PAGAMENTO_LABELS,
  STATUS_RESERVA,
  rotulo,
} from "../services/apiEnums";
import { formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/postcompra.css";
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
  const [pagamento, setPagamento] = useState(null);
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

    const financeiro = typeof getPagamentoReserva === "function" ? Promise.resolve(getPagamentoReserva(id)) : Promise.resolve(null);
    Promise.all([getReservaById(id), financeiro])
      .then(([resultado, statusFinanceiro]) => { if (ativo) { setReserva(resultado); setPagamento(statusFinanceiro); } })
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

  const voltar = (
    <button type="button" className="btn btn--quiet page-head__back" onClick={() => navigate("/historico")}>
      <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
      Voltar para histórico
    </button>
  );

  if (carregando || erro || !reserva) {
    return (
      <main className="journey-page">
        {voltar}
        <header className="journey-head"><h1>Detalhe da reserva</h1></header>
        {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando reserva…</p>}
        {!carregando && erro && (
          <div className="state-block state-block--error" role="alert">
            <p className="state-block__title">Não foi possível abrir a reserva</p>
            <p className="state-block__text">{erro}</p>
          </div>
        )}
      </main>
    );
  }

  const statusPagamentoAtual = pagamento?.statusPagamento ?? reserva.statusPagamento;

  return (
    <main className="journey-page">
      {voltar}
      <header className="journey-head detail-head">
        <h1>{resolveVeiculoNome(reserva)}</h1>
        <StatusBadge status={reserva.status} role="status" />
      </header>

      <div className="journey-layout detail-layout">
        <div className="journey-layout__main">
          <section className="journey-section" aria-labelledby="detalhe-quando">
            <h2 id="detalhe-quando">Quando e onde</h2>
            <div className="detail-vehicle">
              <VehicleMedia vehicle={reserva.veiculo} className="summary-vehicle__media" />
              <ol className="itinerary">
                <Leg icon={faArrowRightFromBracket} label="Retirada" garagem={reserva.garagemRetirada} id={reserva.idGaragemRetirada} quando={reserva.dataHoraInicio} />
                <Leg icon={faArrowRightToBracket} label="Devolução" garagem={reserva.garagemDevolucao} id={reserva.idGaragemDevolucao} quando={reserva.dataHoraFim} />
              </ol>
            </div>
          </section>

          {reserva.servicos?.length > 0 && (
            <section className="journey-section" aria-labelledby="servicos-title">
              <h2 id="servicos-title">Serviços contratados</h2>
              <ul className="line-list">
                {reserva.servicos.map((servico) => (
                  <li key={servico.idServico || servico.id} className="line-list__item">
                    <div>
                      <strong>{servico.nome || "Serviço"}</strong>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>Ver detalhes da cobertura</summary>
                          <p>{servico.detalhesCobertura}</p>
                        </details>
                      )}
                    </div>
                    <span className="tabular">{formatMoneyBRL(servico.valor)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reserva.codigoDesbloqueio && (
            <section className="journey-section" aria-labelledby="codigo-title">
              <h2 id="codigo-title">Código de desbloqueio</h2>
              <strong className="unlock-code">{reserva.codigoDesbloqueio}</strong>
              <p className="journey-muted">Use o código somente na janela autorizada. O servidor valida reserva, usuário, horário e localização.</p>
            </section>
          )}

          <section className="journey-section" aria-labelledby="share-title">
            <h2 id="share-title">Compartilhar viagem</h2>
            <p className="journey-muted">Gere um link estático. O link não libera veículo nem exibe localização ao vivo.</p>
            <div className="journey-actions detail-share">
              <button type="button" className="btn btn--secondary" disabled={compartilhamento.carregando} aria-busy={compartilhamento.carregando || undefined} onClick={() => void compartilhar()}>
                {compartilhamento.carregando ? "Gerando link…" : "Compartilhar viagem"}
              </button>
              {compartilhamento.url && <>
                <button type="button" className="btn btn--quiet" onClick={() => void copiarLink(compartilhamento.url).then(() => setCompartilhamento((atual) => ({ ...atual, mensagem: "Link copiado.", erro: "" }))).catch((error) => setCompartilhamento((atual) => ({ ...atual, erro: error.message })))}>Copiar link</button>
                <button type="button" className="btn btn--quiet" onClick={() => void revogar()}>Revogar compartilhamento</button>
              </>}
            </div>
            {compartilhamento.url && <p><a href={compartilhamento.url} target="_blank" rel="noreferrer">Abrir link compartilhável</a></p>}
            {compartilhamento.mensagem && <p className="journey-muted" aria-live="polite">{compartilhamento.mensagem}</p>}
            {compartilhamento.erro && <p className="alert alert--danger" aria-live="assertive" role="alert">{compartilhamento.erro}</p>}
          </section>
        </div>

        <aside className="journey-layout__aside detail-aside">
          <section className="price-summary" aria-labelledby="financeiro-title">
            <h2 id="financeiro-title">Resumo financeiro</h2>
            <dl className="price-summary__rows">
              <div><dt>Pagamento</dt><dd>{rotulo(STATUS_PAGAMENTO_LABELS, statusPagamentoAtual) || "Não informado"}</dd></div>
              {pagamento?.statusEstorno && <>
                <div><dt>Valor pago</dt><dd className="tabular">{formatMoneyBRL(pagamento.valorPago)}</dd></div>
                <div><dt>Status do estorno</dt><dd>{pagamento.statusEstorno}</dd></div>
                <div><dt>Elegível ao estorno</dt><dd className="tabular">{formatMoneyBRL(pagamento.valorElegivelEstorno)}</dd></div>
              </>}
            </dl>
            <div className="price-summary__total">
              <span>Total</span>
              <strong className="tabular">{reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "Valor não informado"}</strong>
            </div>
            {pagamento?.aviso && <p className="price-summary__note">{pagamento.aviso}</p>}

            <div className="detail-actions" aria-label="Ações da reserva" role="group">
              {destino && <button type="button" className="btn btn--lg btn--block" onClick={() => navegarComReserva(destino.path)}>{destino.label}</button>}
              {reserva.status === STATUS_RESERVA.EM_ANDAMENTO && <button type="button" className="btn btn--secondary btn--block" onClick={() => navegarComReserva("/devolucao")}>Devolver veículo</button>}
              {podeCancelar && <button type="button" className="btn btn--danger btn--block" onClick={() => navegarComReserva("/cancelamento")}>Cancelar reserva</button>}
              {!destino && reserva.status === STATUS_RESERVA.CANCELADA && <p className="journey-muted" role="status">Esta reserva foi cancelada. Nenhuma ação operacional está disponível.</p>}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Leg({ icon, label, garagem, id, quando }) {
  return (
    <li className="itinerary__leg">
      <span className="itinerary__icon"><FontAwesomeIcon icon={icon} aria-hidden="true" /></span>
      <div>
        <p className="itinerary__label">{label}</p>
        <p className="itinerary__garage">{nomeGaragem(garagem, id)}</p>
        {garagem?.endereco ? <p className="itinerary__address">{garagem.endereco}</p> : null}
        <p className="itinerary__when"><span className="tabular">{formatarDataHora(quando)}</span></p>
      </div>
    </li>
  );
}
