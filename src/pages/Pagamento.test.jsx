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
  getPagamentoReserva: vi.fn(),
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

  it("mantem estado pendente ao recarregar reserva PROCESSANDO", async () => {
    getReservaById.mockResolvedValue(reserva({ statusPagamento: "PROCESSANDO" }));

    render(<Pagamento />);

    await waitFor(() =>
      expect(screen.getByText(/Processando pagamento/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /^Pagar$/i })).not.toBeInTheDocument();
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

  it("não reabre pagamento nem mostra sucesso para reserva cancelada", async () => {
    getReservaById.mockResolvedValue(
      reserva({ status: "CANCELADA", statusPagamento: "SUCESSO", codigoDesbloqueio: "AB12-CD34" }),
    );

    render(<Pagamento />);

    expect(await screen.findByRole("heading", { name: /Reserva cancelada/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pagar$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Pagamento aprovado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AB12-CD34/i)).not.toBeInTheDocument();
  });

  // Task 10 (BUG-05): prazo de 15 min visível e reserva expirada encerrada.
  it("informa até quando a reserva fica garantida aguardando o pagamento", async () => {
    getReservaById.mockResolvedValue(reserva({ criadaEm: "2026-10-05T15:00:00.000Z" }));
    render(<Pagamento />);
    const aviso = await screen.findByText(/garantida até/i);
    expect(aviso).toHaveTextContent("12:15");
    expect(aviso).toHaveTextContent(/15 minutos/);
  });

  it("reserva expirada mostra encerramento próprio, sem botão de pagar", async () => {
    getReservaById.mockResolvedValue(reserva({ status: "CANCELADA", statusPagamento: "FALHA", expiradaEm: "2026-10-05T15:15:00.000Z" }));
    render(<Pagamento />);
    expect(await screen.findByRole("heading", { name: /Reserva expirada/i })).toBeInTheDocument();
    expect(screen.getByText(/veículo foi liberado/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pagar$/i })).not.toBeInTheDocument();
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
  // Task 10.1 (Bug A): veículo indisponível → 409; nada de sucesso, botão segue disponível.
  it("veículo indisponível: mostra o motivo, não confirma e permite tentar de novo", async () => {
    iniciarPagamento.mockRejectedValue(Object.assign(
      new Error("O veículo desta reserva está indisponível no momento. O pagamento não foi confirmado e nenhum valor foi cobrado."),
      { status: 409, code: "VEICULO_INDISPONIVEL_PARA_CONFIRMAR_RESERVA" },
    ));
    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");
    await userEvent.selectOptions(screen.getByLabelText(/Método de pagamento/i), "PIX");
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    expect(await screen.findByText(/veículo desta reserva está indisponível/i)).toBeInTheDocument();
    expect(screen.queryByText(/Pagamento aprovado/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pagar$/i })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();
  });

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

  it.each([
    [{ nome: "AB" }, /nome do titular \(mínimo 3 caracteres\)/i],
    [{ validade: "1" }, /validade no formato MM\/AA/i],
    [{ validade: "0120" }, /Cartão vencido/i],
    [{ cvv: "12" }, /CVV deve ter 3 ou 4 dígitos/i],
  ])("valida dados do cartão no cliente (%o)", async (campos, mensagem) => {
    const dados = { nome: "FULANO", validade: "1230", cvv: "123", ...campos };
    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await userEvent.type(screen.getByLabelText(/Número do Cartão/i), "4111111111111234");
    await userEvent.type(screen.getByLabelText(/Nome do Titular/i), dados.nome);
    await userEvent.type(screen.getByLabelText(/Validade/i), dados.validade);
    await userEvent.type(screen.getByLabelText(/CVV/i), dados.cvv);
    await userEvent.click(screen.getByRole("button", { name: /^Pagar$/i }));

    expect(await screen.findByText(mensagem)).toBeInTheDocument();
    expect(iniciarPagamento).not.toHaveBeenCalled();
  });

  it("identifica o QR Code como simulação sem transferência real", async () => {
    render(<Pagamento />);
    await screen.findByTestId("valor-reserva");

    await userEvent.selectOptions(screen.getByLabelText(/Método de pagamento/i), "PIX");
    await userEvent.click(screen.getByRole("button", { name: /Ver QR Code/i }));

    expect(screen.getByText(/QR Code ilustrativo; nenhuma transferência é feita/i)).toBeInTheDocument();
  });
});
