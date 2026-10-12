import { useEffect, useId, useRef } from "react";
import { LOCALES, changeLocale, t, useLocale } from "../../i18n";

// Trocar o idioma remonta a árvore (App.jsx: key={locale}) e o select some com o foco.
// Guarda qual seletor estava em uso para devolver o foco ao equivalente remontado (Task 11.2).
let focoPendente = null;

export default function LanguageSelect({ labeled = false, className = "" }) {
  const id = useId();
  const locale = useLocale();
  const ref = useRef(null);

  useEffect(() => {
    if (!focoPendente) return undefined;
    // Depois do foco no conteúdo feito pela troca de rota (FocusOnRouteChange, também em rAF).
    const frame = window.requestAnimationFrame(() => {
      if (!focoPendente || Date.now() > focoPendente.ate) { focoPendente = null; return; }
      if (document.querySelectorAll(".langselect__control")[focoPendente.indice] === ref.current) {
        focoPendente = null;
        ref.current.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function trocar(event) {
    focoPendente = { indice: [...document.querySelectorAll(".langselect__control")].indexOf(event.target), ate: Date.now() + 2000 };
    changeLocale(event.target.value);
  }

  return (
    <span className={`langselect${labeled ? " langselect--labeled" : ""} ${className}`.trim()}>
      <label htmlFor={id} className={labeled ? "field__label" : "sr-only"}>{t("common.language.label")}</label>
      <select ref={ref} id={id} className="langselect__control" value={locale} onChange={trocar}>
        {Object.entries(LOCALES).map(([value, { label, html }]) => (
          <option key={value} value={value} lang={html} aria-label={labeled ? undefined : label} title={labeled ? undefined : label}>
            {labeled ? label : value.slice(0, 2).toUpperCase()}
          </option>
        ))}
      </select>
    </span>
  );
}
