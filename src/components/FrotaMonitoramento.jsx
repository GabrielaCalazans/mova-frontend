import { useEffect, useState } from "react";
import { getFrota } from "../services/dashboardService";
import { formatDate, t } from "../i18n";

export const INTERVALO_FROTA_MS = 15_000;
export const LIMITE_POSICAO_DESATUALIZADA_MS = 60_000;

function posicaoDesatualizada(dataHora) {
  const instante = new Date(dataHora).getTime();
  return !Number.isFinite(instante) || Date.now() - instante > LIMITE_POSICAO_DESATUALIZADA_MS;
}

function formatarData(dataHora) {
  return formatDate(dataHora, { dateStyle: "short", timeStyle: "medium" });
}

export default function FrotaMonitoramento() {
  const [frota, setFrota] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    let emAndamento = false;

    const atualizar = async () => {
      if (emAndamento) return;
      emAndamento = true;
      try {
        const dados = await getFrota();
        if (!ativo) return;
        setFrota(dados);
        setErro("");
      } catch (error) {
        if (ativo) setErro(error?.message || t("owner.fleet.updateError"));
      } finally {
        emAndamento = false;
      }
    };

    atualizar();
    const timer = setInterval(atualizar, INTERVALO_FROTA_MS);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, []);

  if (!frota && !erro) return <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />{t("owner.fleet.loading")}</p>;
  if (!frota) return <p className="alert alert--danger" role="alert">{erro}</p>;

  const status = frota.veiculos || {};
  const localizacoes = frota.ultimasLocalizacoes || [];

  return (
    <section className="owner-section" aria-label={t("owner.fleet.sectionLabel")}>
      <div className="owner-section__head">
        <h2>{t("owner.fleet.statusTitle")}</h2>
        <span className={`badge badge--${frota.alertasAtivos ? "warning" : "neutral"}`}>{t("owner.fleet.activeAlerts", { count: frota.alertasAtivos ?? 0 })}</span>
      </div>
      {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      <p className="sr-only">{t("owner.fleet.summary", { total: status.total ?? 0, available: status.disponivel ?? 0, reserved: status.reservado ?? 0, maintenance: status.manutencao ?? 0, inactive: status.inativo ?? 0 })}</p>
      <dl className="owner-status" aria-hidden="true">
        <div><dt>{t("owner.fleet.vehicles")}</dt><dd>{status.total ?? 0}</dd></div>
        <div><dt>{t("owner.fleet.available")}</dt><dd>{status.disponivel ?? 0}</dd></div>
        <div><dt>{t("owner.fleet.reserved")}</dt><dd>{status.reservado ?? 0}</dd></div>
        <div><dt>{t("owner.fleet.maintenance")}</dt><dd>{status.manutencao ?? 0}</dd></div>
        <div><dt>{t("owner.fleet.inactive")}</dt><dd>{status.inativo ?? 0}</dd></div>
      </dl>
      <h3>{t("owner.fleet.positionsTitle")}</h3>
      {!localizacoes.length && <p className="owner-note">{t("owner.fleet.noPositions")}</p>}
      {localizacoes.length > 0 && (
        <ul className="owner-positions">
          {localizacoes.map((posicao) => {
            const stale = posicaoDesatualizada(posicao.dataHora);
            return (
              <li key={posicao.idVeiculo}>
                <span>{posicao.placa}: {Number(posicao.latitude).toFixed(5)}, {Number(posicao.longitude).toFixed(5)} · {formatarData(posicao.dataHora)}</span>
                {stale ? <span className="badge badge--warning">{t("owner.fleet.stale")}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
