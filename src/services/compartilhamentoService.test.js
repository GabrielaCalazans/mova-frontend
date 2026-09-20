import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({ apiRequest: vi.fn() }));

import { apiRequest } from "./apiClient";
import { getCompartilhamentoPublico } from "./compartilhamentoService";

describe("compartilhamentoService", () => {
  beforeEach(() => vi.resetAllMocks());

  it("consulta o endpoint público sem header de autenticação", async () => {
    apiRequest.mockResolvedValue({ result: { viagem: { status: "CONFIRMADA" } } });

    await expect(getCompartilhamentoPublico("A".repeat(43))).resolves.toEqual({
      viagem: { status: "CONFIRMADA" },
    });
    expect(apiRequest).toHaveBeenCalledWith(`/compartilhamento/${"A".repeat(43)}`);
  });

  it("rejeita token ausente", async () => {
    await expect(getCompartilhamentoPublico("")).rejects.toThrow(/token/i);
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
