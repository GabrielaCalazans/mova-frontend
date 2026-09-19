import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroCarroForm from "./CadastroCarroForm";
import { updateVeiculo } from "../services/veiculoService";

const navigateMock = vi.hoisted(() => vi.fn());
let veiculo = null;

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { veiculo } }),
  useNavigate: () => navigateMock,
  useParams: () => ({ id: "veiculo-1" }),
}));
vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => children,
}));
vi.mock("../services/veiculoService", () => ({
  createVeiculo: vi.fn(),
  updateVeiculo: vi.fn(),
}));
vi.mock("../services/authSession", () => ({
  getAuthSession: () => ({ user: { id: "locador-1" } }),
}));

describe("CadastroCarroForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    veiculo = {
      marca: "Fiat",
      modelo: "Argo",
      placa: "ABC1D23",
      ano: 2025,
      cambio: "Manual",
      capacidade: 5,
      valorDiaria: 150,
      status: "INATIVO",
      eletrico: false,
      adaptado: false,
    };
  });

  it("permite reativar um veículo e envia DISPONIVEL ao backend", async () => {
    updateVeiculo.mockResolvedValue({ ...veiculo, status: "DISPONIVEL" });

    render(<CadastroCarroForm />);

    const status = screen.getByLabelText("Status");
    expect(status).toHaveValue("INATIVO");
    expect(screen.getByRole("option", { name: "MANUTENCAO" })).toBeInTheDocument();
    fireEvent.change(status, { target: { value: "DISPONIVEL" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() => expect(updateVeiculo).toHaveBeenCalledWith("veiculo-1", expect.objectContaining({
      status: "DISPONIVEL",
    })));
    expect(navigateMock).toHaveBeenCalledWith("/cadastro-carros");
  });

  it("exibe erro quando a alteração de status falha", async () => {
    updateVeiculo.mockRejectedValueOnce(new Error("Falha ao atualizar status"));

    render(<CadastroCarroForm />);
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "MANUTENCAO" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(await screen.findByText("Falha ao atualizar status")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
