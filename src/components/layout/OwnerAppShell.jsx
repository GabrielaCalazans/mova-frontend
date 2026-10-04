import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faCalendarCheck, faCarSide, faChartLine, faGaugeHigh, faUser, faWarehouse } from "@fortawesome/free-solid-svg-icons";
import { clearAuthSession } from "../../services/authSession";
import BrandLogo from "../brand/BrandLogo";
import ThemeToggle from "../ui/ThemeToggle";
import { ShellContext } from "./shell-context";
import "../../styles/shell.css";
import "../../styles/owner.css";

const links = [
  ["Painel", "/painel", faGaugeHigh],
  ["Frota", "/cadastro-carros", faCarSide],
  ["Garagens", "/cadastro-garagens", faWarehouse],
  ["Reservas", "/reservas", faCalendarCheck],
  ["Relatórios", "/relatorios", faChartLine],
  ["Conta", "/conta", faUser],
];

const OWNER_SHELL = { owner: true };

export default function OwnerAppShell({ children }) {
  const navigate = useNavigate();

  function sair() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <ShellContext.Provider value={OWNER_SHELL}>
      <div className="mova-shell mova-shell--owner">
        <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
        <header className="owner-header">
          <div className="owner-header__inner">
            <NavLink className="owner-header__brand" to="/painel" aria-label="MOVA, painel do locador">
              <BrandLogo variant="header" decorative />
            </NavLink>
            <span className="owner-header__label">Área do locador</span>
            <span className="appbar__spacer" />
            <span className="appbar__theme"><ThemeToggle /></span>
            <button type="button" className="btn btn--quiet" onClick={sair}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} aria-hidden="true" /> Sair
            </button>
          </div>
        </header>
        <nav className="owner-nav" aria-label="Navegação do locador">
          <div className="owner-nav__inner">
            {links.map(([label, to, icon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? "owner-nav__link owner-nav__link--active" : "owner-nav__link"}>
                <FontAwesomeIcon icon={icon} aria-hidden="true" /> {label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div id="conteudo-principal" className="mova-shell__main owner-main" tabIndex="-1">{children}</div>
      </div>
    </ShellContext.Provider>
  );
}
