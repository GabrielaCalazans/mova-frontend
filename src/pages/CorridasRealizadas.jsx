import ReservasList from "../components/ReservasList";
import { STATUS_RESERVA } from "../services/apiEnums";

export default function CorridasRealizadas() {
  return (
    <ReservasList
      title="Corridas Realizadas"
      documentTitle="MOVA - Corridas Realizadas"
      status={[STATUS_RESERVA.REALIZADA]}
      emptyMessage="Você ainda não concluiu nenhuma corrida."
    />
  );
}
