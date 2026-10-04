import { useEffect, useState } from "react";
import { getFrota } from "../services/dashboardService";

export const INTERVALO_FROTA_MS = 15_000;
export const LIMITE_POSICAO_DESATUALIZADA_MS = 60_000;

function posicaoDesatualizada(dataHora) {
  const instante = new Date(dataHora).getTime();
  return !Number.isFinite(instante) || Date.now() - instante > LIMITE_POSICAO_DESATUALIZADA_MS;
}

function formatarData(dataHora) {
  return new Date(dataHora).toLocaleString("pt-BR");
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
        if (ativo) setErro(error?.message || "Não foi possível atualizar a frota.");
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

  if (!frota && !erro) return <p className="loading-state" role="status"><span className="spinner" aria-hidden="true" />Carregando status da frota…</p>;
  if (!frota) return <p className="alert alert--danger" role="alert">{erro}</p>;

  const status = frota.veiculos || {};
  const localizacoes = frota.ultimasLocalizacoes || [];

  return (
    <section className="owner-section" aria-label="Monitoramento da frota">
      <div className="owner-section__head">
        <h2>Status da frota</h2>
        <span className={`badge badge--${frota.alertasAtivos ? "warning" : "neutral"}`}>{frota.alertasAtivos ?? 0} alertas ativos</span>
      </div>
      {erro && <p className="alert alert--danger" role="alert">{erro}</p>}
      <p className="sr-only">{status.total ?? 0} veículos · {status.disponivel ?? 0} disponíveis · {status.reservado ?? 0} reservados · {status.manutencao ?? 0} em manutenção · {status.inativo ?? 0} inativos</p>
      <dl className="owner-status" aria-hidden="true">
        <div><dt>Veículos</dt><dd>{status.total ?? 0}</dd></div>
        <div><dt>Disponíveis</dt><dd>{status.disponivel ?? 0}</dd></div>
        <div><dt>Reservados</dt><dd>{status.reservado ?? 0}</dd></div>
        <div><dt>Em manutenção</dt><dd>{status.manutencao ?? 0}</dd></div>
        <div><dt>Inativos</dt><dd>{status.inativo ?? 0}</dd></div>
      </dl>
      <h3>Últimas posições</h3>
      {!localizacoes.length && <p className="owner-note">Nenhuma posição registrada para os veículos da frota.</p>}
      {localizacoes.length > 0 && (
        <ul className="owner-positions">
          {localizacoes.map((posicao) => {
            const stale = posicaoDesatualizada(posicao.dataHora);
            return (
              <li key={posicao.idVeiculo}>
                <span>{posicao.placa}: {Number(posicao.latitude).toFixed(5)}, {Number(posicao.longitude).toFixed(5)} · {formatarData(posicao.dataHora)}</span>
                {stale ? <span className="badge badge--warning">posição desatualizada</span> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
