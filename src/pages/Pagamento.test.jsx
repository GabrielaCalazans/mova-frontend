import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Pagamento from "./Pagamento";
import { getReservaById, iniciarPagamento } from "../services/reservaService";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";

// TASK 04 — a tela de pagamento nunca decide o resultado. Ela mostra o valor
// que o backend calculou, envia o metodo e observa o statusPagamento.
// Ver auditoria/PAGAMENTO.md.

vi.mock("../services/reservaService", () => ({
  getReservaById: vi.fn(),
  iniciarPagamento: vi.fn(),
}));

vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: vi.fn(),
  updateJourneyStep: vi.fn(),
}));

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

vi.mock("../components/BottomNav", () => ({
  default: () => null,
}));

const RESERVA_ID = "11111111-2222-4333-8444-555555555555";

function reserva(overrides = {}) {
  return {
    id: RESERVA_ID,
    valorTotal: 250.5,
    status: "AGUARDANDO_PAGAMENTO",
    statusPagamento: "AGUARDANDO_PAGAMENTO",
    codigoDesbloqueio: null,
    ...overrides,
  };
}

async function preencherCartao(numero) {
  await userEvent.type(screen.getByLabelText(/Número do Cartão/i), numero);
  await userEvent.type(screen.getByLabelText(/Nome do Titular/i), "FULANO");
  await userEvent.type(screen.getByLabelText(/Validade/i), "1230");
  await userEvent.type(screen.getByLabelText(/CVV/i), "123");
}

describe("Pagamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getJourneyStep.mockReturnValue({ id: RESERVA_ID });
    getReservaById.mockResolvedValue(reserva());
  });

  // 1. Carregamento
  it("carrega a reserva e exibe o valor calculado pelo backend", async () => {
    render(<Pagamento />);

    expect(screen.getByText(/Carregando sua reserva/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("valor-reserva")).toHaveTextContent("250,50");
    });
    expect(getReservaById).toHaveBeenCalledWith(RESERVA_ID);
  });

  // 2. Seleção de método
  it("envia o método escolhido e não envia valor nem status", async () => {
    iniciarPagamento.mockResolvedValue({
      reserva: reserva({ statusPagamento: "SUCESSO", status: "CONFIRMADA" }),
      valorCobrado: 250.5,
    });

    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await userEvent.selectOptions(
      screen.getByLabelText(/Método de pagamento/i),
      "PIX",
    );
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() => expect(iniciarPagamento).toHaveBeenCalled());

    const [id, corpo] = iniciarPagamento.mock.calls[0];
    expect(id).toBe(RESERVA_ID);
    expect(corpo.metodoPagamento).toBe("PIX");
    // O cliente não declara resultado nem preço.
    expect(corpo).not.toHaveProperty("valor");
    expect(corpo).not.toHaveProperty("valorTotal");
    expect(corpo).not.toHaveProperty("statusPagamento");
    // PIX não pede cartão.
    expect(corpo.cartao).toBeUndefined();
  });

  // 3. Processamento
  it("mostra PROCESSANDO e não anuncia sucesso enquanto o gateway não decide", async () => {
    iniciarPagamento.mockResolvedValue({
      reserva: reserva({ statusPagamento: "PROCESSANDO" }),
      valorCobrado: 250.5,
    });

    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await preencherCartao("4111111111110001");
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() =>
      expect(screen.getByText(/Processando pagamento/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Pagamento aprovado/i)).not.toBeInTheDocument();
  });

  // 4. Sucesso
  it("só mostra sucesso com a confirmação real do backend", async () => {
    iniciarPagamento.mockResolvedValue({
      reserva: reserva({
        statusPagamento: "SUCESSO",
        status: "CONFIRMADA",
        codigoDesbloqueio: "AB12-CD34",
      }),
      valorCobrado: 250.5,
    });

    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await preencherCartao("4111111111111234");
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() =>
      expect(screen.getByText(/Pagamento aprovado/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/AB12-CD34/)).toBeInTheDocument();
    expect(updateJourneyStep).toHaveBeenCalledWith(
      "reserva",
      expect.objectContaining({ codigoDesbloqueio: "AB12-CD34" }),
    );
  });

  // 5. Falha
  it("pagamento recusado: mostra erro e nenhum sucesso", async () => {
    iniciarPagamento.mockResolvedValue({
      reserva: reserva({ statusPagamento: "FALHA" }),
      valorCobrado: 250.5,
    });

    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await preencherCartao("4111111111110000");
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() =>
      expect(screen.getByText(/Pagamento não aprovado/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Pagamento aprovado/i)).not.toBeInTheDocument();
  });

  // 6. Erro da API
  it("erro da API: mostra a mensagem e não confirma nada", async () => {
    iniciarPagamento.mockRejectedValue(
      new Error("O pagamento desta reserva já foi aprovado."),
    );

    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await userEvent.selectOptions(
      screen.getByLabelText(/Método de pagamento/i),
      "PIX",
    );
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/O pagamento desta reserva já foi aprovado/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Pagamento aprovado/i)).not.toBeInTheDocument();
  });

  it("sem reserva na jornada: orienta a voltar ao checkout", async () => {
    getJourneyStep.mockReturnValue(null);

    render(<Pagamento />);

    await waitFor(() =>
      expect(
        screen.getByText(/Não encontramos sua reserva/i),
      ).toBeInTheDocument(),
    );
    expect(getReservaById).not.toHaveBeenCalled();
  });

  it("cartão inválido é barrado antes de chamar a API", async () => {
    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await userEvent.type(screen.getByLabelText(/Número do Cartão/i), "4111");
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Informe um número de cartão válido/i),
      ).toBeInTheDocument(),
    );
    expect(iniciarPagamento).not.toHaveBeenCalled();
  });
});
