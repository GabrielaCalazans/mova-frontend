import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiRequest: vi.fn(),
  apiRequestPaginado: vi.fn(),
}));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";
import { getRastreamentoReserva, getReservasDoLocatarioPage } from "./reservaService";

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
