import { useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, Car, History, Receipt, User } from "lucide-react";
import "../styles/home.css";

const NAV_ITEMS = [
  { key: "home", icon: HomeIcon, route: "/home", label: "Início" },
  { key: "carros", icon: Car, route: "/carros", label: "Carros" },
  { key: "historico", icon: History, route: "/historico", label: "Histórico" },
  { key: "recibos", icon: Receipt, route: "/historico", label: "Recibos" },
  { key: "perfil", icon: User, route: "/conta", label: "Perfil" },
];

/**
 * Menu inferior fixo, presente em toda tela autenticada (exceto
 * login/cadastro/esqueci-minha-senha). Substitui a navegacao "voltar/inicio"
 * que antes vivia no topo de cada tela.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="home-bottom-nav" aria-label="Navegação principal">
      {NAV_ITEMS.map(({ key, icon: Icon, route, label }) => {
        const isActive = location.pathname === route || location.pathname.startsWith(`${route}/`);

        return (
          <button
            key={key}
            type="button"
            className="home-bottom-nav__item"
            onClick={() => navigate(route)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            style={isActive ? { opacity: 1 } : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
          </button>
        );
      })}
    </nav>
  );
}
