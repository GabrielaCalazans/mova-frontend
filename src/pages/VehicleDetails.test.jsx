import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VehicleDetails from "./VehicleDetails";
import { getVeiculoById } from "../services/veiculoService";
import { favoritar } from "../services/favoritoService";
import { getJourneyStep } from "../utils/journeyStorage";

vi.mock("../components/layout/PublicAppShell", () => ({ default: ({ children }) => children }));
vi.mock("../services/authSession", () => ({
  getAuthSession: () => ({ token: "t", user: { id: "u1", cargo: "LOCATARIO" } }),
}));
vi.mock("../services/veiculoService", () => ({ getVeiculoById: vi.fn() }));
vi.mock("../services/garagemService", () => ({ getGaragemById: vi.fn().mockResolvedValue(null) }));
vi.mock("../services/servicoService", () => ({ listServicos: vi.fn().mockResolvedValue([]) }));
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

function veiculo(overrides = {}) {
  return {
    id: "v1",
    marca: "Fiat",
    modelo: "Argo",
    status: "DISPONIVEL",
    garagemId: "g1",
    garagem: { id: "g1", nome: "Garagem Centro", status: "ATIVA" },
    categoria: "ECONOMICO",
    adaptado: false,
    valorDiaria: 150,
    ...overrides,
  };
}

function renderDetalhe() {
  return render(
    <MemoryRouter initialEntries={["/carros/v1"]}>
      <Routes>
        <Route path="/carros/:id" element={<VehicleDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VehicleDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trata categoria PCD como veículo adaptado (mesmo predicado do backend)", async () => {
    getVeiculoById.mockResolvedValue(veiculo({ categoria: "PCD", adaptado: false }));
    renderDetalhe();

    expect(await screen.findByText("Veículo adaptado para PCD")).toBeInTheDocument();
    expect(screen.queryByText("Veículo sem adaptação PCD")).not.toBeInTheDocument();
  });

  it("mostra de forma visível o retorno ao favoritar", async () => {
    getVeiculoById.mockResolvedValue(veiculo());
    favoritar.mockResolvedValue({});
    renderDetalhe();

    const [botao] = await screen.findAllByRole("button", { name: "Adicionar aos favoritos" });
    await userEvent.click(botao);

    const feedback = await screen.findByText("Adicionado aos favoritos.");
    expect(feedback).toHaveAttribute("role", "status");
    expect(feedback).not.toHaveClass("sr-only");
  });

  it("leva a foto de capa para as etapas da jornada ao reservar", async () => {
    sessionStorage.clear();
    getVeiculoById.mockResolvedValue(veiculo({
      imagens: [
        { id: "i1", url: "http://localhost:9000/capa.png", altText: "Fiat Argo, vista lateral" },
        { id: "i2", url: "http://localhost:9000/outra.png", altText: "outra" },
      ],
    }));
    renderDetalhe();
    await userEvent.click((await screen.findAllByRole("button", { name: "Reservar este carro" }))[0]);
    expect(getJourneyStep("veiculo").imagens).toEqual([
      { url: "http://localhost:9000/capa.png", altText: "Fiat Argo, vista lateral" },
    ]);
  });
});
