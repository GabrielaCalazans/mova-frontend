import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OwnerReservations from "./OwnerReservations";
import { getReservas } from "../services/dashboardService";
import { listFrota } from "../services/veiculoService";

vi.mock("../services/dashboardService", () => ({ getReservas: vi.fn() }));
vi.mock("../services/veiculoService", () => ({ listFrota: vi.fn() }));

describe("OwnerReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFrota.mockResolvedValue([{ id: "vehicle-1", placa: "ABC-1234", marca: "Fiat", modelo: "Argo" }]);
    getReservas
      .mockResolvedValueOnce({ total: 1, reservas: [{ id: "reservation-1", idVeiculo: "vehicle-1", status: "CONFIRMADA", dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { marca: "Fiat", modelo: "Argo" }, garagemRetirada: { nome: "Centro" } }] })
      .mockResolvedValue({ total: 0, reservas: [] });
  });

  it("envia filtros de reserva suportados pelo contrato e não inventa detalhes", async () => {
    render(<OwnerReservations />);

    await screen.findByRole("row", { name: /Fiat Argo.*Confirmada/ });
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-01-31" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "CONFIRMADA" } });
    fireEvent.change(screen.getByLabelText("Veículo"), { target: { value: "vehicle-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(getReservas).toHaveBeenLastCalledWith({
      dataInicio: "2026-01-01",
      dataFim: "2026-01-31",
      status: "CONFIRMADA",
      idVeiculo: "vehicle-1",
    }));
    expect(await screen.findByText("Nenhuma reserva encontrada.")).toBeInTheDocument();
    expect(screen.queryByText(/Garagem não informada/)).not.toBeInTheDocument();
  });

  it("rejeita intervalo invertido antes de consultar o backend", async () => {
    render(<OwnerReservations />);
    await screen.findByRole("row", { name: /Fiat Argo.*Confirmada/ });

    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-02-01" } });
    fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("data final deve ser igual ou posterior");
    expect(getReservas).toHaveBeenCalledTimes(1);
  });

  it("pagina reservas usando os filtros aplicados", async () => {
    const primeiraPagina = { total: 11, reservas: [{ id: "reservation-1", idVeiculo: "vehicle-1", status: "CONFIRMADA", dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { marca: "Fiat", modelo: "Argo" }, garagemRetirada: { nome: "Centro" } }], pagination: { page: 1, limit: 10, total: 11, totalPages: 2 } };
    getReservas.mockReset().mockResolvedValueOnce(primeiraPagina).mockResolvedValueOnce(primeiraPagina).mockResolvedValueOnce({ ...primeiraPagina, reservas: [], pagination: { page: 2, limit: 10, total: 11, totalPages: 2 } });
    render(<OwnerReservations />);

    await screen.findByRole("row", { name: /Fiat Argo.*Confirmada/ });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "CONFIRMADA" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(getReservas).toHaveBeenLastCalledWith({ status: "CONFIRMADA" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));

    await waitFor(() => expect(getReservas).toHaveBeenLastCalledWith({ status: "CONFIRMADA", page: 2 }));
    expect(await screen.findByText(/Página 2 de 2/)).toBeInTheDocument();
  });

  it("remove resultados anteriores quando a consulta filtrada falha", async () => {
    const primeiraPagina = { total: 1, reservas: [{ id: "reservation-1", idVeiculo: "vehicle-1", status: "CONFIRMADA", dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { marca: "Fiat", modelo: "Argo" }, garagemRetirada: { nome: "Centro" } }], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    getReservas.mockReset().mockResolvedValueOnce(primeiraPagina).mockRejectedValueOnce(new Error("Falha no filtro"));
    render(<OwnerReservations />);

    await screen.findByRole("row", { name: /Fiat Argo.*Confirmada/ });
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-02-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no filtro");
    expect(screen.queryByRole("row", { name: /Fiat Argo.*Confirmada/ })).not.toBeInTheDocument();
  });
});
