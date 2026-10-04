import { useId } from "react";
import { LOCALES, changeLocale, t, useLocale } from "../../i18n";

/**
 * Seletor de idioma nativo (teclado, leitor de tela e mobile de graça).
 * Cada opção aparece no próprio idioma; `lang` na opção ajuda a pronúncia.
 * `labeled` mostra o rótulo visível (Configurações e menu de conta); sem ele,
 * o controle é compacto (cabeçalho): sigla visível, nome completo como nome
 * acessível da opção.
 */
export default function LanguageSelect({ labeled = false, className = "" }) {
  const id = useId();
  const locale = useLocale();
  return (
    <span className={`langselect${labeled ? " langselect--labeled" : ""} ${className}`.trim()}>
      <label htmlFor={id} className={labeled ? "field__label" : "sr-only"}>{t("common.language.label")}</label>
      <select id={id} className="langselect__control" value={locale} onChange={(event) => changeLocale(event.target.value)}>
        {Object.entries(LOCALES).map(([value, { label, html }]) => (
          <option key={value} value={value} lang={html} aria-label={labeled ? undefined : label} title={labeled ? undefined : label}>
            {labeled ? label : value.slice(0, 2).toUpperCase()}
          </option>
        ))}
      </select>
    </span>
  );
}
