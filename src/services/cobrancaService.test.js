import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));
vi.mock("./authSession", () => ({ getAuthSession: vi.fn() }));

import { apiRequest } from "./apiClient";
import { getAuthSession } from "./authSession";
import { listarCobrancasPendentes, pagarCobranca } from "./cobrancaService";

describe("cobrancaService — contrato financeiro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSession.mockReturnValue({ token: "token-locatario" });
  });

  it("lista pendências no endpoint real com autenticação", async () => {
    apiRequest.mockResolvedValue({ result: [{ id: "cobranca-1" }] });

    await expect(listarCobrancasPendentes()).resolves.toEqual([{ id: "cobranca-1" }]);
    expect(apiRequest).toHaveBeenCalledWith("/cobranca/pendentes", {
      authToken: "token-locatario",
    });
  });

  it("paga cobrança no endpoint real, usando POST e body do sandbox", async () => {
    apiRequest.mockResolvedValue({ result: { id: "cobranca-1", statusPagamento: "SUCESSO" } });

    await expect(pagarCobranca("cobranca-1", { metodoPagamento: "PIX" })).resolves.toEqual({
      id: "cobranca-1",
      statusPagamento: "SUCESSO",
    });
    expect(apiRequest).toHaveBeenCalledWith("/cobranca/cobranca-1/pagamento", {
      method: "POST",
      body: JSON.stringify({ metodoPagamento: "PIX" }),
      authToken: "token-locatario",
    });
  });

  it("propaga erro do backend sem fabricar estado financeiro", async () => {
    const erro = new Error("Cobrança não encontrada");
    apiRequest.mockRejectedValue(erro);
    await expect(pagarCobranca("ausente")).rejects.toBe(erro);
  });
});
