import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InteressesDisponibilidade from "./InteressesDisponibilidade";
import {
  cancelarInteresse,
  listarInteresses,
  listarNotificacoes,
  listarVeiculosParaInteresse,
  registrarInteresse,
} from "../services/interesseService";

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/interesseService", () => ({
  cancelarInteresse: vi.fn(),
  listarInteresses: vi.fn(),
  listarNotificacoes: vi.fn(),
  listarVeiculosParaInteresse: vi.fn(),
  registrarInteresse: vi.fn(),
}));

const vehicle = (id, status = "MANUTENCAO") => ({
  id,
  status,
  marca: "Fiat",
  modelo: `Argo ${id}`,
  ano: 2025,
  valorDiaria: 180,
  garagem: { nome: "Garagem Central", status: "ATIVA" },
});

describe("InteressesDisponibilidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarVeiculosParaInteresse.mockResolvedValue([vehicle("v-1")]);
    listarInteresses.mockResolvedValue([]);
    listarNotificacoes.mockResolvedValue([]);
    registrarInteresse.mockResolvedValue({ id: "i-1", idVeiculo: "v-1" });
    cancelarInteresse.mockResolvedValue(undefined);
  });

  it("mostra loading, veículo indisponível e ação de aviso", async () => {
    let resolve;
    listarVeiculosParaInteresse.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<InteressesDisponibilidade />);
    expect(screen.getByText("Carregando veículos indisponíveis…")).toBeInTheDocument();
    resolve([vehicle("v-1")]);
    expect(await screen.findByText("Fiat Argo v-1")).toBeInTheDocument();
    expect(screen.getByText("Indisponível — MANUTENCAO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avisar quando disponível" })).toBeInTheDocument();
  });

  it("registra interesse e atualiza a ação sem duplicar chamada", async () => {
    render(<InteressesDisponibilidade />);
    const action = await screen.findByRole("button", { name: "Avisar quando disponível" });
    fireEvent.click(action);
    await waitFor(() => expect(registrarInteresse).toHaveBeenCalledWith("v-1"));
    expect(await screen.findByRole("button", { name: "Cancelar aviso" })).toBeInTheDocument();
  });

  it("remove interesse ativo", async () => {
    listarInteresses.mockResolvedValue([{ idVeiculo: "v-1" }]);
    render(<InteressesDisponibilidade />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar aviso" }));
    await waitFor(() => expect(cancelarInteresse).toHaveBeenCalledWith("v-1"));
    expect(await screen.findByRole("button", { name: "Avisar quando disponível" })).toBeInTheDocument();
  });

  it("exibe vazio e notificações persistidas", async () => {
    listarVeiculosParaInteresse.mockResolvedValue([]);
    listarNotificacoes.mockResolvedValue([
      { id: "n-1", assunto: "Fiat Argo voltou a ficar disponível", status: "ENVIADA" },
    ]);
    render(<InteressesDisponibilidade />);
    expect(await screen.findByText("Nenhum veículo indisponível encontrado.")).toBeInTheDocument();
    expect(screen.getByText("Fiat Argo voltou a ficar disponível")).toBeInTheDocument();
  });

  it("exibe erro da API", async () => {
    listarVeiculosParaInteresse.mockRejectedValue(new Error("Falha de rede"));
    render(<InteressesDisponibilidade />);
    expect(await screen.findByText("Falha de rede")).toBeInTheDocument();
  });
});
