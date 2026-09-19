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

  if (!frota && !erro) return <p className="carro-status">Carregando status da frota…</p>;
  if (!frota) return <p className="carro-status" role="alert">{erro}</p>;

  const status = frota.veiculos || {};
  const localizacoes = frota.ultimasLocalizacoes || [];

  return (
    <section className="frota-monitoramento" aria-label="Monitoramento da frota">
      <h2>Status da frota</h2>
      {erro && <p className="carro-status" role="alert">{erro}</p>}
      <p>{status.total ?? 0} veículos · {status.disponivel ?? 0} disponíveis · {status.reservado ?? 0} reservados · {status.manutencao ?? 0} em manutenção · {status.inativo ?? 0} inativos</p>
      <p>{frota.alertasAtivos ?? 0} alertas ativos</p>
      <h3>Últimas posições</h3>
      {!localizacoes.length && <p>Nenhuma posição registrada para os veículos da frota.</p>}
      {localizacoes.length > 0 && (
        <ul>
          {localizacoes.map((posicao) => {
            const stale = posicaoDesatualizada(posicao.dataHora);
            return (
              <li key={posicao.idVeiculo}>
                {posicao.placa}: {Number(posicao.latitude).toFixed(5)}, {Number(posicao.longitude).toFixed(5)} · {formatarData(posicao.dataHora)}
                {stale ? " · posição desatualizada" : ""}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
