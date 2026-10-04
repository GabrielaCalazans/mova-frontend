import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { saveAuthSession } from "../services/authSession";
import { getFinanceiro, getFrota, getReservas, getUtilizacao } from "../services/dashboardService";

vi.mock("../services/dashboardService", () => ({
  getFrota: vi.fn().mockResolvedValue({
    veiculos: { total: 3, disponivel: 2, reservado: 1, manutencao: 0, inativo: 0 },
    alertasPorTipo: { INATIVIDADE: 1, BAIXA_AVALIACAO: 2 },
  }),
  getReservas: vi.fn().mockResolvedValue({ total: 4, reservas: [] }),
  getFinanceiro: vi.fn().mockResolvedValue({ faturamentoBruto: 1200 }),
  getUtilizacao: vi.fn().mockResolvedValue({ taxaOcupacao: 0.5, veiculosAlocados: 2 }),
}));

describe("dashboard real do locador", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/painel");
    saveAuthSession({ token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } });
  });

  it("exibe alertas e ocupação retornados pelos contratos do backend", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: /painel do locador/i })).toBeInTheDocument();
    expect(await screen.findByText("Inatividade")).toBeInTheDocument();
    expect(await screen.findByText("Baixa avaliação")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(await screen.findByText(/50.*2 alocados/i)).toBeInTheDocument();
  });

  it("mostra carregamento (não \"Indisponível\") enquanto os blocos não respondem", async () => {
    [getFrota, getReservas, getFinanceiro, getUtilizacao].forEach((fn) => fn.mockReturnValueOnce(new Promise(() => {})));
    render(<App />);

    expect(await screen.findByRole("heading", { name: /painel do locador/i })).toBeInTheDocument();
    expect(screen.getAllByText("Carregando…").length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText("Indisponível")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Resumo da operação" })).toHaveAttribute("aria-busy", "true");
  });
});
