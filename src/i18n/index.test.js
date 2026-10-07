import { afterEach, describe, expect, it, vi } from "vitest";
import { formatCurrency, formatDate, getLocale, intlLocale, setLocale, t } from "./index";

// Tira uma chave do dicionário em inglês para provar o fallback para pt-BR.
vi.mock("./locales/en/common.json", async (importOriginal) => {
  const real = await importOriginal();
  const base = real.default ?? real;
  return { default: { ...base, language: { label: base.language.label } } };
});

afterEach(() => setLocale("pt-BR"));

describe("i18n", () => {
  it("começa em pt-BR", () => {
    expect(getLocale()).toBe("pt-BR");
    expect(intlLocale()).toBe("pt-BR");
    expect(t("common.nav.home")).toBe("Início");
  });

  it("cai para pt-BR quando falta a chave no idioma ativo, e para a própria chave quando falta em todos", async () => {
    vi.resetModules();
    const i18n = await import("./index.js");
    await i18n.loadLocale("en");
    i18n.setLocale("en");
    expect(i18n.t("common.language.label")).toBe("Language");
    expect(i18n.t("common.language.hint")).toBe("O idioma escolhido fica salvo neste navegador.");
    expect(i18n.t("common.nao.existe")).toBe("common.nao.existe");
    i18n.setLocale("pt-BR");
  });

  it("interpola variáveis", () => {
    expect(t("errors.apiHttp", { status: 503 })).toBe("Erro ao comunicar com a API (HTTP 503).");
    setLocale("es");
    expect(t("common.vehicle.addFavorite", { name: "Fiat Argo" })).toBe("Añadir Fiat Argo a favoritos");
  });

  it("escolhe a forma plural pelo idioma", () => {
    expect(t("common.vehicle.seats", { count: 1 })).toBe("1 lugar");
    expect(t("common.vehicle.seats", { count: 5 })).toBe("5 lugares");
    setLocale("en");
    expect(t("common.vehicle.seats", { count: 1 })).toBe("1 seat");
    expect(t("common.vehicle.seats", { count: 5 })).toBe("5 seats");
  });

  it("formata moeda sempre em BRL, com separadores do idioma", () => {
    const currencyOf = (locale) => {
      setLocale(locale);
      return new Intl.NumberFormat(intlLocale(), { style: "currency", currency: "BRL" })
        .formatToParts(1).find((part) => part.type === "currency").value;
    };
    expect(formatCurrency(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(currencyOf("pt-BR")).toBe("R$");
    setLocale("en");
    expect(formatCurrency(1234.5)).toBe("R$1,234.50");
    expect(currencyOf("es")).toMatch(/R\$|BRL/);
    expect(formatCurrency(1234.5)).toMatch(/1\.?234,50/);
  });

  it("formata datas conforme o idioma", () => {
    const date = new Date(2026, 2, 7, 12);
    expect(formatDate(date)).toBe("07/03/2026");
    setLocale("en");
    expect(formatDate(date)).toBe("3/7/26");
    setLocale("es");
    expect(formatDate(date, { month: "long" })).toBe("marzo");
    expect(formatDate("data inválida")).toBe("");
  });
});
