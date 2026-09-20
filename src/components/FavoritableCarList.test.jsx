import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FavoritableCarList from "./FavoritableCarList";

const navigateMock = vi.hoisted(() => vi.fn());
const listarFavoritosMock = vi.hoisted(() => vi.fn());
const listarInteressesMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/veiculoService", async () => {
  const actual = await vi.importActual("../services/veiculoService");
  return { ...actual, listVeiculos: vi.fn() };
});
vi.mock("../services/favoritoService", () => ({
  listarFavoritos: listarFavoritosMock,
  favoritar: vi.fn(),
  desfavoritar: vi.fn(),
}));
vi.mock("../services/interesseService", () => ({
  listarInteresses: listarInteressesMock,
  registrarInteresse: vi.fn(),
  cancelarInteresse: vi.fn(),
}));

describe("FavoritableCarList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarInteressesMock.mockResolvedValue([]);
    listarFavoritosMock.mockResolvedValue([
      {
        id: "favorito-1",
        idVeiculo: "veiculo-1",
        veiculo: {
          id: "veiculo-1",
          idLocador: "locador-1",
          idModeloVeiculo: "modelo-1",
          modeloVeiculo: {
            id: "modelo-1",
            idLocador: "locador-1",
            marca: "Fiat",
            modelo: "Argo",
            ano: 2025,
            cambio: "Automatico",
            capacidade: 5,
            categoria: "EXECUTIVO",
            eletrico: true,
            adaptado: true,
            valorDiaria: 180,
          },
          garagemId: null,
          garagem: null,
          placa: "ABC1D23",
          status: "DISPONIVEL",
          criadoEm: "2026-09-20T00:00:00.000Z",
        },
      },
    ]);
  });

  it("uses real attributes of favorited vehicle without showing fake color", async () => {
    render(
      <FavoritableCarList
        title="Carros Favoritados"
        onlyFavorites
        emptyMessage="Nenhum favorito"
        documentTitle="Favoritos"
      />,
    );

    expect(await screen.findByText("5 lugares")).toBeInTheDocument();
    expect(screen.getByText("Automático")).toBeInTheDocument();
    expect(screen.getByText("Executivo")).toBeInTheDocument();
    expect(screen.getByText("Elétrico")).toBeInTheDocument();
    expect(screen.getByText("Adaptado PCD")).toBeInTheDocument();
    expect(screen.getByText("R$ 180,00 /dia")).toBeInTheDocument();
    expect(screen.queryByText("Branco")).not.toBeInTheDocument();
    expect(screen.queryByText(/Autonomia/i)).not.toBeInTheDocument();
  });
});
