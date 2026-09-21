import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import { listFrota, listVeiculos, updateVeiculo } from "./veiculoService";

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

describe("listVeiculos — filtros do catálogo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locatario" });
    apiRequestPaginado.mockResolvedValue([]);
  });

  it.each([
    [{ categoria: "ECONOMICO" }, "/veiculo?categoria=ECONOMICO"],
    [{ categoria: "ESPACOSO" }, "/veiculo?categoria=ESPACOSO"],
    [{ categoria: "EXECUTIVO" }, "/veiculo?categoria=EXECUTIVO"],
    [{ adaptado: true }, "/veiculo?adaptado=true"],
  ])("mapeia o filtro %o para o contrato real", async (filtros, endpoint) => {
    await listVeiculos(filtros);
    expect(apiRequestPaginado).toHaveBeenCalledWith(endpoint, { authToken: "jwt-locatario" });
  });

  it("mantém combinação de filtros por interseção", async () => {
    await listVeiculos({ categoria: "EXECUTIVO", cambio: "Automatico", eletrico: true, capacidade: 5 });
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/veiculo?cambio=Automatico&capacidade=5&eletrico=true&categoria=EXECUTIVO",
      { authToken: "jwt-locatario" },
    );
  });
});

describe("updateVeiculo — contrato coordenado", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locador" });
    apiRequest.mockResolvedValue({
      result: {
        id: "veiculo-1",
        placa: "ABC1D23",
        modeloVeiculo: { marca: "Toyota", valorDiaria: 321.45 },
      },
    });
  });

  it("envia os campos de catálogo dentro de modelo no PUT", async () => {
    const payload = {
      placa: "ABC1D23",
      status: "DISPONIVEL",
      modelo: { marca: "Toyota", valorDiaria: 321.45 },
    };

    await updateVeiculo("veiculo-1", payload);

    expect(apiRequest).toHaveBeenCalledWith("/veiculo/veiculo-1", {
      method: "PUT",
      authToken: "jwt-locador",
      body: JSON.stringify(payload),
    });
  });
});
