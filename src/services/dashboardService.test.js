import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAvaliacaoDashboard, getFinanceiro, getFrota, getReservas, getUtilizacao } from "./dashboardService";
import { apiRequest } from "./apiClient";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));
vi.mock("./authSession", () => ({ getAuthSession: () => ({ token: "token-teste" }) }));

describe("dashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({ result: { ok: true } });
  });

  it("consulta as fontes reais do dashboard", async () => {
    await getFinanceiro();
    await getUtilizacao();
    await getFrota();
    await getReservas({ status: "CONFIRMADA", page: 2, limit: 10 });
    expect(apiRequest).toHaveBeenNthCalledWith(1, "/dashboard/financeiro", { authToken: "token-teste" });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/dashboard/utilizacao", { authToken: "token-teste" });
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/dashboard/frota", { authToken: "token-teste" });
    expect(apiRequest).toHaveBeenNthCalledWith(4, "/dashboard/reservas?status=CONFIRMADA&page=2&limit=10", { authToken: "token-teste" });
  });

  it("envia apenas filtros de avaliação preenchidos", async () => {
    await getAvaliacaoDashboard({ dataInicio: "2026-01-01", idVeiculo: "veiculo 1", notaMin: "4", dataFim: "" });
    expect(apiRequest).toHaveBeenCalledWith(
      "/avaliacao/relatorio?dataInicio=2026-01-01&idVeiculo=veiculo+1&notaMin=4",
      { authToken: "token-teste" },
    );
  });
});
