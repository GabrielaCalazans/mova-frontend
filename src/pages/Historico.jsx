import ReservasList from "../components/ReservasList";

export default function Historico() {
  return (
    <ReservasList
      title="Histórico"
      documentTitle="MOVA - Histórico de Reservas"
      somenteConcluidas={false}
      emptyMessage='Você ainda não fez nenhuma reserva. Toque em "Alugar um carro" na tela inicial para começar.'
    />
  );
}
