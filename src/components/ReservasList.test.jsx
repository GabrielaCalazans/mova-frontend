import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReservasList from "./ReservasList";
import {
  criarCompartilhamentoReserva,
  getReservasDoLocatarioPage,
  revogarCompartilhamentoReserva,
} from "../services/reservaService";

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../services/authSession", () => ({ getAuthSession: () => ({ user: { id: "locatario-1" } }) }));
vi.mock("../services/reservaService", () => ({
  criarCompartilhamentoReserva: vi.fn(),
  getReservasDoLocatarioPage: vi.fn(),
  revogarCompartilhamentoReserva: vi.fn(),
}));
vi.mock("../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

describe("ReservasList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "share", { configurable: true, writable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    getReservasDoLocatarioPage.mockResolvedValue({
      reservas: [{
        id: "reserva-1",
        dataHoraInicio: "2026-01-01T10:00:00.000Z",
        dataHoraFim: "2026-01-02T10:00:00.000Z",
        status: "CANCELADA",
        statusPagamento: "SUCESSO",
        valorTotal: 169.9,
        veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
        servicos: [{ idServico: "seguro-1", nome: "Seguro adicional", valor: 49.9 }],
      }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it("exibe posteriormente o nome e o snapshot de preço do seguro", async () => {
    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    expect(await screen.findByText("Seguro adicional — R$ 49,90")).toBeInTheDocument();
    expect(screen.getByLabelText("Serviços contratados")).toBeInTheDocument();
  });

  it("exibe a cobertura persistida no histórico", async () => {
    const cobertura = "Cobertura contratada: danos ao veículo e assistência prevista.";
    getReservasDoLocatarioPage.mockResolvedValueOnce({
      reservas: [{
        id: "reserva-cobertura",
        dataHoraInicio: "2026-01-01T10:00:00.000Z",
        dataHoraFim: "2026-01-02T10:00:00.000Z",
        status: "CONFIRMADA",
        statusPagamento: "SUCESSO",
        valorTotal: 169.9,
        veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
        servicos: [{ idServico: "seguro-1", nome: "Seguro adicional", valor: 49.9, detalhesCobertura: cobertura }],
      }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    expect(await screen.findByText("Ver detalhes da cobertura")).toBeInTheDocument();
    const { default: userEvent } = await import("@testing-library/user-event");
    await userEvent.click(screen.getByText("Ver detalhes da cobertura"));
    expect(screen.getByText(cobertura)).toBeVisible();
  });

  it("mostra acesso ao rastreamento apenas para reserva na janela válida", async () => {
    const agora = Date.now();
    getReservasDoLocatarioPage.mockResolvedValue({
      reservas: [
        {
          id: "reserva-elegivel", dataHoraInicio: new Date(agora - 60_000).toISOString(), dataHoraFim: new Date(agora + 60_000).toISOString(),
          status: "EM_ANDAMENTO", statusPagamento: "SUCESSO", valorTotal: 100,
          veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } }, servicos: [],
        },
        {
          id: "reserva-futura", dataHoraInicio: new Date(agora + 60_000).toISOString(), dataHoraFim: new Date(agora + 120_000).toISOString(),
          status: "CONFIRMADA", statusPagamento: "SUCESSO", valorTotal: 100,
          veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Mobi" } }, servicos: [],
        },
        {
          id: "reserva-cancelada", dataHoraInicio: new Date(agora - 60_000).toISOString(), dataHoraFim: new Date(agora + 60_000).toISOString(),
          status: "CANCELADA", statusPagamento: "SUCESSO", valorTotal: 100,
          veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Uno" } }, servicos: [],
        },
      ],
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });
    const { default: userEvent } = await import("@testing-library/user-event");
    const { render, screen } = await import("@testing-library/react");
    const user = userEvent.setup();
    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    const botao = await screen.findByRole("button", { name: /acompanhar veículo/i });
    expect(screen.getAllByRole("button", { name: /acompanhar veículo/i })).toHaveLength(1);
    await user.click(botao);
    expect(navigateMock).toHaveBeenCalledWith("/reserva/reserva-elegivel/localizacao");
  });

  it("gera link e usa compartilhamento nativo sem navegar no card", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    criarCompartilhamentoReserva.mockResolvedValue({
      token: "A".repeat(43),
      url: "http://localhost:5173/viagem/compartilhada/token",
    });
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    await user.click(await screen.findByRole("button", { name: "Compartilhar viagem" }));

    expect(criarCompartilhamentoReserva).toHaveBeenCalledWith("reserva-1");
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      url: "http://localhost:5173/viagem/compartilhada/token",
    }));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /link da viagem/i })).toHaveAttribute(
      "href",
      "http://localhost:5173/viagem/compartilhada/token",
    );
  });

  it("faz fallback para copiar o link quando compartilhamento nativo não existe", async () => {
    criarCompartilhamentoReserva.mockResolvedValue({
      token: "B".repeat(43),
      url: "http://localhost:5173/viagem/compartilhada/token-b",
    });
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const clipboard = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText: clipboard },
    });

    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    await user.click(await screen.findByRole("button", { name: "Compartilhar viagem" }));

    expect(await screen.findByText("Link copiado.")).toBeInTheDocument();
    expect(clipboard).toHaveBeenCalledWith("http://localhost:5173/viagem/compartilhada/token-b");
    expect(screen.getByRole("button", { name: "Revogar compartilhamento" })).toBeInTheDocument();
  });

  it("mostra erro da API e revoga link existente", async () => {
    criarCompartilhamentoReserva.mockRejectedValueOnce(new Error("Falha ao compartilhar"));
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ReservasList title="Histórico" documentTitle="Histórico" />);
    await user.click(await screen.findByRole("button", { name: "Compartilhar viagem" }));
    expect(await screen.findByText("Falha ao compartilhar")).toBeInTheDocument();

    criarCompartilhamentoReserva.mockResolvedValueOnce({
      token: "C".repeat(43),
      url: "http://localhost:5173/viagem/compartilhada/token-c",
    });
    await user.click(screen.getByRole("button", { name: "Compartilhar viagem" }));
    await user.click(await screen.findByRole("button", { name: "Revogar compartilhamento" }));
    expect(revogarCompartilhamentoReserva).toHaveBeenCalledWith("reserva-1");
    expect(await screen.findByText("Compartilhamento revogado.")).toBeInTheDocument();
  });
});
