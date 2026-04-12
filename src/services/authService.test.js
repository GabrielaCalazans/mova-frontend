import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, isApiConfigured } from "./apiClient";
import { getAuthSession, saveAuthSession } from "./authSession";
import {
  fetchCurrentUserProfile,
  loginUser,
  registerLocador,
  updateUserProfile,
} from "./authService";

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

  it("cadastra locador vinculando conta e empresa separadamente", async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        result: {
          id: "conta-locador-1",
          nome: "Maria Silva",
          email: "maria@empresa.com",
        },
      })
      .mockResolvedValueOnce({
        result: {
          id: "locador-1",
          empresa: "Empresa Silva LTDA",
          cnpj: "12345678000199",
        },
      });

    const result = await registerLocador({
      name: "Maria Silva",
      email: "maria@empresa.com",
      celphone: "(11) 99999-8888",
      empresa: "Empresa Silva LTDA",
      cnpj: "12.345.678/0001-99",
      password: "Senha12345",
    });

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/conta/auth/register", {
      method: "POST",
      body: JSON.stringify({
        nome: "Maria Silva",
        email: "maria@empresa.com",
        telefone: "11999998888",
        senha: "Senha12345",
      }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/locador", {
      method: "POST",
      body: JSON.stringify({
        id: "conta-locador-1",
        empresa: "Empresa Silva LTDA",
        cnpj: "12345678000199",
      }),
    });
    expect(result.message).toBe("Cadastro de locador realizado com sucesso.");
  });
});

describe("updateUserProfile two-step flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isApiConfiguredMock.mockReturnValue(true);
    getAuthSessionMock.mockReturnValue({
      token: "token-123",
      user: {
        id: "conta-1",
        accountId: "conta-1",
        profileId: "perfil-1",
        profileType: "locatario",
      },
    });
  });

  it("executa PUT de conta e PUT de locatario com profileId da sessao", async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        result: {
          id: "conta-1",
          nome: "Nome Atualizado",
          email: "user@mova.com",
          telefone: "11988887777",
        },
      })
      .mockResolvedValueOnce({
        result: {
          ok: true,
        },
      });

    const result = await updateUserProfile({
      id: "conta-1",
      name: "Nome Atualizado",
      email: "user@mova.com",
      celphone: "(11) 98888-7777",
      profileType: "locatario",
      cpf: "123.456.789-09",
      cnh: "12345678909",
      empresa: "",
      cnpj: "",
      address: "Rua A",
      cep: "00000-000",
    });

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/conta/auth/update-profile", {
      method: "PUT",
      authToken: "token-123",
      body: JSON.stringify({
        nome: "Nome Atualizado",
        email: "user@mova.com",
        telefone: "11988887777",
        endereco: "Rua A",
        cep: "00000000",
      }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/locatario/perfil-1", {
      method: "PUT",
      authToken: "token-123",
      body: JSON.stringify({
        cnh: "12345678909",
        cpf: "12345678909",
      }),
    });
    expect(result.message).toBe("Dados atualizados com sucesso.");
    expect(saveAuthSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "token-123",
        user: expect.objectContaining({
          id: "conta-1",
          accountId: "conta-1",
          profileId: "perfil-1",
          profileType: "locatario",
        }),
      })
    );
  });

  it("nao executa segunda chamada quando update da conta falha", async () => {
    apiRequestMock.mockRejectedValueOnce(new Error("Falha na conta"));

    await expect(
      updateUserProfile({
        id: "conta-1",
        name: "Nome Atualizado",
        email: "user@mova.com",
        celphone: "(11) 98888-7777",
        profileType: "locatario",
        cpf: "123.456.789-09",
        cnh: "12345678909",
      })
    ).rejects.toThrow("Falha na conta");

    expect(apiRequestMock).toHaveBeenCalledTimes(1);
  });

  it("retorna erro especifico quando a etapa de perfil falha", async () => {
    apiRequestMock
      .mockResolvedValueOnce({
        result: {
          id: "conta-1",
          nome: "Nome Atualizado",
          email: "user@mova.com",
          telefone: "11988887777",
        },
      })
      .mockRejectedValueOnce(new Error("Falha na entidade locatario"));

    await expect(
      updateUserProfile({
        id: "conta-1",
        name: "Nome Atualizado",
        email: "user@mova.com",
        celphone: "(11) 98888-7777",
        profileType: "locatario",
        cpf: "123.456.789-09",
        cnh: "12345678909",
      })
    ).rejects.toThrow("Dados da conta atualizados, mas falha ao atualizar dados de perfil.");

    expect(apiRequestMock).toHaveBeenCalledTimes(2);
  });

  it("resolve profileId via /conta/auth/me quando sessao antiga nao possui profileId", async () => {
    getAuthSessionMock.mockReturnValue({
      token: "token-legacy",
      user: {
        id: "conta-legacy",
        accountId: "conta-legacy",
        profileType: "locatario",
      },
    });

    apiRequestMock
      .mockResolvedValueOnce({
        result: {
          id: "conta-legacy",
          nome: "Usuario Legacy",
          email: "legacy@mova.com",
          telefone: "11977776666",
          locador: null,
          locatario: {
            id: "perfil-legacy",
            cpf: "12345678909",
            cnh: "12345678909",
          },
        },
      })
      .mockResolvedValueOnce({
        result: {
          id: "conta-legacy",
          nome: "Usuario Legacy Atualizado",
          email: "legacy@mova.com",
          telefone: "11977776666",
        },
      })
      .mockResolvedValueOnce({
        result: {
          ok: true,
        },
      });

    await updateUserProfile({
      id: "conta-legacy",
      name: "Usuario Legacy Atualizado",
      email: "legacy@mova.com",
      celphone: "(11) 97777-6666",
      profileType: "locatario",
      cpf: "123.456.789-09",
      cnh: "12345678909",
    });

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/conta/auth/me", {
      method: "GET",
      authToken: "token-legacy",
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/conta/auth/update-profile", {
      method: "PUT",
      authToken: "token-legacy",
      body: JSON.stringify({
        nome: "Usuario Legacy Atualizado",
        email: "legacy@mova.com",
        telefone: "11977776666",
        endereco: "",
        cep: "",
      }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/locatario/perfil-legacy", {
      method: "PUT",
      authToken: "token-legacy",
      body: JSON.stringify({
        cnh: "12345678909",
        cpf: "12345678909",
      }),
    });
  });

  it("retorna erro de sessao expirada quando nao ha token", async () => {
    getAuthSessionMock.mockReturnValue({
      token: null,
      user: {
        id: "conta-1",
        accountId: "conta-1",
        profileId: "perfil-1",
        profileType: "locatario",
      },
    });

    await expect(
      updateUserProfile({
        id: "conta-1",
        name: "Nome Atualizado",
        email: "user@mova.com",
        celphone: "(11) 98888-7777",
        profileType: "locatario",
        cpf: "123.456.789-09",
        cnh: "12345678909",
      })
    ).rejects.toThrow("Sessao expirada. Faca login novamente.");

    expect(apiRequestMock).not.toHaveBeenCalled();
  });
});

