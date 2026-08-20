import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

const STORAGE_KEY = 'mova:tema-escuro:v2';

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }

  // Modo claro é o padrão do app, independente da preferência do sistema.
  return false;
}

export function ThemeProvider({ children }) {
  const [temaEscuro, setTemaEscuro] = useState(getInitialDarkMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', temaEscuro ? 'dark' : 'light');
    window.localStorage.setItem(STORAGE_KEY, String(temaEscuro));
  }, [temaEscuro]);

  function toggleTemaEscuro() {
    setTemaEscuro((prev) => !prev);
  }

  const value = { temaEscuro, setTemaEscuro, toggleTemaEscuro };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
