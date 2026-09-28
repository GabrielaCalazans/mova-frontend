import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFinanceiro, getFrota, getReservas, getUtilizacao } from "../services/dashboardService";

const sections = [
  ["frota", getFrota],
  ["reservas", getReservas],
  ["financeiro", getFinanceiro],
  ["utilizacao", getUtilizacao],
];

function valueOrUnavailable(value, format = (item) => item) {
  return value === null || value === undefined ? "Indisponível" : format(value);
}

export default function OwnerDashboard() {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "MOVA - Painel do locador";
    let active = true;

    Promise.all(sections.map(async ([key, load]) => {
      try {
        return [key, { ok: true, value: await load() }];
      } catch (error) {
        return [key, { ok: false, message: error?.message || "Não foi possível carregar este bloco." }];
      }
    })).then((results) => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach(([key, result]) => {
        if (result.ok) nextData[key] = result.value;
        else nextErrors[key] = result.message;
      });
      setData(nextData);
      setErrors(nextErrors);
    });

    return () => { active = false; };
  }, []);

  const frota = data.frota;
  const reservas = data.reservas;
  const utilizacao = data.utilizacao;
  const financeiro = data.financeiro;
  const alertas = frota?.alertasPorTipo || {};

  return (
    <main className="owner-page" aria-labelledby="owner-dashboard-title">
        <header className="owner-page__intro">
          <p className="mova-eyebrow">Operação da frota</p>
          <h1 id="owner-dashboard-title">Painel do locador</h1>
          <p>Inventário, reservas e ocupação da sua frota em um só lugar.</p>
        </header>

        <section className="owner-metrics" aria-label="Resumo da operação">
          <article className="owner-metric">
            <h2>Veículos</h2>
            {errors.frota ? <p role="alert">{errors.frota}</p> : <p>{valueOrUnavailable(frota?.veiculos?.total, (value) => `${value} no total`)}</p>}
            <Link to="/cadastro-carros">Abrir frota</Link>
          </article>
          <article className="owner-metric">
            <h2>Reservas</h2>
            {errors.reservas ? <p role="alert">{errors.reservas}</p> : <p>{valueOrUnavailable(reservas?.total, (value) => `${value} no período`)}</p>}
            <Link to="/reservas">Ver reservas</Link>
          </article>
          <article className="owner-metric">
            <h2>Ocupação</h2>
            {errors.utilizacao ? <p role="alert">{errors.utilizacao}</p> : <p>{valueOrUnavailable(utilizacao?.taxaOcupacao, (value) => `${(Number(value) * 100).toLocaleString("pt-BR")} % · ${valueOrUnavailable(utilizacao?.veiculosAlocados, String)} alocados`)}</p>}
            <Link to="/relatorios/veiculos">Ver relatórios</Link>
          </article>
          <article className="owner-metric">
            <h2>Receita</h2>
            {errors.financeiro ? <p role="alert">{errors.financeiro}</p> : <p>{valueOrUnavailable(financeiro?.faturamentoBruto, (value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)}</p>}
            <Link to="/relatorios/veiculos">Abrir financeiro</Link>
          </article>
        </section>

        <section className="owner-panel" aria-labelledby="owner-alerts-title">
          <div>
            <p className="mova-eyebrow">Monitoramento</p>
            <h2 id="owner-alerts-title">Alertas da frota</h2>
          </div>
          {errors.frota ? <p role="alert">{errors.frota}</p> : (
            <dl className="owner-alert-list">
              <div><dt>Inatividade</dt><dd>{valueOrUnavailable(alertas.INATIVIDADE, String)}</dd></div>
              <div><dt>Baixa avaliação</dt><dd>{valueOrUnavailable(alertas.BAIXA_AVALIACAO, String)}</dd></div>
            </dl>
          )}
          <Link className="mova-button mova-button--secondary" to="/monitoramento">Abrir monitoramento</Link>
        </section>

        <section className="owner-onboarding" aria-labelledby="owner-next-title">
          <h2 id="owner-next-title">Próximas ações</h2>
          <Link to="/cadastro-garagens">Gerenciar garagens</Link>
          <Link to="/cadastro-carros">Cadastrar ou editar veículos</Link>
          <span>Quilometragem: indisponível no backend.</span>
        </section>
    </main>
  );
}
