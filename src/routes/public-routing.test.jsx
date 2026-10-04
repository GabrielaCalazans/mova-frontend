import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

vi.mock("../services/veiculoService", () => ({
  listVeiculos: vi.fn().mockResolvedValue([
    {
      id: "vehicle-public-1",
      status: "DISPONIVEL",
      garagemId: "garage-public-1",
      garagem: { id: "garage-public-1", nome: "Garagem Centro", status: "ATIVA" },
      marca: "Fiat",
      modelo: "Argo",
      ano: 2025,
      cambio: "Automático",
      capacidade: 5,
      adaptado: false,
      eletrico: false,
      categoria: "ECONOMICO",
      valorDiaria: 180,
    },
  ]),
}));

describe("entrada pública", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("mostra Home e catálogo sem sessão", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /veículos disponíveis agora/i })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /fiat argo/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^login$/i })).not.toBeInTheDocument();
  });
});
