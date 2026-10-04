const STEPS = [
  ["veiculo", "Veículo"],
  ["retirada", "Retirada"],
  ["devolucao", "Devolução"],
  ["servicos", "Serviços"],
  ["resumo", "Resumo"],
  ["condutores", "Condutores"],
  ["pagamento", "Pagamento"],
];

/**
 * Onde estou na reserva. Mobile mostra "Etapa N de 7" + barra segmentada;
 * desktop mostra a lista inteira. A etapa atual é aria-current="step" e
 * as concluídas trazem "concluída" em texto, não só cor.
 */
export default function JourneySteps({ current }) {
  const index = Math.max(0, STEPS.findIndex(([key]) => key === current));
  const label = STEPS[index][1];

  return (
    <nav className="journey-steps" aria-label="Etapas da reserva">
      <p className="journey-steps__count">
        Etapa <span className="tabular">{index + 1}</span> de <span className="tabular">{STEPS.length}</span> · <strong>{label}</strong>
      </p>
      <ol className="journey-steps__list">
        {STEPS.map(([key, name], stepIndex) => {
          const state = stepIndex < index ? "done" : stepIndex === index ? "current" : "todo";
          return (
            <li key={key} className={`journey-steps__item journey-steps__item--${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="journey-steps__name">{name}</span>
              {state === "done" && <span className="sr-only"> (concluída)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
