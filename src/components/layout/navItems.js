import { faCalendarCheck, faCarSide, faHeart, faHouse } from "@fortawesome/free-solid-svg-icons";
import { t } from "../../i18n";

/**
 * Fonte única dos destinos do locatário (tab bar no mobile, barra superior no
 * desktop). "Alugar" só aparece com reserva ativa real (WIREFRAME-SPEC 1.1).
 */
export function renterNavItems(activeReservation) {
  return [
    { key: "home", icon: faHouse, route: "/", label: t("common.nav.home"), end: true, match: ["/", "/home"] },
    ...(activeReservation ? [{ key: "alugar", icon: faCarSide, route: "/carros", label: t("common.nav.rent") }] : []),
    { key: "historico", icon: faCalendarCheck, route: "/historico", label: t("common.nav.reservations") },
    { key: "favoritos", icon: faHeart, route: "/carros/favoritos", label: t("common.nav.favorites") },
  ];
}

export function isNavItemActive(item, pathname) {
  if (item.match) return item.match.includes(pathname);
  return pathname === item.route || pathname.startsWith(`${item.route}/`);
}
