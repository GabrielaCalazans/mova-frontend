import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RelatoriosAvaliacoes from "./RelatoriosAvaliacoes";
import { getAvaliacaoDashboard } from "../services/dashboardService";

vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../services/dashboardService", () => ({ getAvaliacaoDashboard: vi.fn() }));

const resposta = {
  resumo: { total: 2, media: 4.5 },
  ranking: [{ veiculo: { id: "v1", placa: "ABC-1234", marca: "Fiat", modelo: "Argo" } }],
  mediaPorVeiculo: [{ veiculo: { id: "v1", placa: "ABC-1234" }, quantidade: 2, media: 4.5, maior: 5, menor: 4 }],
};

describe("RelatoriosAvaliacoes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra carregamento e dados reais", async () => {
    getAvaliacaoDashboard.mockResolvedValue(resposta);
    render(<MemoryRouter><RelatoriosAvaliacoes /></MemoryRouter>);
    expect(screen.getByText(/Carregando relatórios/)).toBeInTheDocument();
    expect(await screen.findByText(/2 avaliações · média 4.5/)).toBeInTheDocument();
    expect(screen.getByText(/ABC-1234: 4.5/)).toBeInTheDocument();
  });

  it("envia filtros suportados para a API", async () => {
    getAvaliacaoDashboard.mockResolvedValue(resposta);
    render(<MemoryRouter><RelatoriosAvaliacoes /></MemoryRouter>);
    await screen.findByRole("button", { name: "Baixar relatório de avaliações" });
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("Data final"), { target: { value: "2026-01-31" } });
    fireEvent.change(screen.getByLabelText("Veículo"), { target: { value: "v1" } });
    fireEvent.change(screen.getByLabelText("Nota mínima"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(getAvaliacaoDashboard).toHaveBeenLastCalledWith({ dataInicio: "2026-01-01", dataFim: "2026-01-31", idVeiculo: "v1", notaMin: "4" });
  });

  it("mostra vazio e erro", async () => {
    getAvaliacaoDashboard.mockResolvedValue({ resumo: { total: 0, media: 0 }, ranking: [], mediaPorVeiculo: [] });
    const { unmount } = render(<MemoryRouter><RelatoriosAvaliacoes /></MemoryRouter>);
    expect(await screen.findByText(/Nenhuma avaliação encontrada/)).toBeInTheDocument();
    unmount();
    getAvaliacaoDashboard.mockRejectedValue(new Error("falha"));
    render(<MemoryRouter><RelatoriosAvaliacoes /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o relatório de avaliações.");
  });

  it("aplica os filtros recebidos pela navegação via URL", async () => {
    getAvaliacaoDashboard.mockResolvedValue(resposta);
    render(
      <MemoryRouter initialEntries={["/relatorios/avaliacoes?dataInicio=2026-01-01&dataFim=2026-01-31&idVeiculo=v1&notaMin=4"]}>
        <RelatoriosAvaliacoes />
      </MemoryRouter>,
    );

    await screen.findByText(/2 avaliações · média 4.5/);
    expect(getAvaliacaoDashboard).toHaveBeenCalledWith({ dataInicio: "2026-01-01", dataFim: "2026-01-31", idVeiculo: "v1", notaMin: "4" });
  });
});
