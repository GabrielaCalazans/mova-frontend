import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/useTheme";

const OPTIONS = [
  { value: "system", label: "Sistema", icon: faDesktop },
  { value: "light", label: "Claro", icon: faSun },
  { value: "dark", label: "Escuro", icon: faMoon },
];

/**
 * Três posições em radiogroup (setas trocam a opção). Cada opção tem ícone e
 * nome acessível; a ativa é marcada por aria-checked, não só por cor.
 * `labeled` mostra o nome ao lado do ícone (menu de conta e Configurações).
 */
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
    <div className={`themetoggle${labeled ? " themetoggle--labeled" : ""}`} role="radiogroup" aria-label="Tema da interface">
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
            <span className={labeled ? undefined : "sr-only"}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
