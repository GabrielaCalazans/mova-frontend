import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelatoriosVeiculos from "./RelatoriosVeiculos";
import { getAvaliacaoDashboard, getFinanceiro, getReservas, getUtilizacao } from "../services/dashboardService";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/dashboardService", () => ({ getAvaliacaoDashboard: vi.fn(), getFinanceiro: vi.fn(), getReservas: vi.fn(), getUtilizacao: vi.fn() }));

describe("RelatoriosVeiculos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra carregamento e dados reais dos dashboards", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 320, porVeiculo: [{ idVeiculo: "v1", placa: "ABC-1234", total: 320 }] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 0.25, tempoMedioReservadoHoras: 8, maisUtilizados: [{ idVeiculo: "v1", placa: "ABC-1234", reservas: 2, horasReservadas: 16 }] });
    getReservas.mockResolvedValue({ total: 1, reservas: [{ id: "r1", idVeiculo: "v1", status: "CONFIRMADA", statusPagamento: "SUCESSO", valorTotal: 320, dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { placa: "ABC-1234", modelo: "Argo" } }], pagination: { total: 1, page: 1, limit: 10 } });
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 2, media: 4.5 } });
    render(<RelatoriosVeiculos />);
    expect(screen.getByText(/Carregando relatórios/)).toBeInTheDocument();
    expect(await screen.findByText(/ABC-1234: R\$/)).toBeInTheDocument();
    expect(screen.getByText(/2 reservas, 16h/)).toBeInTheDocument();
    expect(screen.getByText(/25% de ocupação/)).toBeInTheDocument();
    expect(screen.getByText(/CONFIRMADA/)).toBeInTheDocument();
    expect(screen.getByText(/2 avaliações/)).toBeInTheDocument();
    expect(screen.getByText(/quilometragem indisponíveis/i)).toBeInTheDocument();
    expect(screen.queryByText("HB20")).not.toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 0, porVeiculo: [] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 0, tempoMedioReservadoHoras: 0, maisUtilizados: [] });
    getReservas.mockResolvedValue({ total: 0, reservas: [], pagination: { total: 0, page: 1, limit: 10 } });
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 0, media: 0 } });
    render(<RelatoriosVeiculos />);
    expect(await screen.findByText("Nenhum faturamento encontrado.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma utilização encontrada.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma reserva encontrada.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma avaliação encontrada.")).toBeInTheDocument();
  });

  it("mostra erro da API", async () => {
    getFinanceiro.mockRejectedValue(new Error("falha"));
    getUtilizacao.mockResolvedValue({});
    getReservas.mockResolvedValue({ reservas: [] });
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 0 } });
    render(<RelatoriosVeiculos />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os relatórios.");
  });

  it("envia período e veículo somente ao endpoint de reservas", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 320, porVeiculo: [{ idVeiculo: "v1", placa: "ABC-1234", total: 320 }] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 0.25, tempoMedioReservadoHoras: 8, maisUtilizados: [] });
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 0, media: 0 } });
    getReservas.mockResolvedValue({ total: 1, reservas: [{ id: "r1", idVeiculo: "v1", status: "CONFIRMADA", valorTotal: 320, dataHoraInicio: "2026-01-01T10:00:00Z", dataHoraFim: "2026-01-02T10:00:00Z", veiculo: { placa: "ABC-1234" } }], pagination: { total: 1, page: 1, limit: 10 } });

    render(<RelatoriosVeiculos />);
    await screen.findByText(/ABC-1234: R\$/);
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-01-31" } });
    fireEvent.change(screen.getByLabelText("Veículo"), { target: { value: "v1" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await waitFor(() => expect(getReservas).toHaveBeenLastCalledWith({ dataInicio: "2026-01-01", dataFim: "2026-01-31", idVeiculo: "v1" }));
    expect(getFinanceiro).toHaveBeenCalledTimes(1);
    expect(getUtilizacao).toHaveBeenCalledTimes(1);
    expect(getAvaliacaoDashboard).toHaveBeenCalledTimes(1);
  });

  it("rejeita intervalo invertido antes de consultar", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 0, porVeiculo: [] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 0, maisUtilizados: [] });
    getReservas.mockResolvedValue({ total: 0, reservas: [], pagination: { total: 0, page: 1, limit: 10 } });
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 0, media: 0 } });

    render(<RelatoriosVeiculos />);
    await screen.findByText("Nenhum faturamento encontrado.");
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-02-01" } });
    fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("data final deve ser igual ou posterior");
    expect(getReservas).toHaveBeenCalledTimes(1);
  });
});
