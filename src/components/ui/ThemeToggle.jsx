import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/useTheme";
import { t } from "../../i18n";

const OPTIONS = [
  { value: "system", icon: faDesktop },
  { value: "light", icon: faSun },
  { value: "dark", icon: faMoon },
];

export default function ThemeToggle({ labeled = false }) {
  const { preference, setPreference } = useTheme();
  const refs = useRef({});

  function move(step) {
    const index = OPTIONS.findIndex((option) => option.value === preference);
    const next = OPTIONS[(index + step + OPTIONS.length) % OPTIONS.length].value;
    setPreference(next);
    window.requestAnimationFrame(() => refs.current[next]?.focus());
  }

  function onKeyDown(event) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(-1); }
  }

  return (
    <div className={`themetoggle${labeled ? " themetoggle--labeled" : ""}`} role="radiogroup" aria-label={t("common.theme.group")}>
      {OPTIONS.map((option) => {
        const checked = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            ref={(node) => { refs.current[option.value] = node; }}
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="themetoggle__opt"
            onKeyDown={onKeyDown}
            onClick={() => setPreference(option.value)}
          >
            <FontAwesomeIcon icon={option.icon} aria-hidden="true" />
            <span className={labeled ? undefined : "sr-only"}>{t(`common.theme.${option.value}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
