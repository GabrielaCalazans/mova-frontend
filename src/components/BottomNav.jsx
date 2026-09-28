import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCarSide,
  faHeart,
  faHouse,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { User, Clock, HeadphonesIcon, Settings, Sun, Moon } from "lucide-react";
import { ModalOverlay, ModalContent, MenuItem } from "../styles/authStyle";
import { clearAuthSession } from "../services/authSession";
import { getUserCargo } from "../services/authIdentity";
import { useAuthSession } from "../hooks/useAuthSession";
import { useActiveReservation } from "../hooks/useActiveReservation";
import { useTheme } from "../context/useTheme";
import "../styles/home.css";

const MENU_ITEMS = [
  { label: "Minha Conta", icon: <User size={18} />, route: "/conta" },
  { label: "Histórico", icon: <Clock size={18} />, route: "/historico" },
  { label: "Suporte", icon: <HeadphonesIcon size={18} />, route: "/suporte" },
  { label: "Configurações", icon: <Settings size={18} />, route: "/configuracoes" },
];

/** Navegação do locatário derivada da sessão e da reserva ativa real. */
export default function BottomNav({ activeReservation: providedReservation } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthSession();
  const { temaEscuro, toggleTemaEscuro } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const menuButtonRef = useRef(null);
  const firstMenuRef = useRef(null);
  const localActivity = useActiveReservation({ enabled: providedReservation === undefined });
  const activeReservation = providedReservation === undefined
    ? localActivity.reservation
    : providedReservation;

  useEffect(() => {
    if (!menuVisible) return undefined;
    firstMenuRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuVisible(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...document.querySelectorAll("[data-mova-menu] button")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuVisible]);

  if (!session?.token || getUserCargo(session.user) === "LOCADOR") return null;

  const navItems = [
    { key: "home", icon: faHouse, route: "/home", label: "Início" },
    ...(activeReservation
      ? [{ key: "alugar", icon: faCarSide, route: "/carros", label: "Alugar" }]
      : []),
    { key: "historico", icon: faCalendarCheck, route: "/historico", label: "Reservas" },
    { key: "favoritos", icon: faHeart, route: "/carros/favoritos", label: "Favoritos" },
  ];

  const closeMenu = () => {
    setMenuVisible(false);
    menuButtonRef.current?.focus();
  };

  const leave = () => {
    closeMenu();
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <nav className="home-bottom-nav" aria-label="Navegação principal">
        {navItems.map(({ key, icon, route, label }) => {
          const isActive = location.pathname === route || location.pathname.startsWith(`${route}/`);
          return (
            <button
              key={key}
              type="button"
              className={`home-bottom-nav__item${isActive ? " home-bottom-nav__item--active" : ""}`}
              onClick={() => navigate(route)}
              aria-current={isActive ? "page" : undefined}
            >
              <FontAwesomeIcon icon={icon} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}

        <button
          ref={menuButtonRef}
          type="button"
          className={`home-bottom-nav__item${location.pathname === "/conta" ? " home-bottom-nav__item--active" : ""}`}
          onClick={() => setMenuVisible(true)}
          aria-label="Menu"
          aria-haspopup="dialog"
          aria-expanded={menuVisible}
        >
          <FontAwesomeIcon icon={faUser} aria-hidden="true" />
          <span>Conta</span>
        </button>
      </nav>

      {menuVisible && (
        <ModalOverlay onClick={closeMenu}>
          <ModalContent data-mova-menu role="dialog" aria-modal="true" aria-label="Menu da conta" onClick={(event) => event.stopPropagation()}>
            {MENU_ITEMS.map(({ label, icon, route }, index) => (
              <MenuItem
                as="button"
                type="button"
                key={route}
                ref={index === 0 ? firstMenuRef : undefined}
                onClick={() => { closeMenu(); navigate(route); }}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", background: "transparent" }}
              >
                {icon}
                {label}
              </MenuItem>
            ))}

            <MenuItem
              as="button"
              type="button"
              role="switch"
              aria-checked={temaEscuro}
              aria-label={temaEscuro ? "Desativar tema escuro" : "Ativar tema escuro"}
              onClick={toggleTemaEscuro}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%", background: "transparent" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {temaEscuro ? <Moon size={18} /> : <Sun size={18} />}
                {temaEscuro ? "Tema Escuro" : "Tema Claro"}
              </span>
              <span aria-hidden="true" className="theme-switch-indicator">
                <span className="theme-switch-indicator__thumb" />
              </span>
            </MenuItem>

            <MenuItem
              as="button"
              type="button"
              onClick={leave}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", background: "transparent", color: "#c0392b", fontWeight: "700" }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
              Sair
            </MenuItem>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
