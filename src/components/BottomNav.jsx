import { useCallback, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { getUserCargo } from "../services/authIdentity";
import { useAuthSession } from "../hooks/useAuthSession";
import { useActiveReservation } from "../hooks/useActiveReservation";
import { useShell } from "./layout/shell-context";
import AccountMenu from "./layout/AccountMenu";
import { isNavItemActive, renterNavItems } from "./layout/navItems";
import { t } from "../i18n";

/**
 * Tab bar do locatário. Dentro do AppShell só a instância do próprio shell
 * (shellOwned) renderiza; chamadas legadas nas páginas viram no-op.
 */
export default function BottomNav({ activeReservation: providedReservation, shellOwned = false, onOpenMenu, menuOpen } = {}) {
  const location = useLocation();
  const session = useAuthSession();
  const shell = useShell();
  const [localMenu, setLocalMenu] = useState(false);
  const menuButtonRef = useRef(null);
  const skip = Boolean(shell) && !shellOwned;
  const localActivity = useActiveReservation({ enabled: !skip && providedReservation === undefined });
  const activeReservation = providedReservation === undefined ? localActivity.reservation : providedReservation;

  const closeLocalMenu = useCallback(() => {
    setLocalMenu(false);
    menuButtonRef.current?.focus();
  }, []);

  if (skip || !session?.token || getUserCargo(session.user) === "LOCADOR") return null;

  const open = onOpenMenu ? menuOpen : localMenu;

  return (
    <>
      <nav className="tabbar" aria-label={t("common.shell.mainNav")}>
        {renterNavItems(activeReservation).map((item) => {
          const active = isNavItemActive(item, location.pathname);
          return (
            <NavLink key={item.key} to={item.route} end={item.end} className="tabbar__item" aria-current={active ? "page" : false}>
              <FontAwesomeIcon icon={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <button
          ref={menuButtonRef}
          type="button"
          className="tabbar__item"
          aria-haspopup="dialog"
          aria-expanded={Boolean(open)}
          aria-current={location.pathname === "/conta" ? "page" : undefined}
          onClick={(event) => (onOpenMenu ? onOpenMenu(event.currentTarget) : setLocalMenu(true))}
        >
          <FontAwesomeIcon icon={faUser} aria-hidden="true" />
          <span>{t("common.shell.account")}</span>
        </button>
      </nav>
      {!onOpenMenu && <AccountMenu open={localMenu} onClose={closeLocalMenu} />}
    </>
  );
}
