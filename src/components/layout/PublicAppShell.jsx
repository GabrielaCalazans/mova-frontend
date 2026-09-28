import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faRightToBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useActiveReservation } from "../../hooks/useActiveReservation";
import ActiveReservationCard from "../ActiveReservationCard";
import BottomNav from "../BottomNav";
import "../../styles/mova-shell.css";

export default function PublicAppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthSession();
  const isHome = location.pathname === "/" || location.pathname === "/home";
  const activity = useActiveReservation({ enabled: isHome });

  return (
    <div className="mova-shell mova-shell--public">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
      <header className="mova-appbar">
        <Link className="mova-wordmark" to="/" aria-label="MOVA, página inicial"><FontAwesomeIcon icon={faCar} aria-hidden="true" /> MOVA</Link>
        <nav aria-label="Navegação pública" className="mova-appbar__actions">
          {session?.token ? (
            <button type="button" className="mova-button mova-button--quiet" onClick={() => navigate("/conta")}>
              <FontAwesomeIcon icon={faUser} aria-hidden="true" /> Minha conta
            </button>
          ) : (
            <Link className="mova-button mova-button--quiet" to="/login"><FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" /> Entrar</Link>
          )}
        </nav>
      </header>
      <main id="conteudo-principal" className="mova-shell__main" tabIndex="-1">
        {isHome && activity.reservation && <ActiveReservationCard reservation={activity.reservation} />}
        {isHome && activity.error && <p className="public-home__message" role="status">A reserva ativa está indisponível no momento.</p>}
        {children}
      </main>
      {session?.token && <BottomNav activeReservation={activity.reservation} />}
    </div>
  );
}
