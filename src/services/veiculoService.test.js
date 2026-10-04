import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest, apiRequestPaginado } from "./apiClient";
import { getAuthSession } from "./authSession";
import { listFrota, listVeiculos, updateVeiculo, uploadImagemVeiculo, reorderImagensVeiculo } from "./veiculoService";

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

describe("imagens de veículo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "jwt-locador" });
    apiRequest.mockResolvedValue({ result: [{ id: "imagem-1", status: "READY" }] });
  });

  it("envia bytes e MIME declarado ao endpoint autenticado", async () => {
    const file = new File(["bytes"], "carro.png", { type: "image/png" });
    await uploadImagemVeiculo("veiculo-1", file, "Frente");
    expect(apiRequest).toHaveBeenCalledWith("/veiculo/veiculo-1/imagens", {
      method: "POST",
      authToken: "jwt-locador",
      body: file,
      contentType: "image/png",
      headers: { "X-Image-Alt": "Frente" },
    });
  });

  it("reordena pelo contrato do servidor", async () => {
    await reorderImagensVeiculo("veiculo-1", ["imagem-1"]);
    expect(apiRequest).toHaveBeenCalledWith("/veiculo/veiculo-1/imagens/ordem", {
      method: "PUT",
      authToken: "jwt-locador",
      body: JSON.stringify({ imagemIds: ["imagem-1"] }),
    });
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
    [{ pcd: true }, "/veiculo?pcd=true"],
  ])("mapeia o filtro %o para o contrato real", async (filtros, endpoint) => {
    await listVeiculos(filtros);
    expect(apiRequestPaginado).toHaveBeenCalledWith(endpoint, { authToken: undefined });
  });

  it("consulta o catálogo público sem enviar credencial de locatário", async () => {
    await listVeiculos();
    expect(apiRequestPaginado).toHaveBeenCalledWith("/veiculo", {
      authToken: undefined,
    });
  });

  it("mantém combinação de filtros por interseção", async () => {
    await listVeiculos({ categoria: "EXECUTIVO", cambio: "Automatico", eletrico: true, capacidade: 5 });
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/veiculo?cambio=Automatico&capacidade=5&eletrico=true&categoria=EXECUTIVO",
      { authToken: undefined },
    );
  });

  it("combina o predicado PCD com filtros independentes", async () => {
    await listVeiculos({ pcd: true, eletrico: true, capacidade: 5 });
    expect(apiRequestPaginado).toHaveBeenCalledWith(
      "/veiculo?capacidade=5&eletrico=true&pcd=true",
      { authToken: undefined },
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
