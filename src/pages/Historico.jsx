import ReservasList from "../components/ReservasList";
import { useNavigate } from "react-router-dom";

export default function Historico() {
  const navigate = useNavigate();
  return (
    <><button onClick={() => navigate("/pendencias-financeiras")}>Ver pendências financeiras</button><ReservasList
      title="Histórico"
      documentTitle="MOVA - Histórico de Reservas"
      somenteConcluidas={false}
      emptyMessage='Você ainda não fez nenhuma reserva. Toque em "Alugar um carro" na tela inicial para começar.'
    /></>
  );
}
