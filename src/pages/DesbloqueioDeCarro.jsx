import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faCircleExclamation, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { getAuthSession } from "../services/authSession";
import { rotulo, STATUS_PAGAMENTO, STATUS_RESERVA, STATUS_RESERVA_LABELS } from "../services/apiEnums";
import {
  desbloquearReserva,
  desbloquearReservaPorQr,
  getReservaById,
  listReservasDoLocatario,
} from "../services/reservaService";
import { formatDate, t } from "../i18n";
import "../styles/journey.css";
import "../styles/payment.css";
import "../styles/postcompra.css";

// TASK 05 — esta tela NUNCA declara o veiculo desbloqueado por conta propria.
// "Veiculo Desbloqueado" so aparece depois que POST /reserva/:id/desbloqueio
// respondeu 200 (ou quando o GET da reserva ja traz codigoUsadoEm). O
// sessionStorage e so um atalho para achar o id; o estado vem do backend.
// Ver auditoria/DESBLOQUEIO.md.

const TIMEOUT_GEO_MS = 8000;

function idReservaDoQr(token) {
  if (!token) return "";
  const segmento = token.split(".")[1];
  if (!segmento) return "";

  try {
    const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segmento.length / 4) * 4, "=");
    const bytes = atob(base64);
    const texto = decodeURIComponent([...bytes].map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
    const id = JSON.parse(texto)?.idReserva;
    return typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

// A posicao deve ser obtida no momento do pedido. Falhas do navegador
// interrompem o envio; o backend continua responsavel por validar o raio.
function obterCoordenadas() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation?.getCurrentPosition) {
      reject(new Error(t("reservation.unlock.geo.unsupported")));
      return;
    }

    let concluido = false;
    const concluir = (acao, valor) => {
      if (concluido) return;
      concluido = true;
      clearTimeout(prazo);
      acao(valor);
    };
    // O timeout da API pode nao contar enquanto o prompt de permissao esta aberto.
    const prazo = setTimeout(() => concluir(reject, new Error(t("reservation.unlock.geo.timeout"))), TIMEOUT_GEO_MS);
    try {
      navigator.geolocation.getCurrentPosition(
        (posicao) => {
          const latitude = posicao?.coords?.latitude;
          const longitude = posicao?.coords?.longitude;
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
              latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            concluir(reject, new Error(t("reservation.unlock.geo.invalid")));
            return;
          }
          concluir(resolve, { latitude, longitude });
        },
        (erro) => {
          const mensagem = erro?.code === 1
            ? t("reservation.unlock.geo.denied")
            : erro?.code === 3
              ? t("reservation.unlock.geo.timeout")
              : t("reservation.unlock.geo.unavailable");
          concluir(reject, new Error(mensagem));
        },
        { timeout: TIMEOUT_GEO_MS, enableHighAccuracy: true, maximumAge: 0 },
      );
    } catch {
      concluir(reject, new Error(t("reservation.unlock.geo.requestFailed")));
    }
  });
}

// Reserva que ainda pode ser desbloqueada: paga e confirmada (ou ja em
// andamento). Quem ainda nao foi desbloqueada vem primeiro — e o que o usuario
// veio fazer; entre iguais, a mais proxima do inicio. Usada so na recuperacao,
// quando o estado local da jornada se perdeu.
function escolherReservaDesbloqueavel(reservas) {
  return (
    [...reservas]
      .filter(
        (r) =>
          r.statusPagamento === STATUS_PAGAMENTO.SUCESSO &&
          (r.status === STATUS_RESERVA.CONFIRMADA ||
            r.status === STATUS_RESERVA.EM_ANDAMENTO),
      )
      .sort(
        (a, b) =>
          Number(Boolean(a.codigoUsadoEm)) - Number(Boolean(b.codigoUsadoEm)) ||
          new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio),
      )[0] ?? null
  );
}

function formatarDataHora(valor) {
  const date = formatDate(valor);
  if (!date) return "";
  return t("reservation.common.dateAtTime", { date, time: formatDate(valor, { hour: "2-digit", minute: "2-digit" }) });
}

export default function TelaDeDesbloqueio() {
  const navigate = useNavigate();
  const location = useLocation();
  // Deep link do QR: /desbloqueio?qr=<token assinado>. O token carrega
  // idReserva + codigo e e revalidado inteiro pelo backend.
  const qrToken = new URLSearchParams(location?.search || "").get("qr") || "";

  const [reserva, setReserva] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [codigo, setCodigo] = useState("");
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [erroDesbloqueio, setErroDesbloqueio] = useState("");

  useEffect(() => {
    document.title = t("reservation.unlock.documentTitle");
  }, []);

  // Carrega a reserva pelo backend. O id vem do historico (location.state), da
  // jornada em sessao ou — se os dois faltarem — da listagem do proprio
  // locatario. O codigo exibido e sempre o que o backend devolveu.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErroCarregamento("");

      try {
        const idQr = idReservaDoQr(qrToken);
        if (qrToken && !idQr) {
          throw new Error(t("reservation.unlock.invalidQr"));
        }

        const idDireto = idQr ||
          location?.state?.reservaId || getJourneyStep("reserva")?.id || "";

        let encontrada = idDireto ? await getReservaById(idDireto) : null;

        if (!encontrada) {
          const idLocatario = getAuthSession()?.user?.id;
          if (!idLocatario) {
            throw new Error(t("reservation.common.invalidSession"));
          }
          const reservas = await listReservasDoLocatario(idLocatario);
          encontrada = escolherReservaDesbloqueavel(reservas);
        }

        if (!ativo) return;

        if (!encontrada) {
          setErroCarregamento(
            t("reservation.unlock.noneFound"),
          );
          return;
        }

        setReserva(encontrada);
        setCodigo(encontrada.codigoDesbloqueio || "");
        // Reidrata a jornada para as telas seguintes (avaliacao/devolucao).
        updateJourneyStep("reserva", {
          id: encontrada.id,
          valorTotal: encontrada.valorTotal,
          codigoDesbloqueio: encontrada.codigoDesbloqueio || "",
        });
      } catch (error) {
        if (!ativo) return;
        setErroCarregamento(
          error?.message || t("reservation.common.loadError"),
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [location?.state, qrToken]);

  async function enviarDesbloqueio(usarQr) {
    if (!reserva?.id) return;

    setErroDesbloqueio("");
    setDesbloqueando(true);

    try {
      const coord = await obterCoordenadas();
      const atualizada = usarQr
        ? await desbloquearReservaPorQr(reserva.id, qrToken, coord)
        : await desbloquearReserva(reserva.id, codigo.trim(), coord);

      // So aqui o veiculo esta desbloqueado: e a reserva que o backend
      // devolveu, com codigoUsadoEm preenchido e status EM_ANDAMENTO.
      setReserva(atualizada);
    } catch (error) {
      setErroDesbloqueio(
        error?.message || t("reservation.unlock.error"),
      );
    } finally {
      setDesbloqueando(false);
    }
  }

  const desbloqueado = Boolean(reserva?.codigoUsadoEm);
  const pagamentoConfirmado =
    reserva?.statusPagamento === STATUS_PAGAMENTO.SUCESSO;
  const temCodigo = Boolean(reserva?.codigoDesbloqueio);

  return (
    <main className="journey-page">
      <header className="journey-head">
        <h1>{t("reservation.unlock.title")}</h1>
      </header>

      {carregando && (
        <p className="loading-state" role="status">
          <span className="spinner" aria-hidden="true" />
          {t("reservation.common.loading")}
        </p>
      )}

      {!carregando && erroCarregamento && (
        <div className="state-block state-block--error">
          <p className="state-block__title">{t("reservation.unlock.openError")}</p>
          <p className="state-block__text" role="alert">{erroCarregamento}</p>
          <button type="button" className="btn" onClick={() => navigate("/historico")}>
            {t("reservation.common.myReservations")}
          </button>
        </div>
      )}

      {!carregando && !erroCarregamento && reserva && desbloqueado && (
        <section className="pay-success" aria-labelledby="titulo-desbloqueado">
          <h2 className="pay-success__title" id="titulo-desbloqueado" data-testid="titulo-desbloqueado">
            <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />
            {t("reservation.unlock.successTitle")}
          </h2>
          <p>
            {t("reservation.unlock.confirmedAt")}{" "}
            <span className="tabular">{formatarDataHora(reserva.codigoUsadoEm)}</span>.
          </p>
          <p className="journey-muted" data-testid="status-reserva">
            {t("reservation.unlock.status", { status: rotulo(STATUS_RESERVA_LABELS, reserva.status) })}
          </p>
          <p className="journey-muted">
            {t("reservation.unlock.reviewLater")}
          </p>
          <div className="journey-actions">
            <button type="button" className="btn btn--lg" onClick={() => navigate("/historico")}>
              {t("reservation.common.myReservations")}
            </button>
          </div>
        </section>
      )}

      {!carregando &&
        !erroCarregamento &&
        reserva &&
        !desbloqueado &&
        (!pagamentoConfirmado || !temCodigo) && (
          <section className="state-block">
            <h2 className="state-block__title">{t("reservation.unlock.unpaidTitle")}</h2>
            <p className="state-block__text">
              {t("reservation.unlock.unpaidText")}
            </p>
            <button type="button" className="btn" onClick={() => navigate("/pagamento")}>
              {t("reservation.unlock.goToPayment")}
            </button>
          </section>
        )}

      {!carregando &&
        !erroCarregamento &&
        reserva &&
        !desbloqueado &&
        pagamentoConfirmado &&
        temCodigo && (
          <form
            className="post-panel unlock-panel"
            aria-labelledby="desbloqueio-titulo"
            aria-busy={desbloqueando || undefined}
            onSubmit={(evento) => {
              evento.preventDefault();
              enviarDesbloqueio(false);
            }}
          >
            <h2 id="desbloqueio-titulo">{t("reservation.unlock.formTitle")}</h2>

            <div className="pay-success__code">
              <span className="journey-muted">{t("reservation.unlock.yourCode")}</span>
              <strong className="unlock-code" data-testid="codigo-desbloqueio">
                {reserva.codigoDesbloqueio}
              </strong>
              <span className="journey-muted">
                {t("reservation.unlock.validFrom")} <span className="tabular">{formatarDataHora(reserva.dataHoraInicio)}</span>
                {t("reservation.unlock.validFromSuffix")}
              </span>
            </div>

            <p className="alert alert--info">
              <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
              <span className="alert__body">
                {t("reservation.unlock.locationNotice")}
              </span>
            </p>

            {qrToken && (
              <button
                type="button"
                className="btn btn--secondary btn--lg"
                onClick={() => enviarDesbloqueio(true)}
                disabled={desbloqueando}
              >
                {desbloqueando ? t("reservation.unlock.unlocking") : t("reservation.unlock.byQr")}
              </button>
            )}

            <div className="field">
              <label className="field__label" htmlFor="codigo-desbloqueio">
                {t("reservation.unlock.codeLabel")}
              </label>
              <input
                id="codigo-desbloqueio"
                name="codigo"
                className="field__control unlock-input"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoComplete="off"
                aria-invalid={erroDesbloqueio ? "true" : undefined}
                aria-describedby={erroDesbloqueio ? "erro-desbloqueio" : undefined}
              />
            </div>

            <button
              type="submit"
              className="btn btn--lg"
              disabled={desbloqueando || codigo.trim().length === 0}
              aria-busy={desbloqueando || undefined}
            >
              {desbloqueando ? t("reservation.unlock.unlocking") : t("reservation.unlock.submit")}
            </button>

            {erroDesbloqueio && (
              <div className="alert alert--danger" id="erro-desbloqueio">
                <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
                <p className="alert__body" role="alert">{erroDesbloqueio}</p>
              </div>
            )}
          </form>
        )}
    </main>
  );
}
