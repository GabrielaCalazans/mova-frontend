// Task 11.3 (NVDA + Firefox): com o seletor focado, cada seta dispara "change". Se o dicionário de um idioma
// anterior termina de carregar depois do último escolhido, ele não pode sobrescrever a escolha mais recente.
import { describe, expect, it, vi } from "vitest";

describe("changeLocale — trocas em sequência", () => {
  it("mantém o último idioma escolhido quando um carregamento anterior termina depois", async () => {
    // Módulo novo: o setupTests já carregou en/es na instância compartilhada.
    vi.resetModules();
    vi.doMock("./locales/es/common.json", async (importOriginal) => {
      await new Promise((r) => setTimeout(r, 80)); // dicionário espanhol lento (rede, leitor de tela)
      return importOriginal();
    });
    const i18n = await import("./index.js");
    await i18n.loadLocale("en");
    const lento = i18n.changeLocale("es");
    await i18n.changeLocale("en");
    await lento;
    expect(i18n.getLocale()).toBe("en");
    i18n.setLocale("pt-BR");
    vi.doUnmock("./locales/es/common.json");
  });
});
