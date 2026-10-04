import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import OwnerDashboard from "./OwnerDashboard";
import RelatoriosVeiculos from "./RelatoriosVeiculos";
import { setLocale } from "../i18n";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/dashboardService", () => ({
  getFrota: vi.fn().mockResolvedValue({ veiculos: { total: 3 }, alertasPorTipo: { INATIVIDADE: 1, BAIXA_AVALIACAO: 2 } }),
  getReservas: vi.fn().mockResolvedValue({ total: 1, reservas: [] }),
  getFinanceiro: vi.fn().mockResolvedValue({ faturamentoBruto: 1234.5, porVeiculo: [{ idVeiculo: "v1", placa: "ABC-1234", total: 1234.5 }] }),
  getUtilizacao: vi.fn().mockResolvedValue({ taxaOcupacao: 0.5, veiculosAlocados: 2, tempoMedioReservadoHoras: 8, maisUtilizados: [{ idVeiculo: "v1", placa: "ABC-1234", reservas: 1, horasReservadas: 16 }] }),
  getAvaliacaoDashboard: vi.fn().mockResolvedValue({ resumo: { total: 1, media: 4.5 } }),
}));

const renderDashboard = () => render(<MemoryRouter><OwnerDashboard /></MemoryRouter>);

describe("área do locador e relatórios em outros idiomas (RNF08)", () => {
  afterEach(() => setLocale("pt-BR"));

  it("painel do locador em inglês com receita em BRL", async () => {
    setLocale("en");
    renderDashboard();
    expect(screen.getByRole("heading", { name: "Owner dashboard" })).toBeInTheDocument();
    expect(await screen.findByText("R$1,234.50")).toBeInTheDocument();
    expect(screen.getByText("50% · 2 allocated")).toBeInTheDocument();
    expect(screen.getByText("Low rating")).toBeInTheDocument();
    expect(document.title).toBe("MOVA - Owner dashboard");
  });

  it("relatórios de veículos em espanhol, com plural e moeda BRL", async () => {
    setLocale("es");
    render(<RelatoriosVeiculos />);
    expect(screen.getByRole("heading", { name: "Informes | Vehículos" })).toBeInTheDocument();
    expect(await screen.findByText(/ABC-1234: 1234,50\sR\$/)).toBeInTheDocument();
    expect(screen.getByText("ABC-1234: 1 reserva, 16 h")).toBeInTheDocument();
    expect(screen.getByText("1 valoración · media 4.5")).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha inicial")).toBeInTheDocument();
  });
});
