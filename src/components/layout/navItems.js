import { faCalendarCheck, faCarSide, faHeart, faHouse } from "@fortawesome/free-solid-svg-icons";

/**
 * Fonte única dos destinos do locatário (tab bar no mobile, barra superior no
 * desktop). "Alugar" só aparece com reserva ativa real (WIREFRAME-SPEC 1.1).
 */
export function renterNavItems(activeReservation) {
  return [
    { key: "home", icon: faHouse, route: "/", label: "Início", end: true, match: ["/", "/home"] },
    ...(activeReservation ? [{ key: "alugar", icon: faCarSide, route: "/carros", label: "Alugar" }] : []),
    { key: "historico", icon: faCalendarCheck, route: "/historico", label: "Reservas" },
    { key: "favoritos", icon: faHeart, route: "/carros/favoritos", label: "Favoritos" },
  ];
}

export function isNavItemActive(item, pathname) {
  if (item.match) return item.match.includes(pathname);
  return pathname === item.route || pathname.startsWith(`${item.route}/`);
}
