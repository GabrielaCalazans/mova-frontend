import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import CursorGlowArea from "../components/ui/CursorGlowArea";
import "../styles/vehicle.css";

import economicoImg from "../assets/car-types/manuais.png";
import executivoImg from "../assets/car-types/automaticos.png";
import adaptadoImg from "../assets/car-types/adaptados.png";
import eletricoImg from "../assets/car-types/autonomos.png";

// Todas as categorias visíveis de uma vez: o carrossel de uma opção por vez
// escondia escolhas e exigia setas para descobrir o catálogo.
const TIPOS = [
  { id: "economico", nome: "Carro Econômico", dica: "Eficiência para o dia a dia.", img: economicoImg },
  // A ilustração é decorativa; a categoria real vem do filtro enviado à API.
  { id: "espacoso", nome: "Carro Espaçoso", dica: "Mais espaço para pessoas e bagagem.", img: executivoImg },
  { id: "executivo", nome: "Carro Executivo", dica: "Conforto para compromissos.", img: executivoImg },
  { id: "adaptado", nome: "Carro Adaptado PCD", dica: "Adaptações para mobilidade reduzida.", img: adaptadoImg },
  { id: "eletrico", nome: "Carro Elétrico", dica: "Sem combustão, carga na garagem.", img: eletricoImg },
];

function TiposDeCarros() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "MOVA - Tipos de Carros";
  }, []);

  return (
    <main className="carro-page catalog-page">
      <header className="page-head">
        <h1>Escolha o tipo de carro</h1>
        <p className="page-head__lede">Comece pela categoria. Depois você compara os veículos disponíveis.</p>
      </header>

      <CursorGlowArea as="ul" className="type-grid">
        {TIPOS.map((tipo) => (
          <li key={tipo.id}>
            <button type="button" className="type-option cursor-card" onClick={() => navigate("/carros/lista", { state: { tipo: tipo.id } })}>
              <span className="type-option__media"><img src={tipo.img} alt="" /></span>
              <span className="type-option__body">
                <span className="type-option__name">{tipo.nome}</span>
                <span className="type-option__hint">{tipo.dica}</span>
              </span>
            </button>
          </li>
        ))}
      </CursorGlowArea>
      <BottomNav />
    </main>
  );
}

export default TiposDeCarros;
