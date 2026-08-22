import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getAuthSession } from "../services/authSession";
import BottomNav from "../components/BottomNav";
import "../styles/home.css";

const TILES = [
  {
    key: "alugar",
    title: "Alugar um carro",
    description: "Clique aqui para alugar um carro",
    route: "/carros",
    span: "full",
  },
  {
    key: "relatorios",
    title: "Relatórios",
    description: "Gráficos sobre quilometragem, alugueis e categorias",
    route: "/relatorios",
  },
  {
    key: "recibos",
    title: "Recibos",
    description: "Recibos de todas transações feitas por você",
    route: "/historico",
  },
  {
    key: "carros-alugados",
    title: "Carros Alugados",
    description: "Lista de carros que você já alugou",
    route: "/historico",
    span: "full",
  },
  {
    key: "perfil",
    title: "Perfil",
    description: "Edite seu endereço e dados cadastrais",
    route: "/conta",
  },
  {
    key: "garagens",
    title: "Garagens",
    description: "Saiba nossas localizações disponíveis",
    route: "/escolha-garagem-retirada",
  },
];

function Home() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const cityLabel = session?.user?.address?.split(",").slice(-2).join(",").trim() || "São Paulo - SP";

  useEffect(() => {
    document.title = "MOVA - Início";
  }, []);

  return (
    <main className="home-page">
      <h1 className="home-sr-only">Página Inicial</h1>

      <div className="home-content">
        <button type="button" className="home-location-pill">
          <MapPin size={16} />
          <span>{cityLabel}</span>
        </button>

        <div className="home-grid">
          {TILES.map((tile) => (
            <button
              key={tile.key}
              type="button"
              className={`home-tile${tile.span === "full" ? " home-tile--full" : ""}`}
              onClick={() => navigate(tile.route)}
            >
              <span className="home-tile__title">{tile.title}</span>
              <span className="home-tile__description">{tile.description}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

export default Home;
