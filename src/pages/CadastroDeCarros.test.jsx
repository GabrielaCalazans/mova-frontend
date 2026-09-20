import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroDeCarros from "./CadastroDeCarros";
import { listFrota } from "../services/veiculoService";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../components/FrotaMonitoramento", () => ({ default: () => null }));
vi.mock("../services/veiculoService", () => ({
  listFrota: vi.fn(),
  deleteVeiculo: vi.fn(),
}));
vi.mock("../services/authSession", () => ({
  getAuthSession: () => ({ token: "token-locador", user: { id: "locador-1" } }),
}));

const veiculo = (id, status) => ({
  id,
  marca: "Fiat",
  modelo: "Argo",
  placa: `${id.slice(-3).toUpperCase()}1D23`,
  ano: 2025,
  cambio: "Manual",
  capacidade: 5,
  status,
});

describe("CadastroDeCarros — gestão da frota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra loading, lista vazia e erro da API", async () => {
    let resolver;
    listFrota.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
    render(<CadastroDeCarros />);
    expect(screen.getByText("Carregando veículos…")).toBeInTheDocument();
    resolver([]);
    expect(await screen.findByText(/Você ainda não cadastrou/)).toBeInTheDocument();

    listFrota.mockRejectedValueOnce(new Error("Falha na frota"));
    render(<CadastroDeCarros />);
    expect(await screen.findByText("Falha na frota")).toBeInTheDocument();
  });

  it("lista DISPONIVEL, MANUTENCAO e INATIVO com status real", async () => {
    listFrota.mockResolvedValue([
      veiculo("veiculo-001", "DISPONIVEL"),
      veiculo("veiculo-002", "MANUTENCAO"),
      veiculo("veiculo-003", "INATIVO"),
    ]);

    render(<CadastroDeCarros />);

    expect(await screen.findByText("DISPONIVEL")).toBeInTheDocument();
    expect(screen.getByText("MANUTENCAO")).toBeInTheDocument();
    expect(screen.getByText("INATIVO")).toBeInTheDocument();
    expect(listFrota).toHaveBeenCalledTimes(1);
  });

  it("abre edição do veículo visível, inclusive após status administrativo", async () => {
    listFrota.mockResolvedValue([veiculo("veiculo-002", "MANUTENCAO")]);

    render(<CadastroDeCarros />);
    await screen.findByText("MANUTENCAO");
    fireEvent.click(screen.getByRole("button", { name: "Editar Fiat Argo" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(
      "/cadastro-carros/veiculo-002",
      expect.objectContaining({ state: expect.objectContaining({ veiculo: expect.objectContaining({ status: "MANUTENCAO" }) }) }),
    ));
  });
});
