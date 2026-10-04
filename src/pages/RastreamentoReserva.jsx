import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { getRastreamentoReserva } from "../services/reservaService";
import { formatDate, t } from "../i18n";
import "../styles/journey.css";
import "../styles/postcompra.css";

export const INTERVALO_RASTREAMENTO_MS = 15_000;

function formatarDataHora(valor) {
  return formatDate(valor, { dateStyle: "short", timeStyle: "medium" }) || t("reservation.tracking.notProvided");
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
        setErro(error?.message || t("reservation.tracking.updateError"));
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
        <h1>{t("reservation.tracking.title")}</h1>
        <p className="page-head__lede">{t("reservation.tracking.lede")}</p>
      </header>
      {carregando && (
        <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("reservation.tracking.loading")}</p>
      )}
      {erro && (
        <div className="alert alert--danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
          <p className="alert__body" role="alert">{erro}</p>
        </div>
      )}
      {veiculo && (
        <section aria-label={t("reservation.tracking.sectionLabel")} className="post-panel">
          <h2>{veiculo.nome}</h2>
          <ul className="post-facts">
            <li>{t("reservation.common.plate")} <span className="tabular">{veiculo.placa}</span></li>
            {!localizacao && <li>{t("reservation.tracking.unavailable")}</li>}
            {localizacao && (
              <>
                <li className="tabular">{t("reservation.tracking.location")} {Number(localizacao.latitude).toFixed(5)}, {Number(localizacao.longitude).toFixed(5)}</li>
                <li>{t("reservation.tracking.lastUpdate")} <span className="tabular">{formatarDataHora(localizacao.dataHora)}</span></li>
              </>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}
