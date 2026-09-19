import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CancelamentoReserva from "./CancelamentoReserva";
import { cancelarReserva, getReservaById } from "../services/reservaService";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate, useLocation: () => ({ state: { reservaId: "reserva-1" } }) }));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../utils/journeyStorage", () => ({ getJourneyStep: () => null }));
vi.mock("../services/reservaService", () => ({ cancelarReserva: vi.fn(), getReservaById: vi.fn() }));

const confirmada = { id: "reserva-1", status: "CONFIRMADA", valorTotal: 400, dataHoraInicio: "2026-09-20T12:00:00Z", veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } } };

describe("CancelamentoReserva", () => {
  beforeEach(() => { vi.clearAllMocks(); getReservaById.mockResolvedValue(confirmada); });

  async function abrirConfirmacao() {
    await screen.findByText(/Veículo: Fiat Argo/);
    await userEvent.click(screen.getByRole("button", { name: "Solicitar cancelamento" }));
    return screen.findByRole("dialog", { name: "Confirmar cancelamento" });
  }

  it("pede confirmação e mostra cancelamento gratuito retornado pelo backend", async () => {
    cancelarReserva.mockResolvedValue({ ...confirmada, status: "CANCELADA", multaCancelamento: 0 });
    render(<CancelamentoReserva />);
    expect(await abrirConfirmacao()).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    expect(cancelarReserva).toHaveBeenCalledWith("reserva-1");
    expect(await screen.findByRole("status")).toHaveTextContent("Cancelamento confirmado pelo sistema.");
    expect(screen.getByTestId("multa-cancelamento")).toHaveTextContent("R$ 0,00");
  });

  it("mostra multa tardia retornada pelo backend, sem calcular no cliente", async () => {
    cancelarReserva.mockResolvedValue({ ...confirmada, status: "CANCELADA", multaCancelamento: 80 });
    render(<CancelamentoReserva />);
    await abrirConfirmacao();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    expect(await screen.findByTestId("multa-cancelamento")).toHaveTextContent("R$ 80,00");
  });

  it.each(["EM_ANDAMENTO", "REALIZADA", "CANCELADA"])("não oferece cancelamento para status %s", async (status) => {
    getReservaById.mockResolvedValue({ ...confirmada, status, multaCancelamento: 0 });
    render(<CancelamentoReserva />);
    await screen.findByText(/Veículo: Fiat Argo/);
    expect(screen.queryByRole("button", { name: "Solicitar cancelamento" })).toBeNull();
    expect(cancelarReserva).not.toHaveBeenCalled();
  });

  it("mantém a reserva sem sucesso quando a API recusa cancelamento duplicado ou acesso", async () => {
    cancelarReserva.mockRejectedValue(new Error("Reserva já cancelada."));
    render(<CancelamentoReserva />);
    await abrirConfirmacao();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reserva já cancelada.");
    expect(screen.queryByText("Cancelamento confirmado pelo sistema.")).toBeNull();
  });
});
