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
vi.mock("../services/garagemService", () => ({
  listGaragens: vi.fn(() => Promise.resolve([])),
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
      garagemId: "",
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

  it("envia campos físicos e de catálogo no contrato coordenado", async () => {
    updateVeiculo.mockResolvedValue(veiculo);

    render(<CadastroCarroForm />);
    fireEvent.change(screen.getByPlaceholderText("Marca*"), {
      target: { value: "Toyota" },
    });
    fireEvent.change(screen.getByPlaceholderText("Valor da diária* (R$)"), {
      target: { value: "321.45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() => expect(updateVeiculo).toHaveBeenCalledWith(
      "veiculo-1",
      expect.objectContaining({
        placa: "ABC1D23",
        status: "INATIVO",
        modelo: expect.objectContaining({
          marca: "Toyota",
          valorDiaria: 321.45,
          categoria: null,
        }),
      }),
    ));
    const payload = updateVeiculo.mock.calls[0][1];
    expect(payload).not.toHaveProperty("marca");
    expect(payload).not.toHaveProperty("valorDiaria");
  });

  it("carrega garagens e envia a garagem operacional na raiz do contrato", async () => {
    const { listGaragens } = await import("../services/garagemService");
    listGaragens.mockResolvedValueOnce([
      {
        id: "garagem-1",
        nome: "Garagem Central",
        status: "ATIVA",
        capacidade: 5,
        veiculosAlocados: 1,
      },
    ]);
    updateVeiculo.mockResolvedValue(veiculo);

    render(<CadastroCarroForm />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Garagem Central" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Garagem operacional"), {
      target: { value: "garagem-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() => expect(updateVeiculo).toHaveBeenCalledWith(
      "veiculo-1",
      expect.objectContaining({ garagemId: "garagem-1" }),
    ));
  });

  it.each(["MANUTENCAO", "INATIVO"])(
    "envia DISPONIVEL para %s pelo seletor de gestão",
    async (novoStatus) => {
      veiculo = { ...veiculo, status: "DISPONIVEL" };
      updateVeiculo.mockResolvedValue({ ...veiculo, status: novoStatus });

      render(<CadastroCarroForm />);
      fireEvent.change(screen.getByLabelText("Status"), {
        target: { value: novoStatus },
      });
      fireEvent.click(screen.getByRole("button", { name: "Editar" }));

      await waitFor(() => expect(updateVeiculo).toHaveBeenCalledWith(
        "veiculo-1",
        expect.objectContaining({ status: novoStatus }),
      ));
    },
  );
});
