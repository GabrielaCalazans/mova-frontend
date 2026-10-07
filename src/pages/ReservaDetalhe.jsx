import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import QRCode from "qrcode";
import { faArrowLeft, faArrowRightFromBracket, faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { StatusBadge } from "../components/ReservasList";
import VehicleMedia from "../components/vehicle/VehicleMedia";
import {
  criarCompartilhamentoReserva,
  getPagamentoReserva,
  getQrDesbloqueio,
  getReservaById,
  revogarCompartilhamentoReserva,
} from "../services/reservaService";
import {
  STATUS_ESTORNO_LABELS,
  STATUS_PAGAMENTO_LABELS,
  STATUS_RESERVA,
  rotulo,
  PRAZO_PAGAMENTO_MINUTOS,
} from "../services/apiEnums";
import { contarDiarias, formatMoneyBRL } from "../utils/reservationMath";
import { updateJourneyStep } from "../utils/journeyStorage";
import { formatDate, t } from "../i18n";
import "../styles/vehicle.css";
import "../styles/journey.css";
import "../styles/postcompra.css";
import "../styles/reservation-detail.css";

const TIMEZONE_EXIBICAO = import.meta.env.VITE_TIMEZONE_EXIBICAO || "America/Sao_Paulo";

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE_EXIBICAO })
    || t("reservation.tracking.notProvided");
}

function resolveVeiculoNome(reserva) {
  const modelo = reserva?.veiculo?.modeloVeiculo || reserva?.veiculo || {};
  return [modelo.marca, modelo.modelo].filter(Boolean).join(" ") || t("reservation.detail.vehicleMissing");
}

function nomeGaragem(garagem, id) {
  return garagem?.nome || id || t("reservation.detail.garageMissing");
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
  return copiado ? Promise.resolve() : Promise.reject(new Error(t("reservation.share.copyError")));
}

function destinoDaReserva(reserva) {
  if (reserva.status === STATUS_RESERVA.AGUARDANDO_PAGAMENTO) {
    return { path: "/pagamento", label: t("reservation.detail.actions.pay") };
  }
  if (reserva.status === STATUS_RESERVA.CONFIRMADA && reserva.statusPagamento === "SUCESSO") {
    return { path: "/desbloqueio", label: t("reservation.unlock.submit") };
  }
  if (reserva.status === STATUS_RESERVA.EM_ANDAMENTO) {
    return { path: `/reserva/${reserva.id}/localizacao`, label: t("reservation.detail.actions.track") };
  }
  if (reserva.status === STATUS_RESERVA.REALIZADA) {
    return { path: "/avaliacao", label: t("reservation.detail.actions.rate") };
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
  const [qr, setQr] = useState({});

  useEffect(() => {
    document.title = t("reservation.detail.documentTitle");
    let ativo = true;
    setCarregando(true);
    setErro("");

    if (!id) {
      setErro(t("reservation.detail.missingId"));
      setCarregando(false);
      return () => { ativo = false; };
    }

    const financeiro = typeof getPagamentoReserva === "function" ? Promise.resolve(getPagamentoReserva(id)) : Promise.resolve(null);
    Promise.all([getReservaById(id), financeiro])
      .then(([resultado, statusFinanceiro]) => { if (ativo) { setReserva(resultado); setPagamento(statusFinanceiro); } })
      .catch((error) => { if (ativo) setErro(error?.message || t("reservation.return.loadError")); })
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
      let mensagem = t("reservation.share.ready");
      let compartilhado = false;
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: t("reservation.share.nativeTitle", { vehicle: resolveVeiculoNome(reserva) }),
            text: t("reservation.share.nativeText"),
            url: resultado.url,
          });
          compartilhado = true;
          mensagem = t("reservation.share.opened");
        } catch {
          // Se a pessoa fechar o compartilhamento nativo, mantém cópia como alternativa.
        }
      }
      if (!compartilhado) {
        await copiarLink(resultado.url);
        mensagem = t("reservation.share.copied");
      }
      setCompartilhamento({ url: resultado.url, mensagem, carregando: false, erro: "" });
    } catch (error) {
      setCompartilhamento((atual) => ({
        ...atual,
        carregando: false,
        erro: error?.message || t("reservation.share.error"),
      }));
    }
  }

  async function mostrarQr() {
    setQr({ carregando: true });
    try {
      const token = await getQrDesbloqueio(reserva.id);
      const link = `/desbloqueio?qr=${encodeURIComponent(token)}`;
      const svg = await QRCode.toString(`${window.location.origin}${link}`, { type: "svg", margin: 1 });
      const imagem = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      setQr({ link, imagem });
    } catch (error) {
      setQr({ erro: error?.message || t("reservation.detail.qrError") });
    }
  }

  async function revogar() {
    setCompartilhamento((atual) => ({ ...atual, carregando: true, erro: "" }));
    try {
      await revogarCompartilhamentoReserva(reserva.id);
      setCompartilhamento({ mensagem: t("reservation.share.revoked"), carregando: false, erro: "" });
    } catch (error) {
      setCompartilhamento((atual) => ({
        ...atual,
        carregando: false,
        erro: error?.message || t("reservation.share.revokeError"),
      }));
    }
  }

  const voltar = (
    <button type="button" className="btn btn--quiet page-head__back" onClick={() => navigate("/historico")}>
      <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
      {t("reservation.detail.backToHistory")}
    </button>
  );

  if (carregando || erro || !reserva) {
    return (
      <main className="journey-page">
        {voltar}
        <header className="journey-head"><h1>{t("reservation.detail.title")}</h1></header>
        {carregando && <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("reservation.return.loading")}</p>}
        {!carregando && erro && (
          <div className="state-block state-block--error" role="alert">
            <p className="state-block__title">{t("reservation.detail.openError")}</p>
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
      <header className="journey-head">
        <h1>{t("reservation.detail.title")}</h1>
        <div className="detail-head">
          <h2>{resolveVeiculoNome(reserva)}</h2>
          <StatusBadge status={reserva.status} expiradaEm={reserva.expiradaEm} role="status" />
        </div>
      </header>

      <div className="journey-layout detail-layout">
        <div className="journey-layout__main">
          <section className="journey-section" aria-labelledby="detalhe-quando">
            <h2 id="detalhe-quando">{t("reservation.detail.whenWhere")}</h2>
            <div className="detail-vehicle">
              <VehicleMedia vehicle={reserva.veiculo} className="summary-vehicle__media" />
              <ol className="itinerary">
                <Leg icon={faArrowRightFromBracket} label={t("payment.summary.pickup")} garagem={reserva.garagemRetirada} id={reserva.idGaragemRetirada} quando={reserva.dataHoraInicio} />
                <Leg icon={faArrowRightToBracket} label={t("payment.summary.return")} garagem={reserva.garagemDevolucao} id={reserva.idGaragemDevolucao} quando={reserva.dataHoraFim} />
              </ol>
            </div>
          </section>

          {reserva.servicos?.length > 0 && (
            <section className="journey-section" aria-labelledby="servicos-title">
              <h2 id="servicos-title">{t("reservation.detail.services")}</h2>
              <ul className="line-list">
                {reserva.servicos.map((servico) => (
                  <li key={servico.idServico || servico.id} className="line-list__item">
                    <div>
                      <strong>{servico.nome || t("reservation.detail.service")}</strong>
                      {servico.descricao && <p className="line-list__desc">{servico.descricao}</p>}
                      {servico.detalhesCobertura && (
                        <details className="line-list__details">
                          <summary>{t("reservation.detail.coverageDetails")}</summary>
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
              <h2 id="codigo-title">{t("reservation.unlock.codeLabel")}</h2>
              <strong className="unlock-code">{reserva.codigoDesbloqueio}</strong>
              <p className="journey-muted">{t("reservation.detail.codeNotice")}</p>
              {reserva.status === STATUS_RESERVA.CONFIRMADA && (
                <div className="detail-qr">
                  {!qr.imagem && (
                    <button type="button" className="btn btn--secondary" disabled={qr.carregando} aria-busy={qr.carregando || undefined} onClick={() => void mostrarQr()}>
                      {qr.carregando ? t("reservation.detail.qrGenerating") : t("reservation.detail.qrShow")}
                    </button>
                  )}
                  {qr.imagem && <>
                    <img src={qr.imagem} width="240" height="240" alt={t("reservation.detail.qrAlt")} />
                    <p><a href={qr.link} onClick={(event) => { event.preventDefault(); navigate(qr.link); }}>{t("reservation.detail.qrUseHere")}</a></p>
                  </>}
                  {qr.erro && <p className="alert alert--danger" role="alert">{qr.erro}</p>}
                </div>
              )}
            </section>
          )}

          <section className="journey-section" aria-labelledby="share-title">
            <h2 id="share-title">{t("reservation.share.title")}</h2>
            <p className="journey-muted">{t("reservation.share.notice")}</p>
            <div className="journey-actions detail-share">
              <button type="button" className="btn btn--secondary" disabled={compartilhamento.carregando} aria-busy={compartilhamento.carregando || undefined} onClick={() => void compartilhar()}>
                {compartilhamento.carregando ? t("reservation.share.generating") : t("reservation.share.title")}
              </button>
              {compartilhamento.url && <>
                <button type="button" className="btn btn--quiet" onClick={() => void copiarLink(compartilhamento.url).then(() => setCompartilhamento((atual) => ({ ...atual, mensagem: t("reservation.share.copied"), erro: "" }))).catch((error) => setCompartilhamento((atual) => ({ ...atual, erro: error.message })))}>{t("reservation.share.copy")}</button>
                <button type="button" className="btn btn--quiet" onClick={() => void revogar()}>{t("reservation.share.revoke")}</button>
              </>}
            </div>
            {compartilhamento.url && <p><a href={compartilhamento.url} target="_blank" rel="noreferrer">{t("reservation.share.open")}</a></p>}
            {compartilhamento.mensagem && <p className="journey-muted" aria-live="polite">{compartilhamento.mensagem}</p>}
            {compartilhamento.erro && <p className="alert alert--danger" aria-live="assertive" role="alert">{compartilhamento.erro}</p>}
          </section>
        </div>

        <aside className="journey-layout__aside detail-aside">
          <section className="price-summary" aria-labelledby="financeiro-title">
            <h2 id="financeiro-title">{t("reservation.detail.financialSummary")}</h2>
            <dl className="price-summary__rows">
              {contarDiarias(reserva.dataHoraInicio, reserva.dataHoraFim) && (
                <div><dt>{t("reservation.detail.days")}</dt><dd className="tabular">{contarDiarias(reserva.dataHoraInicio, reserva.dataHoraFim)}</dd></div>
              )}
              <div><dt>{t("payment.summary.payment")}</dt><dd>{rotulo(STATUS_PAGAMENTO_LABELS, statusPagamentoAtual) || t("reservation.tracking.notProvided")}</dd></div>
              {pagamento?.statusEstorno && <>
                <div><dt>{t("reservation.detail.amountPaid")}</dt><dd className="tabular">{formatMoneyBRL(pagamento.valorPago)}</dd></div>
                <div><dt>{t("reservation.detail.refundStatus")}</dt><dd>{rotulo(STATUS_ESTORNO_LABELS, pagamento.statusEstorno)}</dd></div>
                <div><dt>{t("reservation.detail.refundable")}</dt><dd className="tabular">{formatMoneyBRL(pagamento.valorElegivelEstorno)}</dd></div>
              </>}
            </dl>
            <div className="price-summary__total">
              <span>{t("payment.summary.total")}</span>
              <strong className="tabular">{reserva.valorTotal != null ? formatMoneyBRL(reserva.valorTotal) : t("reservation.detail.amountMissing")}</strong>
            </div>
            {/* O aviso da API vem em pt-BR; a interface mostra o mesmo aviso no idioma ativo. */}
            {pagamento?.aviso && <p className="price-summary__note">{t("payment.summary.sandboxNote")}</p>}

            <div className="detail-actions" aria-label={t("reservation.detail.actionsLabel")} role="group">
              {destino && <button type="button" className="btn btn--lg btn--block" onClick={() => navegarComReserva(destino.path)}>{destino.label}</button>}
              {reserva.status === STATUS_RESERVA.EM_ANDAMENTO && <button type="button" className="btn btn--secondary btn--block" onClick={() => navegarComReserva("/devolucao")}>{t("reservation.detail.actions.return")}</button>}
              {podeCancelar && <button type="button" className="btn btn--danger btn--block" onClick={() => navegarComReserva("/cancelamento")}>{t("reservation.cancel.title")}</button>}
              {!destino && reserva.status === STATUS_RESERVA.CANCELADA && <p className="journey-muted" role="status">{reserva.expiradaEm ? t("reservation.detail.expiredNotice", { minutos: PRAZO_PAGAMENTO_MINUTOS }) : t("reservation.detail.cancelledNotice")}</p>}
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
