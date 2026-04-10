import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, isApiConfigured } from "./apiClient";
import { getAuthSession, saveAuthSession } from "./authSession";
import { fetchCurrentUserProfile, loginUser } from "./authService";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  isApiConfigured: vi.fn(),
}));

vi.mock("./authSession", () => ({
  clearAuthSession: vi.fn(),
  getAuthSession: vi.fn(),
  saveAuthSession: vi.fn(),
}));

const apiRequestMock = apiRequest;
const isApiConfiguredMock = isApiConfigured;
const getAuthSessionMock = getAuthSession;
const saveAuthSessionMock = saveAuthSession;

describe("authService profile flow via /conta/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isApiConfiguredMock.mockReturnValue(true);
    getAuthSessionMock.mockReturnValue(null);
  });

  it("classifica locatario a partir de result.locatario", async () => {
    apiRequestMock.mockResolvedValueOnce({
      result: {
        id: "422285e6-3451-4f26-b3b8-274e612f4d47",
        nome: "Shin Ryujin",
        email: "shin.ryujin@kr.com",
        telefone: null,
        locador: null,
        locatario: {
          id: "422285e6-3451-4f26-b3b8-274e612f4d47",
          cpf: "12345678909",
          cnh: "12345678909",
        },
      },
    });

    const user = await fetchCurrentUserProfile({
      authToken: "token-locatario",
      persistToSession: true,
    });

    expect(apiRequestMock).toHaveBeenCalledWith("/conta/auth/me", {
      method: "GET",
      authToken: "token-locatario",
    });
    expect(user.profileType).toBe("locatario");
    expect(user.cpf).toBe("12345678909");
    expect(user.cnh).toBe("12345678909");
    expect(saveAuthSessionMock).toHaveBeenCalledWith({
      token: "token-locatario",
      user,
    });
  });

  it("faz login e persiste perfil locador vindo de /me", async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        result: {
          token: "token-locador",
        },
      })
      .mockResolvedValueOnce({
        result: {
          id: "abc-id",
          nome: "Empresa XPTO",
          email: "empresa@xpto.com",
          telefone: "11999998888",
          locador: {
            id: "abc-id",
            empresa: "Empresa XPTO",
            cnpj: "12345678000199",
          },
          locatario: null,
        },
      });

    const result = await loginUser({
      email: "empresa@xpto.com",
      senha: "Senha12345",
    });

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/conta/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "empresa@xpto.com", senha: "Senha12345" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/conta/auth/me", {
      method: "GET",
      authToken: "token-locador",
    });
    expect(result.user.profileType).toBe("locador");
    expect(result.user.empresa).toBe("Empresa XPTO");
    expect(result.user.cnpj).toBe("12345678000199");
    expect(saveAuthSessionMock).toHaveBeenCalledWith({
      token: "token-locador",
      user: result.user,
    });
  });
});

