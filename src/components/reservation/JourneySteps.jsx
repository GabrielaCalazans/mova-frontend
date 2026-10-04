import { t } from "../../i18n";

const STEPS = ["veiculo", "retirada", "devolucao", "servicos", "resumo", "condutores", "pagamento"];

/**
 * Onde estou na reserva. Mobile mostra "Etapa N de 7" + barra segmentada;
 * desktop mostra a lista inteira. A etapa atual é aria-current="step" e
 * as concluídas trazem "concluída" em texto, não só cor.
 */
export default function JourneySteps({ current }) {
  const index = Math.max(0, STEPS.indexOf(current));
  const label = t(`common.journey.steps.${STEPS[index]}`);

  return (
    <nav className="journey-steps" aria-label={t("common.journey.nav")}>
      <p className="journey-steps__count">
        {t("common.journey.step")} <span className="tabular">{index + 1}</span> {t("common.journey.of")} <span className="tabular">{STEPS.length}</span> · <strong>{label}</strong>
      </p>
      <ol className="journey-steps__list">
        {STEPS.map((key, stepIndex) => {
          const state = stepIndex < index ? "done" : stepIndex === index ? "current" : "todo";
          return (
            <li key={key} className={`journey-steps__item journey-steps__item--${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="journey-steps__name">{t(`common.journey.steps.${key}`)}</span>
              {state === "done" && <span className="sr-only">{t("common.journey.done")}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
