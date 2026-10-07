import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Pagamento from "./Pagamento";
import ReservaDetalhe from "./ReservaDetalhe";
import { getReservaById } from "../services/reservaService";
import { getJourneyStep } from "../utils/journeyStorage";
import { setLocale } from "../i18n";

vi.mock("../services/reservaService", () => ({
  criarCompartilhamentoReserva: vi.fn(),
  getPagamentoReserva: vi.fn(),
  getQrDesbloqueio: vi.fn(),
  getReservaById: vi.fn(),
  iniciarPagamento: vi.fn(),
  revogarCompartilhamentoReserva: vi.fn(),
}));
vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: vi.fn(),
  updateJourneyStep: vi.fn(),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: "reserva-1" }),
}));

const reserva = {
  id: "reserva-1",
  status: "AGUARDANDO_PAGAMENTO",
  statusPagamento: "AGUARDANDO_PAGAMENTO",
  dataHoraInicio: "2026-09-18T12:00:00.000Z",
  dataHoraFim: "2026-09-19T12:00:00.000Z",
  valorTotal: 250.5,
  veiculo: { modeloVeiculo: { marca: "Fiat", modelo: "Argo" } },
  garagemRetirada: { id: "g1", nome: "Centro" },
  garagemDevolucao: { id: "g2", nome: "Aeroporto" },
};

const semNbsp = (texto) => texto.replace(/\s+/g, " ");

describe("ciclo da reserva em outros idiomas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReservaById.mockResolvedValue(reserva);
    getJourneyStep.mockReturnValue({ id: "reserva-1" });
  });

  afterEach(() => {
    setLocale("pt-BR");
  });

  it("ReservaDetalhe em inglês: textos, data en-US e valor em BRL", async () => {
    setLocale("en");
    render(<ReservaDetalhe />);

    expect(await screen.findByRole("heading", { level: 1, name: "Reservation details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "When and where" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay reservation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel reservation" })).toBeInTheDocument();
    expect(screen.getByText(/Sep 18, 2026/)).toBeInTheDocument();
    expect(semNbsp(screen.getByText(/250\.50/).textContent)).toBe("R$250.50");
    expect(document.title).toBe("MOVA - Reservation details");
  });

  it("Pagamento em espanhol: aviso de sandbox visível, data es-ES e valor em BRL", async () => {
    setLocale("es");
    render(<Pagamento />);

    const valor = await screen.findByTestId("valor-reserva");
    // es-ES escreve a moeda como "BRL" ou "R$" conforme a versão do ICU.
    expect(semNbsp(valor.textContent)).toMatch(/^250,50 (BRL|R\$)$/);
    expect(screen.getByRole("heading", { level: 1, name: "Pago" })).toBeInTheDocument();
    expect(screen.getByText("Entorno de pruebas: no se cobra ningún importe real.")).toBeInTheDocument();
    expect(screen.getByText("Pago y reembolso simulados: no se mueve dinero real.")).toBeInTheDocument();
    expect(screen.getByLabelText("Número de tarjeta")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagar" })).toBeInTheDocument();

    const dataEs = new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(reserva.dataHoraInicio));
    expect(dataEs).toMatch(/^18\/9\/26/); // dia/mês/ano curto, não o formato pt-BR "18/09/2026"
    expect(screen.getByText(dataEs)).toBeInTheDocument();
  });
});
