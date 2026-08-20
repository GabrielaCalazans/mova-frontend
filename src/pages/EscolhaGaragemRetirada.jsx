import GarageJourneyStep from "../components/GarageJourneyStep";

export default function EscolhaGaragemRetirada() {
  return (
    <GarageJourneyStep
      stepKey="retirada"
      title="Escolha a Garagem para Retirada"
      subtitle="Selecione a garagem, a data e o horário para retirar o veículo."
      nextPath="/escolha-garagem-devolucao"
      nextButtonLabel="Ir para devolução"
      documentTitle="MOVA - Retirada"
    />
  );
}
