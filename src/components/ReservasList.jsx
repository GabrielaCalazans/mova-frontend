import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import VehicleMedia from "./vehicle/VehicleMedia";
import { getAuthSession } from "../services/authSession";
import {
  criarCompartilhamentoReserva,
  getReservasDoLocatarioPage,
  revogarCompartilhamentoReserva,
} from "../services/reservaService";
import { formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import {
  STATUS_PAGAMENTO,
  STATUS_PAGAMENTO_LABELS,
  STATUS_RESERVA,
  STATUS_RESERVA_LABELS,
  rotulo,
} from "../services/apiEnums";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/postcompra.css";

// Tom e rótulo do status da reserva: sempre texto, nunca só cor.
// PENDENTE/FINALIZADA são grafias antigas que ainda aparecem em dados legados.
const STATUS_VISUAL = {
  [STATUS_RESERVA.AGUARDANDO_PAGAMENTO]: ["warning", "Pagamento pendente"],
  PENDENTE: ["warning", "Pagamento pendente"],
  [STATUS_RESERVA.CONFIRMADA]: ["success", STATUS_RESERVA_LABELS.CONFIRMADA],
  [STATUS_RESERVA.EM_ANDAMENTO]: ["info", STATUS_RESERVA_LABELS.EM_ANDAMENTO],
  [STATUS_RESERVA.REALIZADA]: ["neutral", STATUS_RESERVA_LABELS.REALIZADA],
  FINALIZADA: ["neutral", STATUS_RESERVA_LABELS.REALIZADA],
  [STATUS_RESERVA.CANCELADA]: ["danger", STATUS_RESERVA_LABELS.CANCELADA],
};

export function StatusBadge({ status, ...props }) {
  const [tom, texto] = STATUS_VISUAL[status] ?? ["neutral", rotulo(STATUS_RESERVA_LABELS, status) || "Status não informado"];
  return <span className={`badge badge--${tom}`} {...props}>{texto}</span>;
}

// A resposta da reserva agora traz o veículo aninhado (veiculo.modeloVeiculo),
// no mesmo formato de GET /api/veiculo/:id.
function resolveVeiculoNome(reserva) {
  const modeloVeiculo = reserva.veiculo?.modeloVeiculo ?? {};
  const marca = modeloVeiculo.marca ?? "";
  const modelo = modeloVeiculo.modelo ?? "";
  const nome = `${marca} ${modelo}`.trim();

  return nome || "Veículo";
}

function formatarDataHora(valor) {
  if (!valor) return "Data não informada";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo",
  }).format(data);
}

function nomeGaragem(garagem, fallback) {
  return garagem?.nome || fallback || "Não informada";
}

// Reserva paga e ainda nao desbloqueada leva para o desbloqueio; as demais,
// para a avaliacao. O id vai no state — a tela de destino confirma o estado
// real com o backend.
function acaoDaReserva(reserva) {
  if (reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO) {
    return { rota: "/pagamento", rotulo: "Pagar" };
  }
  if (reserva.status === STATUS_RESERVA.CONFIRMADA && reserva.statusPagamento === STATUS_PAGAMENTO.SUCESSO) {
    return { rota: "/desbloqueio", rotulo: "Desbloquear veículo" };
  }
  if (reserva.status === STATUS_RESERVA.EM_ANDAMENTO) {
    return { rota: "/devolucao", rotulo: "Devolver veículo" };
  }
  if (reserva.status === STATUS_RESERVA.REALIZADA) {
    return { rota: "/avaliacao", rotulo: "Avaliar" };
  }
  return null;
}

// Conveniência visual. O backend continua validando posse, estado e período
// ao atender GET /reserva/:id/localizacao.
function podeExibirRastreamento(reserva, agora = new Date()) {
  if (
    reserva.status !== STATUS_RESERVA.CONFIRMADA &&
    reserva.status !== STATUS_RESERVA.EM_ANDAMENTO
  ) return false;

  const inicio = new Date(reserva.dataHoraInicio).getTime();
  const fim = new Date(reserva.dataHoraFim).getTime();
  const instante = agora.getTime();
  return Number.isFinite(inicio) && Number.isFinite(fim) && inicio <= instante && instante <= fim;
}

async function copiarLink(link) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
    return;
  }

  const area = document.createElement("textarea");
  area.value = link;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copiado = typeof document.execCommand === "function" && document.execCommand("copy");
  area.remove();
  if (!copiado) throw new Error("Não foi possível copiar o link.");
}

/**
 * Lista de reservas do locatario, da mais recente para a mais antiga. Usada
 * tanto pelo "Historico" (todas as reservas) quanto por "Corridas Realizadas"
 * (somente as com status REALIZADA), via a prop somenteConcluidas.
 */
export default function ReservasList({ title, documentTitle, somenteConcluidas = false, emptyMessage }) {
  const navigate = useNavigate();
  const idLocatario = getAuthSession()?.user?.id;

  const [reservas, setReservas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginacao, setPaginacao] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(() => Boolean(idLocatario));
  const [erro, setErro] = useState(null);
  const [compartilhamentos, setCompartilhamentos] = useState({});

  useEffect(() => {
    document.title = documentTitle;

    if (!idLocatario) return;

    let active = true;

    getReservasDoLocatarioPage(idLocatario, { page: pagina })
      .then((resultado) => {
        if (!active) return;
        const ordenadas = [...resultado.reservas].sort(
          (a, b) => new Date(b.dataHoraInicio) - new Date(a.dataHoraInicio)
        );
        setReservas(ordenadas);
        setPaginacao(resultado.pagination);
      })
      .catch((error) => {
        if (!active) return;
        setErro(error.message || "Não foi possível carregar suas reservas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idLocatario, documentTitle, pagina]);

  const reservasExibidas = useMemo(
    () =>
      somenteConcluidas
        ? reservas.filter((r) => r.status === STATUS_RESERVA.REALIZADA)
        : reservas,
    [reservas, somenteConcluidas]
  );

  const erroExibido = !idLocatario ? "Sessão inválida. Faça login novamente." : erro;

  const compartilhar = async (reserva) => {
    setCompartilhamentos((atual) => ({
      ...atual,
      [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: true, erro: null },
    }));
    try {
      const resultado = await criarCompartilhamentoReserva(reserva.id);
      let mensagem = "Link pronto para compartilhar.";
      let nativoConcluido = false;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `Viagem MOVA — ${resolveVeiculoNome(reserva)}`,
            text: "Confira os detalhes desta viagem.",
            url: resultado.url,
          });
          nativoConcluido = true;
          mensagem = "Compartilhamento aberto.";
        } catch {
          // Cancelamento/indisponibilidade do share nativo segue para cópia.
        }
      }
      if (!nativoConcluido) {
        await copiarLink(resultado.url);
        mensagem = "Link copiado.";
      }
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { url: resultado.url, loading: false, mensagem, erro: null },
      }));
    } catch (error) {
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: false, erro: error.message || "Não foi possível compartilhar." },
      }));
    }
  };

  const revogar = async (reserva) => {
    setCompartilhamentos((atual) => ({
      ...atual,
      [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: true, erro: null },
    }));
    try {
      await revogarCompartilhamentoReserva(reserva.id);
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { loading: false, mensagem: "Compartilhamento revogado.", erro: null },
      }));
    } catch (error) {
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: false, erro: error.message || "Não foi possível revogar." },
      }));
    }
  };

  function renderReserva(reserva) {
    const acao = acaoDaReserva(reserva);
    const compartilhamento = compartilhamentos[reserva.id] ?? {};
    const prepararReserva = () => {
      updateJourneyStep("reserva", {
        id: reserva.id,
        valorTotal: reserva.valorTotal,
        codigoDesbloqueio: reserva.codigoDesbloqueio || "",
      });
    };
    const abrirDetalhe = () => {
      prepararReserva();
      navigate(`/reservas/${reserva.id}`, { state: { reservaId: reserva.id } });
    };
    const abrirAcao = () => {
      if (!acao) return;
      prepararReserva();
      navigate(acao.rota, { state: { reservaId: reserva.id } });
    };
    const nome = resolveVeiculoNome(reserva);

    return (
      <li className="booking" key={reserva.id}>
        <VehicleMedia vehicle={reserva.veiculo} className="booking__media" />

        <div className="booking__body">
          <div className="booking__top">
            <h2 className="booking__name">{nome}</h2>
            <StatusBadge status={reserva.status} />
          </div>

          <dl className="booking__facts">
            <div>
              <dt>Retirada</dt>
              <dd>
                <span className="tabular">{formatarDataHora(reserva.dataHoraInicio)}</span>
                <span className="booking__garage">{nomeGaragem(reserva.garagemRetirada, reserva.idGaragemRetirada)}</span>
              </dd>
            </div>
            <div>
              <dt>Devolução</dt>
              <dd>
                <span className="tabular">{formatarDataHora(reserva.dataHoraFim)}</span>
                <span className="booking__garage">{nomeGaragem(reserva.garagemDevolucao, reserva.idGaragemDevolucao)}</span>
              </dd>
            </div>
            <div>
              <dt>Pagamento</dt>
              <dd>{rotulo(STATUS_PAGAMENTO_LABELS, reserva.statusPagamento) || "Não informado"}</dd>
            </div>
          </dl>

          {reserva.servicos?.length > 0 && (
            <div className="booking__services" aria-label="Serviços contratados">
              <p className="journey-muted">Serviços contratados</p>
              <ul className="line-list">
                {reserva.servicos.map((servico) => (
                  <li key={servico.idServico} className="line-list__item">
                    <div>
                      <span>{servico.nome} — {formatMoneyBRL(servico.valor)}</span>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>Ver detalhes da cobertura</summary>
                          <p>{servico.detalhesCobertura}</p>
                        </details>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="booking__total">
            <span>Total</span>
            <strong className="tabular">
              {reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : "Valor não informado"}
            </strong>
          </div>

          <div className="booking__actions">
            {acao && (
              <button type="button" className="btn" onClick={abrirAcao}>
                {acao.rotulo}
              </button>
            )}
            {podeExibirRastreamento(reserva) && (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/reserva/${reserva.id}/localizacao`);
                }}
              >
                Acompanhar veículo
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={abrirDetalhe}>Ver detalhes da reserva</button>
            <button
              type="button"
              className="btn btn--quiet"
              disabled={compartilhamento.loading}
              aria-busy={compartilhamento.loading || undefined}
              onClick={(event) => {
                event.stopPropagation();
                void compartilhar(reserva);
              }}
            >
              {compartilhamento.loading ? "Gerando link…" : "Compartilhar viagem"}
            </button>
            {(reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO || reserva.status === STATUS_RESERVA.CONFIRMADA) && (
              <button
                type="button"
                className="btn btn--quiet booking__cancel"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate("/cancelamento", { state: { reservaId: reserva.id } });
                }}
              >
                Cancelar reserva
              </button>
            )}
          </div>

          {(compartilhamento.url || compartilhamento.mensagem || compartilhamento.erro) && (
            <div className="booking__share" aria-label="Compartilhamento da viagem">
              {compartilhamento.url && (
                <>
                  <a
                    href={compartilhamento.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Link da viagem"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Link da viagem
                  </a>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={(event) => {
                      event.stopPropagation();
                      void copiarLink(compartilhamento.url)
                        .then(() => setCompartilhamentos((atual) => ({
                          ...atual,
                          [reserva.id]: { ...atual[reserva.id], mensagem: "Link copiado." },
                        })))
                        .catch((error) => setCompartilhamentos((atual) => ({
                          ...atual,
                          [reserva.id]: { ...atual[reserva.id], erro: error.message },
                        })));
                    }}
                  >
                    Copiar link
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={(event) => {
                      event.stopPropagation();
                      void revogar(reserva);
                    }}
                  >
                    Revogar compartilhamento
                  </button>
                </>
              )}
              {compartilhamento.mensagem && <p className="journey-muted" aria-live="polite">{compartilhamento.mensagem}</p>}
              {compartilhamento.erro && <p className="booking__error" aria-live="assertive">{compartilhamento.erro}</p>}
            </div>
          )}
        </div>
      </li>
    );
  }

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{title}</h1>
      </header>

      {loading && (
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          Carregando…
        </p>
      )}

      {!loading && erroExibido && (
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">Não foi possível carregar as reservas</p>
          <p className="state-block__text">{erroExibido}</p>
        </div>
      )}

      {!loading && !erroExibido && reservasExibidas.length === 0 && (
        <div className="state-block">
          <p className="state-block__title">Nenhuma reserva por aqui</p>
          <p className="state-block__text">{emptyMessage}</p>
          <button type="button" className="btn" onClick={() => navigate("/carros")}>
            Ver carros disponíveis
          </button>
        </div>
      )}

      {!loading && !erroExibido && reservasExibidas.length > 0 && (
        <ul className="booking-list">{reservasExibidas.map(renderReserva)}</ul>
      )}

      {!loading && !erroExibido && paginacao.totalPages > 1 && (
        <nav className="booking-pager" aria-label="Paginação das reservas">
          <button type="button" className="btn btn--secondary" disabled={pagina <= 1} onClick={() => setPagina((atual) => atual - 1)}>
            Anterior
          </button>
          <span className="tabular">Página {paginacao.page} de {paginacao.totalPages} ({paginacao.total})</span>
          <button type="button" className="btn btn--secondary" disabled={pagina >= paginacao.totalPages} onClick={() => setPagina((atual) => atual + 1)}>
            Próxima
          </button>
        </nav>
      )}
    </main>
  );
}
