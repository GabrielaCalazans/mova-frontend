import { useEffect, useState } from "react";
import { AUTH_SESSION_CHANGED_EVENT, getAuthSession } from "../services/authSession";

/** Re-renderiza guards e shells quando login, logout ou 401 revoga a sessão. */
export function useAuthSession() {
  const [session, setSession] = useState(() => getAuthSession());

  useEffect(() => {
    const refresh = () => setSession((atual) => {
      const proxima = getAuthSession();
      return JSON.stringify(atual) === JSON.stringify(proxima) ? atual : proxima;
    });
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    // A sessão pode ter mudado entre a primeira renderização e esta inscrição
    // (ex.: subárvore suspensa carregando um chunk): sincroniza ao assinar.
    refresh();
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return session;
}
