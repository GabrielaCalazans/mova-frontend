import { useCallback, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGaugeHigh, faRightToBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useActiveReservation } from "../../hooks/useActiveReservation";
import { getUserCargo } from "../../services/authIdentity";
import BottomNav from "../BottomNav";
import { isNavItemActive, renterNavItems } from "./navItems";
import BrandLogo from "../brand/BrandLogo";
import ThemeToggle from "../ui/ThemeToggle";
import AccountMenu from "./AccountMenu";
import { ShellContext } from "./shell-context";
import "../../styles/shell.css";

/**
 * Shell único do visitante e do locatário: cabeçalho com a marca oficial,
 * navegação no topo (≥1024 px) ou tab bar (mobile) e menu da conta.
 * As páginas desenham o próprio <main>; o shell só fornece o alvo de foco.
 */
export default function AppShell({ children }) {
  const location = useLocation();
  const session = useAuthSession();
  const cargo = getUserCargo(session?.user);
  const isRenter = Boolean(session?.token) && cargo === "LOCATARIO";
  const isOwner = Boolean(session?.token) && cargo === "LOCADOR";
  const activity = useActiveReservation({ enabled: isRenter, refreshKey: location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef(null);

  const openMenu = useCallback((trigger) => {
    menuTrigger.current = trigger;
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuTrigger.current?.focus();
  }, []);

  const shell = useMemo(() => ({ activity }), [activity]);
  const navItems = isRenter ? renterNavItems(activity.reservation) : [];

  return (
    <ShellContext.Provider value={shell}>
      <div className={`app-shell${isRenter ? " app-shell--tabbar" : ""}`}>
        <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
        <header className="appbar">
          <div className="appbar__inner">
            <Link to="/" className="appbar__brand" aria-label="MOVA, página inicial">
              <BrandLogo variant="header" decorative />
            </Link>

            {navItems.length > 0 && (
              <nav className="topnav" aria-label="Navegação principal">
                {navItems.map((item) => {
                  const active = isNavItemActive(item, location.pathname);
                  return (
                    <NavLink key={item.key} to={item.route} end={item.end} className="topnav__item" aria-current={active ? "page" : false}>
                      <FontAwesomeIcon icon={item.icon} aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            )}

            <span className="appbar__spacer" />
            <span className="appbar__theme"><ThemeToggle /></span>

            {isOwner && (
              <Link to="/painel" className="btn btn--secondary appbar__action">
                <FontAwesomeIcon icon={faGaugeHigh} aria-hidden="true" />
                Painel do locador
              </Link>
            )}
            {isRenter && (
              <button
                type="button"
                className="btn btn--quiet appbar__account"
                aria-haspopup="dialog"
                aria-expanded={menuOpen}
                onClick={(event) => openMenu(event.currentTarget)}
              >
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                Conta
              </button>
            )}
            {!session?.token && (
              <Link to="/login" state={{ from: location }} className="btn btn--secondary appbar__action">
                <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
                Entrar
              </Link>
            )}
          </div>
        </header>

        <div id="conteudo-principal" className="app-shell__main" tabIndex={-1}>
          {children}
        </div>

        {isRenter && (
          <BottomNav shellOwned activeReservation={activity.reservation} onOpenMenu={openMenu} menuOpen={menuOpen} />
        )}
        <AccountMenu open={menuOpen} onClose={closeMenu} />
      </div>
    </ShellContext.Provider>
  );
}
