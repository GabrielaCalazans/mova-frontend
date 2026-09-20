import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";
import {
  buildShareUrl,
  criarCompartilhamentoReserva,
  getRastreamentoReserva,
  getReservasDoLocatarioPage,
  revogarCompartilhamentoReserva,
} from "./reservaService";

describe("getReservasDoLocatarioPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "token-teste" });
  });

  it("preserva result e pagination da página retornada pela API", async () => {
    apiRequest.mockResolvedValue({
      result: [{ id: "reserva-2" }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });

    await expect(getReservasDoLocatarioPage("locatario-1", { page: 2 })).resolves.toEqual({
      reservas: [{ id: "reserva-2" }],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/reserva/locatario/locatario-1?page=2&limit=10",
      { authToken: "token-teste" },
    );
  });
});

describe("getRastreamentoReserva", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "token-teste" });
  });

  it("consulta a localização pelo identificador da reserva", async () => {
    apiRequest.mockResolvedValue({ result: { reservaId: "reserva-1", localizacao: null } });

    await expect(getRastreamentoReserva("reserva-1")).resolves.toEqual({
      reservaId: "reserva-1", localizacao: null,
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/reserva/reserva-1/localizacao",
      { authToken: "token-teste" },
    );
  });
});

describe("compartilhamento da reserva", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "token-teste" });
  });

  it("cria link pelo endpoint autenticado real sem enviar dados da reserva", async () => {
    apiRequest.mockResolvedValue({ result: { token: "A".repeat(43), urlPath: "/viagem/compartilhada/token" } });

    await expect(criarCompartilhamentoReserva("reserva-1")).resolves.toMatchObject({
      token: "A".repeat(43),
    });
    expect(apiRequest).toHaveBeenCalledWith(
      "/reserva/reserva-1/compartilhamento",
      { method: "POST", ...{ authToken: "token-teste" } },
    );
  });

  it("revoga link pelo endpoint autenticado", async () => {
    apiRequest.mockResolvedValue({});

    await expect(revogarCompartilhamentoReserva("reserva-1")).resolves.toBeUndefined();
    expect(apiRequest).toHaveBeenCalledWith(
      "/reserva/reserva-1/compartilhamento",
      { method: "DELETE", ...{ authToken: "token-teste" } },
    );
  });

  it("monta URL pública usando base configurada ou origem atual", () => {
    expect(buildShareUrl("/viagem/compartilhada/token")).toContain("/viagem/compartilhada/token");
  });
});
