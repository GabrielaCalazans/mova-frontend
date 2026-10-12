import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setLocale, useLocale } from "../../i18n";
import LanguageSelect from "./LanguageSelect";

afterEach(() => {
  cleanup();
  setLocale("pt-BR");
  window.localStorage.removeItem("mova_locale");
});

describe("LanguageSelect", () => {
  it("troca o idioma, o lang do documento e persiste a escolha", async () => {
    const user = userEvent.setup();
    render(<LanguageSelect labeled />);

    const select = screen.getByLabelText("Idioma");
    expect(select).toHaveValue("pt-BR");

    await user.selectOptions(select, "en");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem("mova_locale")).toBe("en");
    expect(screen.getByLabelText("Language")).toHaveValue("en");

    await user.selectOptions(screen.getByLabelText("Language"), "es");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem("mova_locale")).toBe("es");
  });

  it("compacto mostra a sigla e mantém o rótulo acessível", () => {
    render(<LanguageSelect />);
    expect(screen.getByLabelText("Idioma")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toHaveTextContent("EN");
  });

  it("valor salvo desconhecido volta para pt-BR", async () => {
    window.localStorage.setItem("mova_locale", "klingon");
    vi.resetModules();
    const fresh = await import("../../i18n");
    expect(fresh.getLocale()).toBe("pt-BR");
    expect(document.documentElement.lang).toBe("pt-BR");
  });

  it("valor salvo válido é restaurado ao carregar", async () => {
    window.localStorage.setItem("mova_locale", "es");
    vi.resetModules();
    const fresh = await import("../../i18n");
    expect(fresh.getLocale()).toBe("es");
    fresh.setLocale("pt-BR");
  });
});

// Task 11.2 (WCAG 3.2.2/2.4.3): trocar o idioma remonta a árvore (App.jsx usa key={locale});
// o foco deve continuar no seletor, não cair no body nem no conteúdo principal.
function RemontaPorIdioma() {
  const locale = useLocale();
  return <div key={locale}><LanguageSelect /></div>;
}

describe("LanguageSelect — foco após trocar o idioma", () => {
  it("devolve o foco ao seletor remontado", async () => {
    const user = userEvent.setup();
    render(<RemontaPorIdioma />);
    await user.selectOptions(screen.getByLabelText("Idioma"), "en");
    await waitFor(() => expect(screen.getByLabelText("Language")).toHaveFocus());
  });
});
