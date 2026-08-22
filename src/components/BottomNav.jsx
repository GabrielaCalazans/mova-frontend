import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home as HomeIcon, Car, History, Receipt, User, Clock, HeadphonesIcon, Settings, LogOut, Sun, Moon } from "lucide-react";
import { ModalOverlay, ModalContent, MenuItem } from "../styles/authStyle";
import { clearAuthSession } from "../services/authSession";
import { useTheme } from "../context/ThemeContext";
import "../styles/home.css";

const NAV_ITEMS = [
  { key: "home", icon: HomeIcon, route: "/home", label: "Início" },
  { key: "carros", icon: Car, route: "/carros", label: "Carros" },
  { key: "historico", icon: History, route: "/historico", label: "Histórico" },
  { key: "recibos", icon: Receipt, route: "/historico", label: "Recibos" },
];

const MENU_ITEMS = [
  { label: "Minha Conta", icon: <User size={18} />, route: "/conta" },
  { label: "Histórico", icon: <Clock size={18} />, route: "/historico" },
  { label: "Suporte", icon: <HeadphonesIcon size={18} />, route: "/suporte" },
  { label: "Configurações", icon: <Settings size={18} />, route: "/configuracoes" },
];

/**
 * Menu inferior fixo, presente em toda tela autenticada (exceto
 * login/cadastro/esqueci-minha-senha). O ultimo botao (Perfil) abre o menu
 * principal (Minha Conta, Historico, Suporte, Configuracoes, Tema, Sair) -
 * a navegacao "voltar/inicio/menu" que antes vivia no topo agora vive toda
 * aqui embaixo.
 */
export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { temaEscuro, toggleTemaEscuro } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  function handleKeyAction(event, action) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  }

  return (
    <>
      <nav className="home-bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ key, icon: Icon, route, label }) => {
          const isActive = location.pathname === route || location.pathname.startsWith(`${route}/`);

          return (
            <button
              key={key}
              type="button"
              className={`home-bottom-nav__item${isActive ? " home-bottom-nav__item--active" : ""}`}
              onClick={() => navigate(route)}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
            </button>
          );
        })}

        <button
          type="button"
          className={`home-bottom-nav__item${location.pathname === "/conta" ? " home-bottom-nav__item--active" : ""}`}
          onClick={() => setMenuVisible(true)}
          aria-label="Menu"
          aria-haspopup="true"
          aria-expanded={menuVisible}
        >
          <User size={22} strokeWidth={location.pathname === "/conta" ? 2.25 : 1.75} />
        </button>
      </nav>

      {menuVisible && (
        <ModalOverlay onClick={() => setMenuVisible(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            {MENU_ITEMS.map(({ label, icon, route }) => (
              <MenuItem
                key={route}
                role="button"
                tabIndex={0}
                onClick={() => { setMenuVisible(false); navigate(route); }}
                onKeyDown={(event) => handleKeyAction(event, () => { setMenuVisible(false); navigate(route); })}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {icon}
                {label}
              </MenuItem>
            ))}

            <MenuItem
              role="switch"
              aria-checked={temaEscuro}
              aria-label={temaEscuro ? "Desativar tema escuro" : "Ativar tema escuro"}
              tabIndex={0}
              onClick={toggleTemaEscuro}
              onKeyDown={(event) => handleKeyAction(event, toggleTemaEscuro)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {temaEscuro ? <Moon size={18} /> : <Sun size={18} />}
                {temaEscuro ? "Tema Escuro" : "Tema Claro"}
              </span>
              <span
                aria-hidden="true"
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 999,
                  background: temaEscuro ? "var(--color-brand-fill)" : "#c8c8c8",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 150ms",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: temaEscuro ? 18 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 150ms",
                  }}
                />
              </span>
            </MenuItem>

            <MenuItem
              role="button"
              tabIndex={0}
              onClick={() => {
                setMenuVisible(false);
                clearAuthSession();
                navigate("/login", { replace: true });
              }}
              onKeyDown={(event) => handleKeyAction(event, () => {
                setMenuVisible(false);
                clearAuthSession();
                navigate("/login", { replace: true });
              })}
              style={{ display: "flex", alignItems: "center", gap: "10px", color: "#c0392b", fontWeight: "700" }}
            >
              <LogOut size={18} color="#c0392b" />
              Sair
            </MenuItem>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
