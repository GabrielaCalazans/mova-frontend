import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";
import { getReservationPricing } from "./reservationPricing";

describe("reservationPricing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getAuthSession.mockReturnValue({ token: "token-de-teste" });
  });

  it("consulta a cotação calculada pela API e normaliza a resposta", async () => {
    apiRequest.mockResolvedValue({
      result: {
        valorDiaria: 125.25,
        diarias: 3,
        valorBase: 375.75,
        valorServicos: 49.9,
        valorTotal: 425.65,
        servicos: [{ idServico: "servico-1", valor: 49.9 }],
      },
    });
    const payload = {
      idVeiculo: "veiculo-1",
      idLocatario: "locatario-1",
      dataHoraInicio: "2027-01-10T10:00:00.000Z",
      dataHoraFim: "2027-01-12T10:00:00.000Z",
      servicosIds: ["servico-1"],
    };

    await expect(getReservationPricing(payload)).resolves.toEqual({
      dailyRate: 125.25,
      totalDiarias: 3,
      subtotal: 375.75,
      servicesTotal: 49.9,
      total: 425.65,
      servicos: [{ idServico: "servico-1", valor: 49.9 }],
    });
    expect(apiRequest).toHaveBeenCalledWith("/reserva/precificacao", {
      method: "POST",
      authToken: "token-de-teste",
      body: JSON.stringify(payload),
    });
  });
});
