import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { saveAuthSession } from "../services/authSession";

vi.mock("../services/favoritoService", () => ({
  listarFavoritos: vi.fn().mockResolvedValue([]),
  favoritar: vi.fn(),
  desfavoritar: vi.fn(),
}));
vi.mock("../services/interesseService", () => ({
  listarInteresses: vi.fn().mockResolvedValue([]),
  registrarInteresse: vi.fn(),
  cancelarInteresse: vi.fn(),
}));

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
  normalizeVeiculo: (veiculo) => veiculo,
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

  it("abre Carros Disponíveis para o locatário (favoritos/avisos são do locatário)", async () => {
    saveAuthSession({ token: "token-fake", user: { id: "1", name: "Cliente", cargo: "LOCATARIO" } });
    window.history.pushState({}, "", "/carros/disponiveis");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /carros disponíveis/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/carros/disponiveis");
  });
});
