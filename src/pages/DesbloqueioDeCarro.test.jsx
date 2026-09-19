import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DesbloqueioDeCarro from "./DesbloqueioDeCarro";
import {
  desbloquearReserva,
  desbloquearReservaPorQr,
  getReservaById,
  listReservasDoLocatario,
} from "../services/reservaService";
import { getJourneyStep, updateJourneyStep } from "../utils/journeyStorage";
import { getAuthSession } from "../services/authSession";

// TASK 05 — a tela nunca decide o desbloqueio. Ela mostra o codigo que o
// backend gerou, envia o que o usuario digitou e so anuncia "Veiculo
// Desbloqueado" com a reserva que o POST devolveu.
// Ver auditoria/DESBLOQUEIO.md.

vi.mock("../services/reservaService", () => ({
  getReservaById: vi.fn(),
  listReservasDoLocatario: vi.fn(),
  desbloquearReserva: vi.fn(),
  desbloquearReservaPorQr: vi.fn(),
}));

vi.mock("../utils/journeyStorage", () => ({
  getJourneyStep: vi.fn(),
  updateJourneyStep: vi.fn(),
}));

vi.mock("../services/authSession", () => ({
  getAuthSession: vi.fn(),
}));

const navigate = vi.fn();
let location = { state: null, search: "" };
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
  useLocation: () => location,
}));

vi.mock("../components/BottomNav", () => ({
  default: () => null,
}));

const RESERVA_ID = "11111111-2222-4333-8444-555555555555";
const CODIGO = "ABCD-2345";
const COORD = { latitude: -23.5, longitude: -46.6 };

function reserva(overrides = {}) {
  return {
    id: RESERVA_ID,
    valorTotal: 250.5,
    status: "CONFIRMADA",
    statusPagamento: "SUCESSO",
    codigoDesbloqueio: CODIGO,
    codigoGeradoEm: "2026-09-17T12:00:00.000Z",
    codigoUsadoEm: null,
    dataHoraInicio: "2026-09-18T12:00:00.000Z",
    dataHoraFim: "2026-09-20T12:00:00.000Z",
    ...overrides,
  };
}

// Erro no formato do apiClient (ApiError carrega a mensagem do backend).
function erroApi(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

async function desbloquear() {
  await userEvent.click(
    screen.getByRole("button", { name: /Desbloquear veículo/i }),
  );
}

describe("DesbloqueioDeCarro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    location = { state: null, search: "" };
    getJourneyStep.mockReturnValue({ id: RESERVA_ID });
    getAuthSession.mockReturnValue({ user: { id: "locatario-1" } });
    getReservaById.mockResolvedValue(reserva());
    listReservasDoLocatario.mockResolvedValue([]);
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn((ok) => ok({ coords: COORD })) },
    });
  });

  // 1. O codigo exibido vem do backend, nao do sessionStorage.
  it("busca a reserva no backend e mostra o código que ele gerou", async () => {
    getJourneyStep.mockReturnValue({
      id: RESERVA_ID,
      codigoDesbloqueio: "XXXX-XXXX",
    });

    render(<DesbloqueioDeCarro />);

    await waitFor(() => {
      expect(screen.getByTestId("codigo-desbloqueio")).toHaveTextContent(CODIGO);
    });
    expect(getReservaById).toHaveBeenCalledWith(RESERVA_ID);
    // Nada de "desbloqueado" antes de o backend confirmar.
    expect(screen.queryByTestId("titulo-desbloqueado")).toBeNull();
  });

  // 2. Codigo correto: so depois do 200 a tela anuncia o desbloqueio.
  it("desbloqueia com o código correto e mostra a reserva EM_ANDAMENTO", async () => {
    desbloquearReserva.mockResolvedValue(
      reserva({
        status: "EM_ANDAMENTO",
        codigoUsadoEm: "2026-09-18T13:00:00.000Z",
      }),
    );

    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");

    await desbloquear();

    expect(desbloquearReserva).toHaveBeenCalledWith(
      RESERVA_ID,
      CODIGO,
      COORD,
    );
    expect(await screen.findByTestId("titulo-desbloqueado")).toBeInTheDocument();
    expect(screen.getByTestId("status-reserva")).toHaveTextContent(
      "EM_ANDAMENTO",
    );
  });

  // 3. Codigo incorreto (400): mensagem do backend, tela segue bloqueada.
  it("mostra o erro do backend quando o código é incorreto", async () => {
    desbloquearReserva.mockRejectedValue(
      erroApi("Código de desbloqueio inválido.", 400),
    );

    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");

    const campo = screen.getByLabelText(/Código de desbloqueio/i);
    await userEvent.clear(campo);
    await userEvent.type(campo, "ZZZZ-9999");
    await desbloquear();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Código de desbloqueio inválido.",
    );
    expect(screen.queryByTestId("titulo-desbloqueado")).toBeNull();
    expect(desbloquearReserva).toHaveBeenCalledWith(
      RESERVA_ID,
      "ZZZZ-9999",
      COORD,
    );
  });

  // 4. Recusas do backend (expirado, antes do horario, ja usado, geofence):
  // a tela repassa a mensagem e nunca inventa sucesso.
  it.each([
    ["expirado", "Código de desbloqueio expirado."],
    [
      "antes do horário",
      "O código só pode ser usado a partir da data de início da reserva.",
    ],
    ["já utilizado", "Código de desbloqueio já utilizado."],
    ["fora do local", "Fora do local permitido para desbloqueio."],
    [
      "sem referência do veículo",
      "Localização de referência do veículo indisponível para desbloqueio.",
    ],
  ])("recusa do backend (%s) aparece na tela", async (_caso, mensagem) => {
    desbloquearReserva.mockRejectedValue(erroApi(mensagem, 409));

    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");

    await desbloquear();

    expect(await screen.findByRole("alert")).toHaveTextContent(mensagem);
    expect(screen.queryByTestId("titulo-desbloqueado")).toBeNull();
  });

  // 5. Desbloqueio duplicado: o formulario some, nao ha segundo envio.
  it("no desbloqueio duplicado mantém o veículo desbloqueado", async () => {
    desbloquearReserva.mockResolvedValueOnce(
      reserva({
        status: "EM_ANDAMENTO",
        codigoUsadoEm: "2026-09-18T13:00:00.000Z",
      }),
    );

    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");
    await desbloquear();

    expect(await screen.findByTestId("titulo-desbloqueado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Desbloquear veículo/i }),
    ).toBeNull();
    expect(desbloquearReserva).toHaveBeenCalledTimes(1);
  });

  // 6. Reserva ja desbloqueada em outra sessao: o GET manda.
  it("mostra desbloqueado quando a reserva já traz codigoUsadoEm", async () => {
    getReservaById.mockResolvedValue(
      reserva({
        status: "EM_ANDAMENTO",
        codigoUsadoEm: "2026-09-18T13:00:00.000Z",
      }),
    );

    render(<DesbloqueioDeCarro />);

    expect(await screen.findByTestId("titulo-desbloqueado")).toBeInTheDocument();
    expect(desbloquearReserva).not.toHaveBeenCalled();
  });

  // 7. Sessao perdida: o id e recuperado pela API, nao pelo sessionStorage.
  it("recupera a reserva pela API quando a jornada local se perdeu", async () => {
    getJourneyStep.mockReturnValue({ id: "" });
    listReservasDoLocatario.mockResolvedValue([
      reserva({
        id: "outra",
        status: "REALIZADA",
        codigoDesbloqueio: "ZZZZ-1111",
      }),
      // Reserva anterior JA desbloqueada: nao pode roubar a vez da pendente.
      reserva({
        id: "ja-desbloqueada",
        status: "EM_ANDAMENTO",
        codigoDesbloqueio: "WWWW-2222",
        codigoUsadoEm: "2026-09-17T13:00:00.000Z",
        dataHoraInicio: "2026-09-17T12:00:00.000Z",
      }),
      reserva(),
    ]);

    render(<DesbloqueioDeCarro />);

    await waitFor(() => {
      expect(screen.getByTestId("codigo-desbloqueio")).toHaveTextContent(CODIGO);
    });
    expect(getReservaById).not.toHaveBeenCalled();
    expect(listReservasDoLocatario).toHaveBeenCalledWith("locatario-1");
    expect(updateJourneyStep).toHaveBeenCalledWith(
      "reserva",
      expect.objectContaining({ id: RESERVA_ID, codigoDesbloqueio: CODIGO }),
    );
  });

  // 8. Nenhuma reserva desbloqueavel.
  it("informa quando não há reserva para desbloquear", async () => {
    getJourneyStep.mockReturnValue({ id: "" });
    listReservasDoLocatario.mockResolvedValue([]);

    render(<DesbloqueioDeCarro />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Não encontramos nenhuma reserva confirmada/i,
    );
  });

  // 9. Reserva inexistente (404) ou sem acesso (403): erro do GET na tela.
  it("propaga o erro do GET (reserva inexistente / sem acesso)", async () => {
    getReservaById.mockRejectedValue(erroApi("Reserva não encontrada", 404));

    render(<DesbloqueioDeCarro />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reserva não encontrada",
    );
  });

  // 10. Sem pagamento confirmado nao existe codigo — e nem formulario.
  it("não oferece desbloqueio enquanto o pagamento não foi confirmado", async () => {
    getReservaById.mockResolvedValue(
      reserva({
        status: "AGUARDANDO_PAGAMENTO",
        statusPagamento: "AGUARDANDO_PAGAMENTO",
        codigoDesbloqueio: null,
      }),
    );

    render(<DesbloqueioDeCarro />);

    expect(
      await screen.findByText(/Pagamento ainda não confirmado/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Desbloquear veículo/i }),
    ).toBeNull();
  });

  // 11. QR: deep link /desbloqueio?qr=<token> usa o endpoint do QR.
  it("usa o endpoint de QR quando a URL traz o token", async () => {
    location = { state: null, search: "?qr=token-assinado" };
    desbloquearReservaPorQr.mockResolvedValue(
      reserva({
        status: "EM_ANDAMENTO",
        codigoUsadoEm: "2026-09-18T13:00:00.000Z",
      }),
    );

    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");

    await userEvent.click(
      screen.getByRole("button", { name: /Desbloquear pelo QR Code/i }),
    );

    expect(await screen.findByTestId("titulo-desbloqueado")).toBeInTheDocument();
    expect(desbloquearReservaPorQr).toHaveBeenCalledWith(
      RESERVA_ID,
      "token-assinado",
      COORD,
    );
    expect(desbloquearReserva).not.toHaveBeenCalled();
  });

  it.each([
    ["permissão negada", { code: 1 }, /Permissão de localização negada/],
    ["localização indisponível", { code: 2 }, /Localização indisponível/],
    ["timeout", { code: 3 }, /Tempo esgotado/],
  ])("não envia desbloqueio quando há %s", async (_caso, erro, mensagem) => {
    navigator.geolocation.getCurrentPosition.mockImplementation((_ok, falha) => falha(erro));
    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");
    await desbloquear();
    expect(await screen.findByRole("alert")).toHaveTextContent(mensagem);
    expect(desbloquearReserva).not.toHaveBeenCalled();
    expect(screen.queryByTestId("titulo-desbloqueado")).toBeNull();
  });

  it("não envia desbloqueio quando o navegador não suporta geolocalização", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");
    await desbloquear();
    expect(await screen.findByRole("alert")).toHaveTextContent(/não oferece geolocalização/);
    expect(desbloquearReserva).not.toHaveBeenCalled();
  });

  it("não envia coordenadas inválidas nem declara sucesso", async () => {
    navigator.geolocation.getCurrentPosition.mockImplementation((ok) => ok({ coords: { latitude: NaN, longitude: 200 } }));
    render(<DesbloqueioDeCarro />);
    await screen.findByTestId("codigo-desbloqueio");
    await desbloquear();
    expect(await screen.findByRole("alert")).toHaveTextContent(/localização inválida/);
    expect(desbloquearReserva).not.toHaveBeenCalled();
    expect(screen.queryByTestId("titulo-desbloqueado")).toBeNull();
  });
});
