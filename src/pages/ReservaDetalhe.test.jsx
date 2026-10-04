import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReservaDetalhe from "./ReservaDetalhe";
import {
  criarCompartilhamentoReserva,
  getQrDesbloqueio,
  getReservaById,
} from "../services/reservaService";
import { updateJourneyStep } from "../utils/journeyStorage";

const { navigateMock, params, clipboardWriteMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  params: { id: "reserva-1" },
  clipboardWriteMock: vi.fn(),
}));

vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => <main>{children}</main>,
}));
vi.mock("../services/reservaService", () => ({
  criarCompartilhamentoReserva: vi.fn(),
  getPagamentoReserva: vi.fn(),
  getQrDesbloqueio: vi.fn(),
  getReservaById: vi.fn(),
  revogarCompartilhamentoReserva: vi.fn(),
}));
vi.mock("../utils/journeyStorage", () => ({ updateJourneyStep: vi.fn() }));
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
  useParams: () => params,
}));

const reserva = (overrides = {}) => ({
  id: "reserva-1",
  status: "CONFIRMADA",
  statusPagamento: "SUCESSO",
  dataHoraInicio: "2026-09-18T12:00:00.000Z",
  dataHoraFim: "2026-09-19T12:00:00.000Z",
  valorTotal: 250.5,
  codigoDesbloqueio: "AB12-CD34",
  veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
  garagemRetirada: { id: "garagem-1", nome: "Centro" },
  garagemDevolucao: { id: "garagem-2", nome: "Aeroporto" },
  servicos: [{ idServico: "seguro-1", nome: "Seguro adicional", valor: 49.9 }],
  ...overrides,
});

describe("ReservaDetalhe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReservaById.mockResolvedValue(reserva());
    Object.defineProperty(navigator, "share", { configurable: true, writable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText: clipboardWriteMock },
    });
    clipboardWriteMock.mockResolvedValue(undefined);
  });

  it("carrega detalhes reais e mostra ação derivada do status", async () => {
    render(<ReservaDetalhe />);

    expect(await screen.findByText("Fiat Argo")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.getByText("R$ 250,50")).toBeInTheDocument();
    expect(screen.getByText("AB12-CD34")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desbloquear veículo" })).toBeInTheDocument();
    expect(getReservaById).toHaveBeenCalledWith("reserva-1");
  });

  it("RF13-A: mostra o total de diárias com a regra do backend", async () => {
    getReservaById.mockResolvedValue(reserva({ dataHoraFim: "2026-09-19T13:00:00.000Z" }));
    render(<ReservaDetalhe />);
    const linha = (await screen.findByText("Diárias")).closest("div");
    expect(linha).toHaveTextContent("2");
  });

  it("RF15: gera o QR de desbloqueio a partir do token do backend", async () => {
    getQrDesbloqueio.mockResolvedValue("token.assinado");
    render(<ReservaDetalhe />);
    await userEvent.click(await screen.findByRole("button", { name: "Mostrar QR de desbloqueio" }));

    const imagem = await screen.findByRole("img", { name: "QR de desbloqueio desta reserva" });
    expect(imagem.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);
    expect(getQrDesbloqueio).toHaveBeenCalledWith("reserva-1");
    await userEvent.click(screen.getByRole("link", { name: "Usar este QR neste dispositivo" }));
    expect(navigateMock).toHaveBeenCalledWith("/desbloqueio?qr=token.assinado");
  });

  it("não oferece QR fora de reserva confirmada", async () => {
    getReservaById.mockResolvedValue(reserva({ status: "EM_ANDAMENTO" }));
    render(<ReservaDetalhe />);
    await screen.findByText("Fiat Argo");
    expect(screen.queryByRole("button", { name: "Mostrar QR de desbloqueio" })).not.toBeInTheDocument();
  });

  it("preserva reserva real ao navegar para ação", async () => {
    const user = userEvent.setup();
    render(<ReservaDetalhe />);
    await user.click(await screen.findByRole("button", { name: "Desbloquear veículo" }));

    expect(updateJourneyStep).toHaveBeenCalledWith("reserva", expect.objectContaining({ id: "reserva-1" }));
    expect(navigateMock).toHaveBeenCalledWith("/desbloqueio", { state: { reservaId: "reserva-1" } });
  });

  it("não oferece operação falsa para reserva cancelada", async () => {
    getReservaById.mockResolvedValueOnce(reserva({ status: "CANCELADA", codigoDesbloqueio: null }));
    render(<ReservaDetalhe />);

    expect(await screen.findByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma ação operacional/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desbloquear veículo" })).not.toBeInTheDocument();
  });

  it("reserva expirada aparece como Expirada, não como ativa", async () => {
    getReservaById.mockResolvedValueOnce(reserva({ status: "CANCELADA", expiradaEm: "2026-10-05T15:15:00.000Z", codigoDesbloqueio: null }));
    render(<ReservaDetalhe />);

    expect(await screen.findByText("Expirada")).toBeInTheDocument();
    expect(screen.getByText(/pagamento não foi concluído em 15 minutos/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desbloquear veículo" })).not.toBeInTheDocument();
  });

  it("usa API de compartilhamento e fallback de cópia", async () => {
    criarCompartilhamentoReserva.mockResolvedValue({ url: "https://mova.test/viagem/token" });
    const user = userEvent.setup();
    render(<ReservaDetalhe />);
    await user.click(await screen.findByRole("button", { name: "Compartilhar viagem" }));

    expect(await screen.findByText("Link copiado.")).toBeInTheDocument();
    expect(criarCompartilhamentoReserva).toHaveBeenCalledWith("reserva-1");
    expect(screen.getByRole("button", { name: "Revogar compartilhamento" })).toBeInTheDocument();
  });

  it("anuncia erro de carregamento sem dados simulados", async () => {
    getReservaById.mockRejectedValueOnce(new Error("Reserva não encontrada"));
    render(<ReservaDetalhe />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Reserva não encontrada");
    await waitFor(() => expect(screen.queryByText("Fiat Argo")).not.toBeInTheDocument());
  });
});
