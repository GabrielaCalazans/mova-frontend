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
import { formatDate, t } from "../i18n";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/postcompra.css";

// Tom e rótulo do status da reserva: sempre texto, nunca só cor.
// PENDENTE/FINALIZADA são grafias antigas que ainda aparecem em dados legados.
// Rótulos resolvidos no render (não no import) para acompanhar o idioma.
const STATUS_VISUAL = {
  [STATUS_RESERVA.AGUARDANDO_PAGAMENTO]: ["warning", () => t("reservation.list.paymentPending")],
  PENDENTE: ["warning", () => t("reservation.list.paymentPending")],
  [STATUS_RESERVA.CONFIRMADA]: ["success", STATUS_RESERVA.CONFIRMADA],
  [STATUS_RESERVA.EM_ANDAMENTO]: ["info", STATUS_RESERVA.EM_ANDAMENTO],
  [STATUS_RESERVA.REALIZADA]: ["neutral", STATUS_RESERVA.REALIZADA],
  FINALIZADA: ["neutral", STATUS_RESERVA.REALIZADA],
  [STATUS_RESERVA.CANCELADA]: ["danger", STATUS_RESERVA.CANCELADA],
};

export function StatusBadge({ status, ...props }) {
  const [tom, rotuloOuCodigo] = STATUS_VISUAL[status] ?? ["neutral", status];
  const texto = typeof rotuloOuCodigo === "function"
    ? rotuloOuCodigo()
    : rotulo(STATUS_RESERVA_LABELS, rotuloOuCodigo) || t("reservation.list.statusMissing");
  return <span className={`badge badge--${tom}`} {...props}>{texto}</span>;
}

// A resposta da reserva agora traz o veículo aninhado (veiculo.modeloVeiculo),
// no mesmo formato de GET /api/veiculo/:id.
function resolveVeiculoNome(reserva) {
  const modeloVeiculo = reserva.veiculo?.modeloVeiculo ?? {};
  const marca = modeloVeiculo.marca ?? "";
  const modelo = modeloVeiculo.modelo ?? "";
  const nome = `${marca} ${modelo}`.trim();

  return nome || t("reservation.common.vehicle");
}

function formatarDataHora(valor) {
  return formatDate(valor, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo",
  }) || t("payment.dateMissing");
}

function nomeGaragem(garagem, fallback) {
  return garagem?.nome || fallback || t("reservation.detail.garageMissing");
}

// Reserva paga e ainda nao desbloqueada leva para o desbloqueio; as demais,
// para a avaliacao. O id vai no state — a tela de destino confirma o estado
// real com o backend.
function acaoDaReserva(reserva) {
  if (reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO) {
    return { rota: "/pagamento", rotulo: t("payment.pay") };
  }
  if (reserva.status === STATUS_RESERVA.CONFIRMADA && reserva.statusPagamento === STATUS_PAGAMENTO.SUCESSO) {
    return { rota: "/desbloqueio", rotulo: t("reservation.unlock.submit") };
  }
  if (reserva.status === STATUS_RESERVA.EM_ANDAMENTO) {
    return { rota: "/devolucao", rotulo: t("reservation.detail.actions.return") };
  }
  if (reserva.status === STATUS_RESERVA.REALIZADA) {
    return { rota: "/avaliacao", rotulo: t("reservation.list.rate") };
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
  if (!copiado) throw new Error(t("reservation.share.copyError"));
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
        setErro(error.message || t("reservation.list.loadError"));
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

  const erroExibido = !idLocatario ? t("reservation.common.invalidSession") : erro;

  const compartilhar = async (reserva) => {
    setCompartilhamentos((atual) => ({
      ...atual,
      [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: true, erro: null },
    }));
    try {
      const resultado = await criarCompartilhamentoReserva(reserva.id);
      let mensagem = t("reservation.share.ready");
      let nativoConcluido = false;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: t("reservation.share.nativeTitle", { vehicle: resolveVeiculoNome(reserva) }),
            text: t("reservation.share.nativeText"),
            url: resultado.url,
          });
          nativoConcluido = true;
          mensagem = t("reservation.share.opened");
        } catch {
          // Cancelamento/indisponibilidade do share nativo segue para cópia.
        }
      }
      if (!nativoConcluido) {
        await copiarLink(resultado.url);
        mensagem = t("reservation.share.copied");
      }
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { url: resultado.url, loading: false, mensagem, erro: null },
      }));
    } catch (error) {
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: false, erro: error.message || t("reservation.share.error") },
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
        [reserva.id]: { loading: false, mensagem: t("reservation.share.revoked"), erro: null },
      }));
    } catch (error) {
      setCompartilhamentos((atual) => ({
        ...atual,
        [reserva.id]: { ...(atual[reserva.id] ?? {}), loading: false, erro: error.message || t("reservation.list.revokeError") },
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
              <dt>{t("payment.summary.pickup")}</dt>
              <dd>
                <span className="tabular">{formatarDataHora(reserva.dataHoraInicio)}</span>
                <span className="booking__garage">{nomeGaragem(reserva.garagemRetirada, reserva.idGaragemRetirada)}</span>
              </dd>
            </div>
            <div>
              <dt>{t("payment.summary.return")}</dt>
              <dd>
                <span className="tabular">{formatarDataHora(reserva.dataHoraFim)}</span>
                <span className="booking__garage">{nomeGaragem(reserva.garagemDevolucao, reserva.idGaragemDevolucao)}</span>
              </dd>
            </div>
            <div>
              <dt>{t("payment.summary.payment")}</dt>
              <dd>{rotulo(STATUS_PAGAMENTO_LABELS, reserva.statusPagamento) || t("reservation.tracking.notProvided")}</dd>
            </div>
          </dl>

          {reserva.servicos?.length > 0 && (
            <div className="booking__services" aria-label={t("reservation.detail.services")}>
              <p className="journey-muted">{t("reservation.detail.services")}</p>
              <ul className="line-list">
                {reserva.servicos.map((servico) => (
                  <li key={servico.idServico} className="line-list__item">
                    <div>
                      <span>{servico.nome} — {formatMoneyBRL(servico.valor)}</span>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>{t("reservation.detail.coverageDetails")}</summary>
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
            <span>{t("payment.summary.total")}</span>
            <strong className="tabular">
              {reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : t("reservation.detail.amountMissing")}
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
                {t("reservation.tracking.title")}
              </button>
            )}
            <button type="button" className="btn btn--secondary" onClick={abrirDetalhe}>{t("reservation.list.viewDetails")}</button>
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
              {compartilhamento.loading ? t("reservation.share.generating") : t("reservation.share.title")}
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
                {t("reservation.cancel.title")}
              </button>
            )}
          </div>

          {(compartilhamento.url || compartilhamento.mensagem || compartilhamento.erro) && (
            <div className="booking__share" aria-label={t("reservation.list.shareRegion")}>
              {compartilhamento.url && (
                <>
                  <a
                    href={compartilhamento.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("reservation.list.tripLink")}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {t("reservation.list.tripLink")}
                  </a>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={(event) => {
                      event.stopPropagation();
                      void copiarLink(compartilhamento.url)
                        .then(() => setCompartilhamentos((atual) => ({
                          ...atual,
                          [reserva.id]: { ...atual[reserva.id], mensagem: t("reservation.share.copied") },
                        })))
                        .catch((error) => setCompartilhamentos((atual) => ({
                          ...atual,
                          [reserva.id]: { ...atual[reserva.id], erro: error.message },
                        })));
                    }}
                  >
                    {t("reservation.share.copy")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={(event) => {
                      event.stopPropagation();
                      void revogar(reserva);
                    }}
                  >
                    {t("reservation.share.revoke")}
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
          {t("reservation.list.loading")}
        </p>
      )}

      {!loading && erroExibido && (
        <div className="state-block state-block--error" role="alert">
          <p className="state-block__title">{t("reservation.list.errorTitle")}</p>
          <p className="state-block__text">{erroExibido}</p>
        </div>
      )}

      {!loading && !erroExibido && reservasExibidas.length === 0 && (
        <div className="state-block">
          <p className="state-block__title">{t("reservation.list.emptyTitle")}</p>
          <p className="state-block__text">{emptyMessage}</p>
          <button type="button" className="btn" onClick={() => navigate("/carros")}>
            {t("reservation.list.browseCars")}
          </button>
        </div>
      )}

      {!loading && !erroExibido && reservasExibidas.length > 0 && (
        <ul className="booking-list">{reservasExibidas.map(renderReserva)}</ul>
      )}

      {!loading && !erroExibido && paginacao.totalPages > 1 && (
        <nav className="booking-pager" aria-label={t("reservation.list.pagination")}>
          <button type="button" className="btn btn--secondary" disabled={pagina <= 1} onClick={() => setPagina((atual) => atual - 1)}>
            {t("reservation.list.previous")}
          </button>
          <span className="tabular">{t("reservation.list.page", { page: paginacao.page, totalPages: paginacao.totalPages, total: paginacao.total })}</span>
          <button type="button" className="btn btn--secondary" disabled={pagina >= paginacao.totalPages} onClick={() => setPagina((atual) => atual + 1)}>
            {t("reservation.list.next")}
          </button>
        </nav>
      )}
    </main>
  );
}
