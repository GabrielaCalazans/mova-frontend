import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroCarroForm from "./CadastroCarroForm";
import { createVeiculo, listFrota, updateVeiculo, uploadImagemVeiculo } from "../services/veiculoService";

const navigateMock = vi.hoisted(() => vi.fn());
let veiculo = null;
let routeId = "veiculo-1";
let aviso;

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { veiculo, aviso } }),
  useNavigate: () => navigateMock,
  useParams: () => ({ id: routeId }),
}));
vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => children,
}));
vi.mock("../services/veiculoService", () => ({
  createVeiculo: vi.fn(),
  listFrota: vi.fn(),
  updateVeiculo: vi.fn(),
  uploadImagemVeiculo: vi.fn(),
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
    routeId = "veiculo-1";
    aviso = undefined;
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
    expect(screen.getByRole("option", { name: "Em manutenção" })).toBeInTheDocument();
    fireEvent.change(status, { target: { value: "DISPONIVEL" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    await waitFor(() => expect(updateVeiculo).toHaveBeenCalledWith("veiculo-1", expect.objectContaining({
      status: "DISPONIVEL",
    })));
    expect(navigateMock).toHaveBeenCalledWith("/cadastro-carros");
  });

  it("carrega veículo real ao abrir URL direta sem location state", async () => {
    const { listGaragens } = await import("../services/garagemService");
    veiculo = null;
    listGaragens.mockResolvedValueOnce([{
      id: "garagem-1",
      nome: "Garagem Centro",
      status: "ATIVA",
      capacidade: 10,
      veiculosAlocados: 1,
    }]);
    listFrota.mockResolvedValueOnce([{
      id: "veiculo-1",
      marca: "Toyota",
      modelo: "Corolla",
      placa: "XYZ9A99",
      ano: 2024,
      cambio: "Automatico",
      capacidade: 5,
      valorDiaria: 280,
      status: "DISPONIVEL",
      eletrico: true,
      adaptado: false,
      categoria: "EXECUTIVO",
      garagemId: "garagem-1",
    }]);

    render(<CadastroCarroForm />);

    expect(await screen.findByDisplayValue("Toyota")).toBeInTheDocument();
    expect(screen.getByDisplayValue("XYZ9A99")).toBeInTheDocument();
    expect(screen.getByLabelText("Garagem operacional")).toHaveValue("garagem-1");
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

  it("mantém garagem escolhida e anuncia bloqueio de reserva ativa", async () => {
    const { listGaragens } = await import("../services/garagemService");
    listGaragens.mockResolvedValueOnce([{ id: "garagem-2", nome: "Garagem Norte", status: "ATIVA", capacidade: 5, veiculosAlocados: 0 }]);
    updateVeiculo.mockRejectedValueOnce(Object.assign(new Error("erro técnico"), {
      code: "VEHICLE_HAS_ACTIVE_RESERVATION",
      status: 409,
    }));
    render(<CadastroCarroForm />);
    await screen.findByRole("option", { name: "Garagem Norte" });
    fireEvent.change(screen.getByLabelText("Garagem operacional"), { target: { value: "garagem-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(await screen.findByText(/reserva.*impede.*transfer/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Garagem operacional")).toHaveValue("garagem-2");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  // Task 10 (BUG-14): reserva paga futura impede manutenção/inativação.
  it("bloqueio por reserva futura confirmada: mensagem clara e status volta ao salvo", async () => {
    updateVeiculo.mockRejectedValueOnce(Object.assign(new Error("erro técnico"), {
      code: "VEICULO_COM_RESERVA_FUTURA_CONFIRMADA",
      status: 409,
    }));
    render(<CadastroCarroForm />);
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "MANUTENCAO" } });
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(await screen.findByText(/reservas confirmadas.*resolva/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("INATIVO");
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

  it("mostra categorias com rótulo legível", () => {
    render(<CadastroCarroForm />);

    expect(screen.getByRole("option", { name: "Econômico" })).toHaveValue("ECONOMICO");
    expect(screen.getByRole("option", { name: "Espaçoso" })).toHaveValue("ESPACOSO");
    expect(screen.queryByRole("option", { name: "ECONOMICO" })).not.toBeInTheDocument();
  });

  it("após criar o veículo e falhar o upload, segue para a edição do veículo criado", async () => {
    routeId = "novo";
    veiculo = { ...veiculo, status: "DISPONIVEL" };
    const { createObjectURL, revokeObjectURL } = URL;
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
    createVeiculo.mockResolvedValue({ id: "veiculo-novo" });
    uploadImagemVeiculo.mockRejectedValueOnce(new Error("Imagem inválida"));

    render(<CadastroCarroForm />);
    const arquivo = new File(["x"], "foto.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Imagens reais do veículo"), { target: { files: [arquivo] } });
    fireEvent.click(screen.getByRole("button", { name: "Finalizar Cadastro" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(
      "/cadastro-carros/veiculo-novo",
      expect.objectContaining({ replace: true, state: { aviso: expect.stringMatching(/Veículo salvo, mas algumas imagens não foram enviadas/) } }),
    ));
    expect(navigateMock).not.toHaveBeenCalledWith("/cadastro-carros");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it("exibe o aviso de imagens pendentes ao chegar na edição", () => {
    aviso = "Veículo salvo, mas algumas imagens não foram enviadas.";
    render(<CadastroCarroForm />);

    expect(screen.getByText("Veículo salvo, mas algumas imagens não foram enviadas.")).toHaveAttribute("role", "status");
  });
});
