import { useLocation } from "react-router-dom";
import ActiveReservationCard from "../ActiveReservationCard";
import AppShell from "./AppShell";
import { useShell } from "./shell-context";

function PublicContent({ children }) {
  const shell = useShell();
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/home";
  const activity = shell?.activity;

  return (
    <main className="public-main">
      {isHome && activity?.reservation && <ActiveReservationCard reservation={activity.reservation} />}
      {isHome && activity?.error && <p className="alert alert--warning public-home__message" role="status">A reserva ativa está indisponível no momento.</p>}
      {children}
    </main>
  );
}

/**
 * Conteúdo público (Home e detalhe). Dentro das rotas o AppShell já existe;
 * renderizada isolada (testes de página), cria o próprio shell.
 */
export default function PublicAppShell({ children }) {
  const shell = useShell();
  const content = <PublicContent>{children}</PublicContent>;
  return shell ? content : <AppShell>{content}</AppShell>;
}
