// Task 11.3 (NVDA + Chrome): a região de status do catálogo junta duas partes visualmente separadas pelo CSS.
// Sem espaço no texto, o NVDA lia "6 veículos disponíveisCategoria Econômicos".
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/veiculoService", () => ({ listVeiculos: vi.fn(() => Promise.resolve([])) }));
vi.mock("../components/layout/PublicAppShell", () => ({ default: ({ children }) => <>{children}</> }));

import Home from "./Home";

describe("Home — região de status do resultado", () => {
  it("separa a contagem e a categoria por espaço no texto lido pelo leitor de tela", async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    const status = await screen.findByRole("status");
    await screen.findByText("Todas as categorias");
    expect(status.textContent.replace(/\s+/g, " ").trim()).toBe("0 veículos disponíveis Todas as categorias");
  });
});
