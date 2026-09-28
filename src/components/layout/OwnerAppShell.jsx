import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket, faCalendarCheck, faCarSide, faChartLine, faGaugeHigh, faUser, faWarehouse } from "@fortawesome/free-solid-svg-icons";
import { clearAuthSession } from "../../services/authSession";
import "../../styles/mova-shell.css";
import "../../styles/owner.css";

const links = [
  ["Painel", "/painel", faGaugeHigh],
  ["Frota", "/cadastro-carros", faCarSide],
  ["Garagens", "/cadastro-garagens", faWarehouse],
  ["Reservas", "/reservas", faCalendarCheck],
  ["Relatórios", "/relatorios", faChartLine],
  ["Conta", "/conta", faUser],
];

export default function OwnerAppShell({ children }) {
  const navigate = useNavigate();

  function sair() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mova-shell mova-shell--owner">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
      <header className="owner-header">
        <NavLink className="mova-wordmark" to="/painel"><FontAwesomeIcon icon={faCarSide} aria-hidden="true" /> MOVA</NavLink>
        <span className="owner-header__label">Área do locador</span>
        <button type="button" className="mova-button mova-button--quiet" onClick={sair}><FontAwesomeIcon icon={faArrowRightFromBracket} aria-hidden="true" /> Sair</button>
      </header>
      <nav className="owner-nav" aria-label="Navegação do locador">
        {links.map(([label, to, icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? "owner-nav__link owner-nav__link--active" : "owner-nav__link"}>
            <FontAwesomeIcon icon={icon} aria-hidden="true" /> {label}
          </NavLink>
        ))}
      </nav>
      <div id="conteudo-principal" className="mova-shell__main owner-main" tabIndex="-1">{children}</div>
    </div>
  );
}
