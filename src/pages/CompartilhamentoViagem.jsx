import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCompartilhamentoPublico } from "../services/compartilhamentoService";
import { formatDate, t } from "../i18n";
import "../styles/journey.css";
import "../styles/postcompra.css";

const STATUS_CONHECIDOS = ["AGUARDANDO_PAGAMENTO", "CONFIRMADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"];

function rotuloStatus(status) {
  if (STATUS_CONHECIDOS.includes(status)) return t(`tenant.sharedTrip.status.${status}`);
  return status ?? t("tenant.sharedTrip.notProvided");
}

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "short", timeStyle: "medium" }) || t("tenant.sharedTrip.notProvided");
}

function localLabel(local) {
  return local ? `${local.nome} — ${local.endereco}` : t("tenant.sharedTrip.notProvided");
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
        setErro(error?.message || t("tenant.sharedTrip.notFound"));
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
        <h1>{t("tenant.sharedTrip.title")}</h1>
      </header>
      {carregando && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("tenant.sharedTrip.loading")}</p>
      )}
      {!carregando && erro && (
        <div className="state-block state-block--error">
          <p className="state-block__text" role="alert">{erro}</p>
        </div>
      )}
      {!carregando && !erro && dados && (
        <section className="post-panel" aria-label={t("tenant.sharedTrip.sectionLabel")}>
          <h2>{dados.veiculo?.marca} {dados.veiculo?.modelo}</h2>
          <ul className="post-facts">
            <li>{t("tenant.sharedTrip.statusLabel")} {rotuloStatus(dados.viagem?.status)}</li>
            <li>{t("tenant.sharedTrip.pickup")} {localLabel(dados.retirada)}</li>
            <li>{t("tenant.sharedTrip.return")} {localLabel(dados.devolucao)}</li>
            <li>{t("reservation.review.start")} <span className="tabular">{formatarDataHora(dados.viagem?.dataHoraInicio)}</span></li>
            <li>{t("reservation.review.end")} <span className="tabular">{formatarDataHora(dados.viagem?.dataHoraFim)}</span></li>
          </ul>
        </section>
      )}
    </main>
  );
}
