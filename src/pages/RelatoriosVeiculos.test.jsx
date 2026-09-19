import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelatoriosVeiculos from "./RelatoriosVeiculos";
import { getFinanceiro, getUtilizacao } from "../services/dashboardService";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/dashboardService", () => ({ getFinanceiro: vi.fn(), getUtilizacao: vi.fn() }));

describe("RelatoriosVeiculos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra carregamento e dados reais dos dashboards", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 320, porVeiculo: [{ idVeiculo: "v1", placa: "ABC-1234", total: 320 }] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 25, tempoMedioReservadoHoras: 8, maisUtilizados: [{ idVeiculo: "v1", placa: "ABC-1234", reservas: 2, horasReservadas: 16 }] });
    render(<RelatoriosVeiculos />);
    expect(screen.getByText(/Carregando relatórios/)).toBeInTheDocument();
    expect(await screen.findByText(/ABC-1234: R\$/)).toBeInTheDocument();
    expect(screen.getByText(/2 reservas, 16h/)).toBeInTheDocument();
    expect(screen.getByText(/quilometragem indisponíveis/i)).toBeInTheDocument();
    expect(screen.queryByText("HB20")).not.toBeInTheDocument();
  });

  it("mostra estado vazio", async () => {
    getFinanceiro.mockResolvedValue({ faturamentoBruto: 0, porVeiculo: [] });
    getUtilizacao.mockResolvedValue({ taxaOcupacao: 0, tempoMedioReservadoHoras: 0, maisUtilizados: [] });
    render(<RelatoriosVeiculos />);
    expect(await screen.findByText("Nenhum faturamento encontrado.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma utilização encontrada.")).toBeInTheDocument();
  });

  it("mostra erro da API", async () => {
    getFinanceiro.mockRejectedValue(new Error("falha"));
    getUtilizacao.mockResolvedValue({});
    render(<RelatoriosVeiculos />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os relatórios.");
  });
});
