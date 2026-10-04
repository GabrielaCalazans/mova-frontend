import { describe, expect, it } from "vitest";
import { apiRequest } from "../services/apiClient";

// Proteção de regressão (Task 8.1): a suíte unitária nunca fala com a API
// real, esteja o backend local ligado ou não.
describe("isolamento de rede dos testes unitários", () => {
  it("usa uma base de API que não resolve e não é o backend local", () => {
    expect(import.meta.env.VITE_API_BASE_URL).toBe("http://mova-api.test.invalid/api");
    expect(import.meta.env.VITE_API_BASE_URL).not.toMatch(/localhost|127\.0\.0\.1/);
  });

  it("bloqueia fetch não mockado e registra a tentativa", async () => {
    await expect(apiRequest("/veiculo")).rejects.toMatchObject({ status: 0 });
    expect(globalThis.__movaBlockedRequests).toEqual([
      { method: "GET", url: "http://mova-api.test.invalid/api/veiculo" },
    ]);
  });

  it("bloqueia XMLHttpRequest não mockado", async () => {
    const xhr = new XMLHttpRequest();
    const erro = new Promise((resolve) => { xhr.onerror = resolve; });
    xhr.open("POST", "http://localhost:3000/api/veiculo/1/imagens");
    xhr.send();
    await expect(erro).resolves.toBeInstanceOf(TypeError);
    expect(globalThis.__movaBlockedRequests.at(-1)).toEqual({ method: "POST", url: "http://localhost:3000/api/veiculo/1/imagens" });
  });
});
