import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AvaliacaoReserva from "./AvaliacaoReserva";
import { getReservaById } from "../services/reservaService";
import { createAvaliacao, getAvaliacaoDaReserva } from "../services/avaliacaoService";

vi.mock("react-router-dom", () => ({ useLocation: () => ({ state: { reservaId: "11111111-2222-4333-8444-555555555555" } }) }));
vi.mock("../components/BottomNav", () => ({ default: () => null }));
vi.mock("../utils/journeyStorage", () => ({ getJourneyStep: () => null }));
vi.mock("../services/reservaService", () => ({ getReservaById: vi.fn() }));
vi.mock("../services/avaliacaoService", () => ({ createAvaliacao: vi.fn(), getAvaliacaoDaReserva: vi.fn() }));

const reservaRealizada = {
  id: "11111111-2222-4333-8444-555555555555", status: "REALIZADA",
  dataHoraInicio: "2026-09-18T12:00:00Z", dataHoraFim: "2026-09-19T12:00:00Z", valorTotal: 100,
  veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
};

describe("AvaliacaoReserva", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReservaById.mockResolvedValue(reservaRealizada);
    getAvaliacaoDaReserva.mockRejectedValue(new Error("Avaliação não encontrada para esta reserva"));
  });

  it("envia nota e comentário para reserva realizada e confirma a avaliação", async () => {
    createAvaliacao.mockResolvedValue({ id: "avaliacao-1", idReserva: reservaRealizada.id, nota: 4, comentario: "Ótimo carro" });
    render(<AvaliacaoReserva />);
    await screen.findByText(/Fiat Argo/);
    await userEvent.click(screen.getByRole("button", { name: "4 estrelas" }));
    await userEvent.type(screen.getByLabelText(/Comentário/), "Ótimo carro");
    await userEvent.click(screen.getByRole("button", { name: "Enviar Avaliação" }));
    expect(createAvaliacao).toHaveBeenCalledWith({ idReserva: reservaRealizada.id, nota: 4, comentario: "Ótimo carro" });
    expect(await screen.findByRole("status")).toHaveTextContent("Você já avaliou esta reserva com nota 4.");
    expect(screen.getByText("“Ótimo carro”")).toBeInTheDocument();
  });

  it("não oferece envio antes de a reserva ser realizada", async () => {
    getReservaById.mockResolvedValue({ ...reservaRealizada, status: "EM_ANDAMENTO" });
    render(<AvaliacaoReserva />);
    expect(await screen.findByText(/após a devolução/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar Avaliação" })).toBeNull();
    expect(createAvaliacao).not.toHaveBeenCalled();
  });

  it("mostra o erro da API e não declara sucesso para nota inválida", async () => {
    createAvaliacao.mockRejectedValue(new Error("A nota mínima é 1"));
    render(<AvaliacaoReserva />);
    await screen.findByRole("button", { name: "Enviar Avaliação" });
    await userEvent.click(screen.getByRole("button", { name: "Enviar Avaliação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A nota mínima é 1");
    expect(screen.queryByText(/Você já avaliou esta reserva/)).toBeNull();
  });

  it("mostra avaliação existente e não permite duplicidade", async () => {
    getAvaliacaoDaReserva.mockResolvedValue({ id: "avaliacao-1", nota: 5, comentario: "Excelente" });
    render(<AvaliacaoReserva />);
    expect(await screen.findByRole("status")).toHaveTextContent("Você já avaliou esta reserva com nota 5.");
    expect(screen.getByText("“Excelente”")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar Avaliação" })).toBeNull();
  });

  it("exibe recusa de acesso do backend", async () => {
    createAvaliacao.mockRejectedValue(new Error("Acesso negado"));
    render(<AvaliacaoReserva />);
    await screen.findByRole("button", { name: "Enviar Avaliação" });
    await userEvent.click(screen.getByRole("button", { name: "Enviar Avaliação" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Acesso negado");
  });
});
