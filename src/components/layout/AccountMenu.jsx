import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faGear, faHeadset, faRightFromBracket, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import { clearAuthSession } from "../../services/authSession";
import ThemeToggle from "../ui/ThemeToggle";

const ITEMS = [
  { label: "Minha conta", icon: faUser, route: "/conta" },
  { label: "Histórico", icon: faClockRotateLeft, route: "/historico" },
  { label: "Suporte", icon: faHeadset, route: "/suporte" },
  { label: "Configurações", icon: faGear, route: "/configuracoes" },
];

const FOCUSABLE = 'a[href], button:not([disabled]):not([tabindex="-1"])';

/**
 * Menu da conta do locatário. Folha inferior no mobile, painel ancorado no
 * desktop. Diálogo modal: foco entra no primeiro item, Tab circula dentro,
 * Escape fecha e o foco volta ao acionador (responsabilidade de onClose).
 */
export default function AccountMenu({ open, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.querySelector(FOCUSABLE)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function leave() {
    onClose();
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="account-menu" data-mova-menu>
      <button type="button" className="account-menu__scrim" tabIndex={-1} aria-hidden="true" onClick={onClose} />
      <div ref={panelRef} className="account-menu__panel" role="dialog" aria-modal="true" aria-labelledby="account-menu-title">
        <div className="account-menu__head">
          <h2 id="account-menu-title">Menu da conta</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            <span className="sr-only">Fechar menu</span>
          </button>
        </div>
        <nav aria-label="Conta">
          {ITEMS.map(({ label, icon, route }) => (
            <Link key={route} to={route} className="account-menu__item" onClick={onClose}>
              <FontAwesomeIcon icon={icon} aria-hidden="true" fixedWidth />
              {label}
            </Link>
          ))}
        </nav>
        <div className="account-menu__theme">
          <p className="account-menu__label">Tema</p>
          <ThemeToggle labeled />
        </div>
        <button type="button" className="account-menu__item account-menu__item--danger" onClick={leave}>
          <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" fixedWidth />
          Sair
        </button>
      </div>
    </div>
  );
}
