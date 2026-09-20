import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./services/authService", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  registerLocatario: vi.fn(),
  registerLocador: vi.fn(),
  requestPasswordReset: vi.fn(),
  updateUserProfile: vi.fn(),
  fetchCurrentUserProfile: vi.fn().mockResolvedValue(null),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("./services/veiculoService", () => ({
  getVeiculoById: vi.fn(),
  listVeiculos: vi.fn().mockResolvedValue([]),
}));

// As garagens deixaram de ser uma lista fixa no componente e passaram a vir de
// GET /api/garagem. Os ids são UUIDs, como no backend.
const LOCADOR_ID = "9a8b7c6d-5555-4e3f-2a1b-000000000099";

const GARAGENS_MOCK = [
  {
    id: "3f1d2c4e-1111-4a2b-9c3d-000000000001",
    nome: "Garagem Centro",
    endereco: "Av. Pompeia, 150",
    capacidade: 30,
    veiculosAlocados: 4,
    acessibilidade: true,
    status: "ATIVA",
  },
  {
    id: "3f1d2c4e-2222-4a2b-9c3d-000000000002",
    nome: "Garagem Sul",
    endereco: "Rua Jabuti, 172",
    capacidade: 20,
    veiculosAlocados: 2,
    acessibilidade: false,
    status: "ATIVA",
  },
];

vi.mock("./services/garagemService", () => ({
  listGaragens: vi.fn(() => Promise.resolve(GARAGENS_MOCK)),
  getGaragemById: vi.fn((id) =>
    Promise.resolve(GARAGENS_MOCK.find((g) => g.id === id) ?? null),
  ),
  createGaragem: vi.fn(),
  updateGaragem: vi.fn(),
  deleteGaragem: vi.fn(),
  listVeiculosDaGaragem: vi.fn().mockResolvedValue([]),
  alocarVeiculoNaGaragem: vi.fn(),
  desalocarVeiculoDaGaragem: vi.fn(),
}));

vi.mock("./services/reservationPricing", () => ({
  getReservationPricing: vi.fn().mockResolvedValue({
    dailyRate: 250,
    fees: 49.9,
    total: 549.9,
  }),
}));

import { getGaragemById, listGaragens } from "./services/garagemService";
import { requestPasswordReset } from "./services/authService";
import { loginUser } from "./services/authService";
import { saveAuthSession } from "./services/authSession";
import { getVeiculoById } from "./services/veiculoService";

const authenticatedUser = {
  id: "1",
  name: "Cliente MOVA",
  email: "cliente@mova.com",
  profileType: "locatario",
  celphone: "(11) 99999-9999",
  cpf: "123.456.789-10",
  cnh: "12345678910",
  address: "Rua Exemplo, 100",
  cep: "12345-678",
};

const requestPasswordResetMock = vi.mocked(requestPasswordReset);
const loginUserMock = vi.mocked(loginUser);
const getVeiculoByIdMock = vi.mocked(getVeiculoById);

describe("Fluxo de autenticacao", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    requestPasswordResetMock.mockReset();
    loginUserMock.mockReset();
    getVeiculoByIdMock.mockReset();
    requestPasswordResetMock.mockResolvedValue({
      mode: "api",
      message: "Solicitacao de recuperacao enviada com sucesso.",
    });

    loginUserMock.mockImplementation(async () => {
      const response = {
        mode: "api",
        message: "Login realizado com sucesso.",
        token: "token-fake",
        user: authenticatedUser,
      };

      saveAuthSession({ token: response.token, user: response.user });
      return response;
    });
  });

  it("faz login e redireciona locatario para tipos de carros", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /e-mail/i }), "cliente@mova.com");
    await user.type(screen.getByLabelText(/senha/i), "Senha12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(loginUserMock).toHaveBeenCalledWith({
      email: "cliente@mova.com",
      senha: "Senha12345",
    });

    expect(await screen.findByRole("heading", { name: /página inicial/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alugar um carro/i }));

    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar/i })).toBeInTheDocument();
  });

  it("faz logout e limpa a sessao", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /e-mail/i }), "cliente@mova.com");
    await user.type(screen.getByLabelText(/senha/i), "Senha12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByRole("heading", { name: /página inicial/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /perfil/i })[0]);
    await user.click(await screen.findByText(/^sair$/i));

    expect(await screen.findByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(window.localStorage.getItem("mova_auth_session")).toBeNull();
  });

  it("navega de login para recuperar senha e submete e-mail valido", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.click(screen.getByRole("link", { name: /esqueci minha senha/i }));

    expect(
      screen.getByRole("heading", { name: /recuperar senha/i })
    ).toBeInTheDocument();

    const submitButton = screen.getByRole("button", {
      name: /enviar link de recuperacao/i,
    });

    await user.click(submitButton);

    expect(await screen.findByText(/informe um e-mail valido para continuar\./i)).toBeInTheDocument();
    expect(await screen.findByText(/informe seu e-mail\./i)).toBeInTheDocument();

    const emailInput = screen.getByRole("textbox", { name: /e-mail/i });
    await user.type(emailInput, "cliente@mova.com");

    await user.click(submitButton);

    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: "cliente@mova.com",
    });

    expect(
      await screen.findByText(/solicitacao de recuperacao enviada com sucesso\./i)
    ).toBeInTheDocument();
  });

  it("vai do cadastro de locatario para cadastro de locador", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/cadastro");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /crie uma conta/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /seja um locador/i }));

    expect(
      await screen.findByRole("heading", { name: /cadastro de locador/i })
    ).toBeInTheDocument();
  });

  it("redireciona rota invalida para login", () => {
    window.history.pushState({}, "", "/rota-invalida");

    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  it("bloqueia fluxo sem sessao e redireciona para login", () => {
    window.history.pushState({}, "", "/tipos-carros");

    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });

  // A retirada NÃO é escolha do usuário: o backend exige que
  // idGaragemRetirada seja exatamente a garagem onde o veículo está alocado
  // (ReservaService.resolverGaragemRetirada). A tela apenas mostra qual é.
  it("retirada usa a garagem do veículo, sem oferecer escolha", async () => {
    saveAuthSession({ token: "token-fake", user: authenticatedUser });
    window.sessionStorage.setItem(
      "mova_journey_flow",
      JSON.stringify({
        veiculo: {
          id: "veic-1",
          idLocador: LOCADOR_ID,
          garagemId: GARAGENS_MOCK[0].id,
          marca: "Fiat",
          modelo: "Argo",
        },
      }),
    );

    window.history.pushState({}, "", "/escolha-garagem-retirada");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha a garagem para retirada/i })
    ).toBeInTheDocument();

    // Buscou a garagem do veículo por id, não a lista inteira.
    expect(getGaragemById).toHaveBeenCalledWith(GARAGENS_MOCK[0].id);
    expect(await screen.findByText(/garagem centro/i)).toBeInTheDocument();

    // Sem "Trocar garagem": não há escolha a fazer nesta etapa.
    expect(
      screen.queryByRole("button", { name: /trocar garagem/i })
    ).not.toBeInTheDocument();

    // Data e hora ficam liberadas; só elas bloqueiam o avanço.
    expect(screen.getByPlaceholderText(/digite a data/i)).not.toBeDisabled();
    expect(screen.getByPlaceholderText(/digite o horário/i)).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /ir para devolução/i })).toBeDisabled();
  });

  // A devolução é escolha do usuário, mas restrita: o backend exige que a
  // garagem pertença ao locador dono do veículo (assertGaragemDevolucao).
  it("devolução lista apenas garagens do locador dono do veículo", async () => {
    saveAuthSession({ token: "token-fake", user: authenticatedUser });
    window.sessionStorage.setItem(
      "mova_journey_flow",
      JSON.stringify({
        veiculo: {
          id: "veic-1",
          idLocador: LOCADOR_ID,
          garagemId: GARAGENS_MOCK[0].id,
        },
      }),
    );

    window.history.pushState({}, "", "/escolha-garagem-devolucao");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha a garagem para devolução/i })
    ).toBeInTheDocument();

    // Filtro por idLocador vai na query — é o backend que restringe a ATIVA.
    expect(listGaragens).toHaveBeenCalledWith({ idLocador: LOCADOR_ID });
    expect(await screen.findByRole("button", { name: /garagem centro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /garagem sul/i })).toBeInTheDocument();
  });

  it("redireciona a rota legada de agendamento para a nova retirada", async () => {
    saveAuthSession({ token: "token-fake", user: authenticatedUser });
    // A etapa de garagem exige um veículo escolhido (jornada veículo-primeiro).
    window.sessionStorage.setItem(
      "mova_journey_flow",
      JSON.stringify({
        veiculo: {
          id: "veic-1",
          idLocador: LOCADOR_ID,
          garagemId: GARAGENS_MOCK[0].id,
        },
      }),
    );

    window.history.pushState({}, "", "/agendamento");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha a garagem para retirada/i })
    ).toBeInTheDocument();
  });

  // A jornada é veículo-primeiro: o local de retirada sai do veículo, então
  // entrar direto na etapa de garagem não faz sentido.
  it("sem veículo escolhido, a etapa de garagem volta para a escolha do carro", async () => {
    saveAuthSession({ token: "token-fake", user: authenticatedUser });
    window.sessionStorage.clear();

    window.history.pushState({}, "", "/escolha-garagem-retirada");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha o tipo de carro/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /escolha a garagem para retirada/i })
    ).not.toBeInTheDocument();
  });

  it("mostra o checkout da reserva com dados persistidos", async () => {
    saveAuthSession({
      token: "token-fake",
      user: authenticatedUser,
    });

    window.sessionStorage.setItem(
      "mova_journey_flow",
      JSON.stringify({
        veiculo: {
          id: 42,
          nome: "Hatch Plus",
          marca: "Mova",
          modelo: "Hatch Plus",
          categoria: "Econômico",
          imagem: "",
          capacidade: 4,
          acessibilidade: "Sim",
          cambio: "Automático",
          ano: 2026,
          eletrico: true,
          adaptado: true,
          placa: "ABC1D23",
        },
        retirada: {
          garageId: 1,
          garageName: "Garagem Centro",
          garageAddress: "Rua Principal, 123",
          date: "10/06/2026",
          time: "10:00",
        },
        devolucao: {
          garageId: 2,
          garageName: "Garagem Sul",
          garageAddress: "Avenida Sul, 456",
          date: "12/06/2026",
          time: "10:00",
        },
      })
    );

    getVeiculoByIdMock.mockResolvedValue({
      id: 42,
      idLocador: LOCADOR_ID,
      idModeloVeiculo: "modelo-42",
      modeloVeiculo: {
        id: "modelo-42",
        idLocador: LOCADOR_ID,
        marca: "Mova",
        modelo: "Hatch Plus",
        ano: 2026,
        cambio: "Automatico",
        capacidade: 4,
        categoria: "ECONOMICO",
        eletrico: true,
        adaptado: true,
        valorDiaria: 250,
        criadoEm: "2026-09-20T00:00:00.000Z",
      },
      garagemId: null,
      garagem: null,
      placa: "ABC1D23",
      status: "DISPONIVEL",
      criadoEm: "2026-09-20T00:00:00.000Z",
    });

    window.history.pushState({}, "", "/checkout-reserva");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /checkout da reserva/i })).toBeInTheDocument();
    expect(screen.getAllByText(/hatch plus/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/garagem centro/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar e seguir para pagamento/i })).toBeInTheDocument();
  });
});
