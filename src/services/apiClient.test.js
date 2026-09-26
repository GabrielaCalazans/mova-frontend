import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, apiRequestPaginado } from "./apiClient";

// O apiClient não tinha nenhuma cobertura: buildUrl, o parser de erro e o
// header Authorization nunca eram exercitados. Estes testes cobrem o contrato
// de erro e o consumo de paginação.

function respostaJson(body, status = 200, responseHeaders = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) =>
        name.toLowerCase() === "content-type"
          ? "application/json"
          : responseHeaders[name.toLowerCase()] ?? null,
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const envelope = (extra) => ({
  api_version: "v1.0.0",
  timestamp: "2026-09-18T00:00:00.000Z",
  docs: "https://example.test",
  ...extra,
});

describe("apiClient — contrato de erro", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserva o status HTTP no erro lançado", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(envelope({ success: false, error: "Acesso negado" }), 403),
    );

    const erro = await apiRequest("/garagem").catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(403);
    expect(erro.isForbidden).toBe(true);
    expect(erro.isUnauthorized).toBe(false);
    expect(erro.message).toBe("Acesso negado");
  });

  it("monta mensagem legível a partir do formato de validação do backend", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(
        envelope({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Invalid Data Format",
          errors: [
            { path: ["dataHoraFim"], message: "A reserva deve ter entre 1 hora e 30 dias de duração." },
          ],
        }),
        400,
      ),
    );

    const erro = await apiRequest("/reserva", { method: "POST" }).catch((e) => e);

    expect(erro.status).toBe(400);
    expect(erro.isValidation).toBe(true);
    expect(erro.code).toBe("VALIDATION_ERROR");
    expect(erro.message).toContain("dataHoraFim");
    expect(erro.message).toContain("entre 1 hora e 30 dias");
  });

  it("usa a chave message dos erros de regra de negócio", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(
        envelope({ success: false, message: "O veículo não está disponível para reserva." }),
        409,
      ),
    );

    const erro = await apiRequest("/reserva", { method: "POST" }).catch((e) => e);
    expect(erro.status).toBe(409);
    expect(erro.message).toBe("O veículo não está disponível para reserva.");
  });

  it("mantém HTTP 404 como erro da operação da API e expõe requestId", async () => {
    const requestId = "api-operation-404";
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(
        envelope({
          code: "RESERVATION_NOT_FOUND",
          message: "Reserva n\u00e3o encontrada",
          requestId,
        }),
        404,
        { "x-request-id": requestId },
      ),
    );

    const erro = await apiRequest("/reserva/missing").catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(404);
    expect(erro.isNotFound).toBe(true);
    expect(erro.code).toBe("RESERVATION_NOT_FOUND");
    expect(erro.requestId).toBe(requestId);
    expect(erro.message).toBe("Reserva n\u00e3o encontrada");
  });

  it("não registra token da rota nem credencial nos logs de erro", async () => {
    const routeToken = "share-token-secret";
    const authToken = "bearer-client-secret";
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(envelope({ code: "NOT_FOUND", message: "Opera\u00e7\u00e3o n\u00e3o encontrada" }), 404),
    );

    await apiRequest(`/viagem/${routeToken}`, { authToken }).catch(() => {});

    const log = vi.mocked(console.error).mock.calls;
    expect(JSON.stringify(log)).not.toContain(routeToken);
    expect(JSON.stringify(log)).not.toContain(authToken);
  });

  it("falha de rede vira ApiError com status 0", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("network"));
    const erro = await apiRequest("/health").catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
  });

  it("envia Authorization quando recebe authToken", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(envelope({ result: [] })));
    globalThis.fetch = fetchMock;

    await apiRequest("/reserva", { authToken: "abc.def.ghi" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer abc.def.ghi");
  });
});

describe("apiRequestPaginado — interpreta a paginação", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("segue totalPages e junta todas as páginas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respostaJson(
          envelope({
            result: [{ id: "a" }, { id: "b" }],
            pagination: { total: 3, page: 1, limit: 2, totalPages: 2 },
          }),
        ),
      )
      .mockResolvedValueOnce(
        respostaJson(
          envelope({
            result: [{ id: "c" }],
            pagination: { total: 3, page: 2, limit: 2, totalPages: 2 },
          }),
        ),
      );
    globalThis.fetch = fetchMock;

    const itens = await apiRequestPaginado("/veiculo", {}, { limit: 2 });

    expect(itens.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("page=1&limit=2");
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=2&limit=2");
  });

  it("preserva a query já existente no caminho", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson(
        envelope({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
      ),
    );
    globalThis.fetch = fetchMock;

    await apiRequestPaginado("/veiculo?adaptado=true");

    expect(String(fetchMock.mock.calls[0][0])).toContain("/veiculo?adaptado=true&page=1");
  });

  it("lista vazia devolve array vazio, não erro", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      respostaJson(
        envelope({ result: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } }),
      ),
    );

    await expect(apiRequestPaginado("/reserva/locatario/x")).resolves.toEqual([]);
  });
});
