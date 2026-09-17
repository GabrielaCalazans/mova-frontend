import ReservasList from "../components/ReservasList";

export default function CorridasRealizadas() {
  return (
    <ReservasList
      title="Corridas Realizadas"
      documentTitle="MOVA - Corridas Realizadas"
      somenteConcluidas
      emptyMessage="Você ainda não concluiu nenhuma corrida."
    />
  );
}
