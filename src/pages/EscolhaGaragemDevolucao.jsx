import GarageJourneyStep from "../components/GarageJourneyStep";
import { t } from "../i18n";

export default function EscolhaGaragemDevolucao() {
  return (
    <GarageJourneyStep
      stepKey="devolucao"
      title={t("journey.return.title")}
      subtitle={t("journey.return.subtitle")}
      nextPath="/servicos-opcionais"
      nextButtonLabel={t("journey.return.next")}
      documentTitle={t("journey.return.documentTitle")}
    />
  );
}
