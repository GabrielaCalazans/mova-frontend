import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DevolucaoReserva from "./DevolucaoReserva";
import { devolverReserva, getReservaById } from "../services/reservaService";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ state: { reservaId: "reserva-1" } }),
  useNavigate: () => navigate,
}));
vi.mock("../layout/AuthenticatedLayout", () => ({ default: ({ children }) => <div>{children}</div> }));
vi.mock("../utils/journeyStorage", () => ({ getJourneyStep: () => null }));
vi.mock("../services/reservaService", () => ({ getReservaById: vi.fn(), devolverReserva: vi.fn() }));

const andamento = {
  id: "reserva-1", status: "EM_ANDAMENTO", codigoUsadoEm: "2026-09-18T12:00:00Z",
  dataHoraFim: "2026-09-19T12:00:00Z", devolvidoEm: null,
  veiculo: { placa: "ABC1D23", modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
};

describe("DevolucaoReserva", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReservaById.mockResolvedValue(andamento);
  });

  it("confirma devolução normal pela API e libera avaliação", async () => {
    devolverReserva.mockResolvedValue({ ...andamento, status: "REALIZADA", devolvidoEm: "2026-09-19T11:00:00Z", cobrancaAtraso: 0 });
    render(<DevolucaoReserva />);
    expect(await screen.findByText(/Fiat Argo/)).toBeInTheDocument();
    expect(screen.getByText(/Data prevista para devolução/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmar devolução" }));
    expect(devolverReserva).toHaveBeenCalledWith("reserva-1");
    expect(await screen.findByText("Devolução confirmada pelo sistema.")).toBeInTheDocument();
    expect(screen.getByTestId("cobranca-atraso")).toHaveTextContent("R$ 0,00");
    await userEvent.click(screen.getByRole("button", { name: "Avaliar experiência" }));
    expect(navigate).toHaveBeenCalledWith("/avaliacao", { state: { reservaId: "reserva-1" } });
  });

  it("mostra cobrança de atraso retornada pelo servidor sem calcular no cliente", async () => {
    devolverReserva.mockResolvedValue({ ...andamento, status: "REALIZADA", devolvidoEm: "2026-09-20T12:00:00Z", cobrancaAtraso: 330 });
    render(<DevolucaoReserva />);
    await screen.findByRole("button", { name: "Confirmar devolução" });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar devolução" }));
    expect(await screen.findByTestId("cobranca-atraso")).toHaveTextContent("R$ 330,00");
    expect(devolverReserva).toHaveBeenCalledTimes(1);
  });

  it.each(["CONFIRMADA", "CANCELADA", "REALIZADA"])("não oferece devolução para status %s", async (status) => {
    getReservaById.mockResolvedValue({ ...andamento, status, devolvidoEm: status === "REALIZADA" ? "2026-09-19T11:00:00Z" : null });
    render(<DevolucaoReserva />);
    await screen.findByText(/Fiat Argo/);
    expect(screen.queryByRole("button", { name: "Confirmar devolução" })).toBeNull();
    expect(devolverReserva).not.toHaveBeenCalled();
  });

  it("mantém a reserva em andamento se a API recusa uma devolução duplicada", async () => {
    devolverReserva.mockRejectedValue(new Error("Reserva já devolvida."));
    render(<DevolucaoReserva />);
    await screen.findByRole("button", { name: "Confirmar devolução" });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar devolução" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Reserva já devolvida.");
    expect(screen.queryByText("Devolução confirmada pelo sistema.")).toBeNull();
  });

  it("não declara sucesso com resposta incompleta da API", async () => {
    devolverReserva.mockResolvedValue({ ...andamento, status: "REALIZADA", devolvidoEm: null });
    render(<DevolucaoReserva />);
    await screen.findByRole("button", { name: "Confirmar devolução" });
    await userEvent.click(screen.getByRole("button", { name: "Confirmar devolução" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/não foi confirmada/));
    expect(screen.queryByText("Devolução confirmada pelo sistema.")).toBeNull();
  });
});
