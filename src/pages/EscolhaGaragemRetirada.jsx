import GarageJourneyStep from "../components/GarageJourneyStep";
import { t } from "../i18n";

export default function EscolhaGaragemRetirada() {
  return (
    <GarageJourneyStep
      stepKey="retirada"
      title={t("journey.pickup.title")}
      subtitle={t("journey.pickup.subtitle")}
      nextPath="/escolha-garagem-devolucao"
      nextButtonLabel={t("journey.pickup.next")}
      documentTitle={t("journey.pickup.documentTitle")}
    />
  );
}
