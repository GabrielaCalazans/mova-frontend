import { beforeEach, describe, expect, it } from "vitest";

import { clearAuthSession, getAuthSession, saveAuthSession } from "./authSession";

describe("authSession", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persiste e lê a sessão e consegue limpá-la", () => {
    const session = { token: "jwt-token", user: { id: "conta-1" } };

    saveAuthSession(session);
    expect(getAuthSession()).toEqual(session);

    clearAuthSession();
    expect(getAuthSession()).toBeNull();
  });

  it("ignora conteúdo inválido sem lançar erro", () => {
    window.localStorage.setItem("mova_auth_session", "{invalido");

    expect(getAuthSession()).toBeNull();
  });
});
