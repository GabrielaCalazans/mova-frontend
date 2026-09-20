import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import {
  cancelarInteresse,
  listarNotificacoes,
  listarVeiculosParaInteresse,
  registrarInteresse,
} from "./interesseService";

describe("interesseService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locatario" });
    apiRequestPaginado.mockResolvedValue([]);
    apiRequest.mockResolvedValue({ result: [] });
  });

  it("consulta descoberta de veículos indisponíveis no endpoint real", async () => {
    await listarVeiculosParaInteresse();
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/interesse/veiculos",
      { authToken: "jwt-locatario" },
    );
  });

  it("consulta notificações persistidas no endpoint real", async () => {
    await listarNotificacoes();
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/interesse/notificacoes",
      { authToken: "jwt-locatario" },
    );
  });

  it("registra interesse no POST real e cancela no DELETE real", async () => {
    await registrarInteresse("veiculo-1");
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/interesse", {
      method: "POST",
      authToken: "jwt-locatario",
      body: JSON.stringify({ idVeiculo: "veiculo-1" }),
    });

    await cancelarInteresse("veiculo-1");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/interesse/veiculo/veiculo-1", {
      method: "DELETE",
      authToken: "jwt-locatario",
    });
  });
});
