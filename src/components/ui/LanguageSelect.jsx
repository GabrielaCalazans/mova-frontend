import { useId } from "react";
import { LOCALES, changeLocale, t, useLocale } from "../../i18n";

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
