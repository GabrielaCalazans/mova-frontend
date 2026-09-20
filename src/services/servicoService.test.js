import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({ apiRequestPaginado: vi.fn() }));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import { listServicos } from "./servicoService";

describe("servicoService — contrato real do catálogo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locatario" });
  });

  it("consulta GET /servico com paginação e preserva cobertura do backend", async () => {
    apiRequestPaginado.mockResolvedValue([{
        id: "seguro-1",
        nome: "Seguro adicional",
        descricao: "Proteção simulada",
        detalhesCobertura: "Danos ao veículo e furto/roubo.",
        valor: 49.9,
        ativo: true,
      }]);

    await expect(listServicos()).resolves.toEqual([expect.objectContaining({
      id: "seguro-1",
      nome: "Seguro adicional",
      descricao: "Proteção simulada",
      detalhesCobertura: "Danos ao veículo e furto/roubo.",
      valor: 49.9,
    })]);
    expect(apiRequestPaginado).toHaveBeenCalledWith("/servico", {
      authToken: "jwt-locatario",
    });
  });
});
