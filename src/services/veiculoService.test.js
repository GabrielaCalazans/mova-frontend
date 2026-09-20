import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import { listFrota } from "./veiculoService";

describe("listFrota", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locador" });
  });

  it("usa contrato de gestão, sem enviar idLocador arbitrário", async () => {
    apiRequestPaginado.mockResolvedValue([
      {
        id: "veiculo-1",
        idLocador: "locador-1",
        status: "MANUTENCAO",
        modeloVeiculo: { marca: "Fiat", modelo: "Argo", ano: 2025 },
      },
    ]);

    await expect(listFrota()).resolves.toEqual([
      expect.objectContaining({ id: "veiculo-1", status: "MANUTENCAO", marca: "Fiat" }),
    ]);
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/veiculo/meus",
      { authToken: "jwt-locador" },
    );
  });
});
