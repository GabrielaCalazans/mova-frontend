import GarageJourneyStep from "../components/GarageJourneyStep";

export default function EscolhaGaragemDevolucao() {
  return (
    <GarageJourneyStep
      stepKey="devolucao"
      title="Escolha a Garagem para Devolução"
      subtitle="Selecione a garagem, a data e o horário para devolver o veículo."
      nextPath="/checkout-reserva"
      nextButtonLabel="Ir para checkout"
      documentTitle="MOVA - Devolução"
    />
  );
}
