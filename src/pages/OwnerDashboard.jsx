import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import "../styles/owner.css";
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
      <header className="page-head">
        <h1 id="owner-dashboard-title">Painel do locador</h1>
        <p className="page-head__lede">Inventário, reservas e ocupação da sua frota em um só lugar.</p>
      </header>

      <section aria-label="Resumo da operação">
        <dl className="owner-summary">
          <div className="owner-summary__item">
            <dt>Veículos</dt>
            {errors.frota ? <dd role="alert">{errors.frota}</dd> : <dd>{valueOrUnavailable(frota?.veiculos?.total, (value) => `${value} no total`)}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/cadastro-carros">Abrir frota <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>Reservas</dt>
            {errors.reservas ? <dd role="alert">{errors.reservas}</dd> : <dd>{valueOrUnavailable(reservas?.total, (value) => `${value} no período`)}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/reservas">Ver reservas <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>Ocupação</dt>
            {errors.utilizacao ? <dd role="alert">{errors.utilizacao}</dd> : <dd>{valueOrUnavailable(utilizacao?.taxaOcupacao, (value) => `${(Number(value) * 100).toLocaleString("pt-BR")} % · ${valueOrUnavailable(utilizacao?.veiculosAlocados, String)} alocados`)}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/relatorios/veiculos">Ver relatórios <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
          <div className="owner-summary__item">
            <dt>Receita</dt>
            {errors.financeiro ? <dd role="alert">{errors.financeiro}</dd> : <dd>{valueOrUnavailable(financeiro?.faturamentoBruto, (value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)}</dd>}
            <dd className="owner-summary__link"><Link className="owner-link" to="/relatorios/veiculos">Abrir financeiro <ChevronRight aria-hidden="true" /></Link></dd>
          </div>
        </dl>
      </section>

      <section className="owner-section" aria-labelledby="owner-alerts-title">
        <div className="owner-section__head">
          <h2 id="owner-alerts-title">Alertas da frota</h2>
          <Link className="btn btn--secondary" to="/monitoramento">Abrir monitoramento</Link>
        </div>
        {errors.frota ? <p className="alert alert--danger" role="alert">{errors.frota}</p> : (
          <ul className="owner-counts">
            <li><span className="owner-counts__value">{valueOrUnavailable(alertas.INATIVIDADE, String)}</span><span><span className="owner-counts__label">Inatividade</span><br />Veículos parados há 7 dias ou mais.</span></li>
            <li><span className="owner-counts__value">{valueOrUnavailable(alertas.BAIXA_AVALIACAO, String)}</span><span><span className="owner-counts__label">Baixa avaliação</span><br />Veículos com avaliações baixas recorrentes.</span></li>
          </ul>
        )}
      </section>

      <section className="owner-section" aria-labelledby="owner-next-title">
        <div className="owner-section__head">
          <h2 id="owner-next-title">Próximas ações</h2>
        </div>
        <ul className="owner-actions">
          <li><Link to="/cadastro-garagens">Gerenciar garagens <ChevronRight aria-hidden="true" /></Link></li>
          <li><Link to="/cadastro-carros">Cadastrar ou editar veículos <ChevronRight aria-hidden="true" /></Link></li>
        </ul>
        <p className="owner-note">Quilometragem: indisponível no backend.</p>
      </section>
    </main>
  );
}
