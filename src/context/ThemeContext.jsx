import { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context';

// Mesma chave das versões anteriores: "true" = escuro, "false" = claro.
// Ausente = segue o sistema (prefers-color-scheme). O script de index.html
// lê esta chave antes da primeira pintura para não piscar.
const STORAGE_KEY = 'mova:tema-escuro:v2';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return 'dark';
    if (stored === 'false') return 'light';
  } catch {
    // Storage bloqueado: segue o sistema.
  }
  return 'system';
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event) => setSystemDark(event.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Congela transições durante a troca: sem isso cor e fundo animam em
    // tempos diferentes e o texto some por um instante.
    root.setAttribute('data-theme-switching', '');
    const frame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => root.removeAttribute('data-theme-switching')),
    );

    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);

    try {
      if (preference === 'system') window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(preference === 'dark'));
    } catch {
      // Persistência é conveniência; a troca em tela continua.
    }

    return () => window.cancelAnimationFrame(frame);
  }, [preference]);

  const value = useMemo(() => {
    const temaEscuro = preference === 'dark' || (preference === 'system' && systemDark);
    return {
      preference,
      setPreference,
      temaEscuro,
      setTemaEscuro: (dark) => setPreference(dark ? 'dark' : 'light'),
      toggleTemaEscuro: () => setPreference(temaEscuro ? 'light' : 'dark'),
    };
  }, [preference, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
