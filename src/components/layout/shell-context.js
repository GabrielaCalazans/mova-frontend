import { createContext, useContext } from "react";

/**
 * Presente quando a rota já está dentro do AppShell. Componentes legados que
 * desenhavam o próprio cabeçalho/menu inferior (PublicAppShell, BottomNav,
 * TopBar, AuthLayout) leem isto para não duplicar a navegação. Fora do shell
 * (testes de página isolada) eles seguem funcionando como antes.
 */
export const ShellContext = createContext(null);

export function useShell() {
  return useContext(ShellContext);
}
