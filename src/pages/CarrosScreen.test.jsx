import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CarrosScreen from "./CarrosScreen";
import { listVeiculos } from "../services/veiculoService";

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: null }),
  useNavigate: () => vi.fn(),
}));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/veiculoService", () => ({ listVeiculos: vi.fn() }));
vi.mock("../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));

const veiculo = (id, garagem) => ({
  id,
  idLocador: "locador-1",
  idModeloVeiculo: "modelo-1",
  garagemId: garagem?.id ?? null,
  garagem,
  marca: "Fiat",
  modelo: "Argo",
  ano: 2025,
  cambio: "Manual",
  valorDiaria: 180.5,
  status: "DISPONIVEL",
});

describe("CarrosScreen", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra a garagem real de cada veículo, inclusive para o mesmo modelo", async () => {
    listVeiculos.mockResolvedValue([
      veiculo("veiculo-1", { id: "garagem-1", nome: "Garagem Norte" }),
      veiculo("veiculo-2", { id: "garagem-2", nome: "Garagem Sul" }),
    ]);

    render(<CarrosScreen />);

    const specWithText = (text) => (_, element) => (
      element?.matches("p.carro-list-card__specs") && element.textContent?.includes(text)
    );
    expect(await screen.findByText(specWithText("Local: Garagem Norte"))).toBeInTheDocument();
    expect(screen.getByText(specWithText("Local: Garagem Sul"))).toBeInTheDocument();
    expect(listVeiculos).toHaveBeenCalledTimes(1);
  });

  it("não inventa uma garagem para veículo não alocado", async () => {
    listVeiculos.mockResolvedValue([veiculo("veiculo-sem-garagem", null)]);

    render(<CarrosScreen />);

    expect(await screen.findByText((_, element) => (
      element?.matches("p.carro-list-card__specs") && element.textContent?.includes("Local: Local não informado")
    ))).toBeInTheDocument();
  });
});
