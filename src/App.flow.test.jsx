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

vi.mock("./services/reservationPricing", () => ({
  getReservationPricing: vi.fn().mockResolvedValue({
    dailyRate: 250,
    fees: 49.9,
    total: 549.9,
  }),
}));

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

<<<<<<< HEAD
    expect(await screen.findByRole("heading", { name: /página inicial/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /alugar um carro/i }));

    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar/i })).toBeInTheDocument();
=======
    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /selecionar/i }).length).toBeGreaterThan(0);
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
  });

  it("faz logout e limpa a sessao", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /e-mail/i }), "cliente@mova.com");
    await user.type(screen.getByLabelText(/senha/i), "Senha12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

<<<<<<< HEAD
    expect(await screen.findByRole("heading", { name: /página inicial/i })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /perfil/i })[0]);
=======
    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menu/i }));
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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
<<<<<<< HEAD
      await screen.findByRole("heading", { name: /crie uma conta/i })
=======
      await screen.findByRole("heading", { name: /cadastro de locatário/i })
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
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

  it("mostra a nova tela de retirada e bloqueia o avanço ate selecionar data e hora", async () => {
    const user = userEvent.setup();

    saveAuthSession({
      token: "token-fake",
      user: authenticatedUser,
    });

    window.history.pushState({}, "", "/escolha-garagem-retirada");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha a garagem para retirada/i })
    ).toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /ir para devolução/i });
    const dateInput = screen.getByPlaceholderText(/digite a data/i);
    const timeInput = screen.getByPlaceholderText(/digite o horário/i);

    expect(continueButton).toBeDisabled();
    expect(dateInput).toBeDisabled();
    expect(timeInput).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /garagem centro/i }));

    expect(screen.getByText(/garagem centro/i)).toBeInTheDocument();
    expect(screen.queryByText(/garagem sul/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/garagem norte/i)).not.toBeInTheDocument();
    expect(dateInput).not.toBeDisabled();
    expect(timeInput).not.toBeDisabled();
    expect(continueButton).toBeDisabled();
  });

  it("redireciona a rota legada de agendamento para a nova retirada", async () => {
    saveAuthSession({
      token: "token-fake",
      user: authenticatedUser,
    });

    window.history.pushState({}, "", "/agendamento");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: /escolha a garagem para retirada/i })
    ).toBeInTheDocument();
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
          caracteristicas: ["Ar-condicionado", "Bluetooth"],
          acessibilidade: "Sim",
          cambio: "Automático",
          autonomia: "320 km",
          combustivel: "Elétrico",
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
      nome: "Hatch Plus",
      categoria: "Econômico",
      cambio: "Automático",
      capacidade: 4,
      caracteristicas: ["Ar-condicionado", "Bluetooth"],
    });

    window.history.pushState({}, "", "/checkout-reserva");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /checkout da reserva/i })).toBeInTheDocument();
<<<<<<< HEAD
    expect(screen.getAllByText(/hatch plus/i).length).toBeGreaterThan(0);
=======
    expect(screen.getByText(/hatch plus/i)).toBeInTheDocument();
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
    expect(screen.getByText(/garagem centro/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirmar e seguir para pagamento/i })).toBeInTheDocument();
  });
});
