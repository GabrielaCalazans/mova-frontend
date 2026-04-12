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

import { requestPasswordReset } from "./services/authService";
import { loginUser } from "./services/authService";
import { saveAuthSession } from "./services/authSession";

const requestPasswordResetMock = vi.mocked(requestPasswordReset);
const loginUserMock = vi.mocked(loginUser);

describe("Fluxo de autenticacao", () => {
  beforeEach(() => {
    window.localStorage.clear();
    requestPasswordResetMock.mockReset();
    loginUserMock.mockReset();
    requestPasswordResetMock.mockResolvedValue({
      mode: "api",
      message: "Solicitacao de recuperacao enviada com sucesso.",
    });

    loginUserMock.mockImplementation(async () => {
      const response = {
        mode: "api",
        message: "Login realizado com sucesso.",
        token: "token-fake",
        user: {
          id: "1",
          name: "Cliente MOVA",
          email: "cliente@mova.com",
          profileType: "locatario",
          celphone: "(11) 99999-9999",
          cpf: "123.456.789-10",
          cnh: "12345678910",
          address: "Rua Exemplo, 100",
          cep: "12345-678",
        },
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

    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /selecionar/i }).length).toBeGreaterThan(0);
  });

  it("faz logout e limpa a sessao", async () => {
    const user = userEvent.setup();
    window.history.pushState({}, "", "/login");

    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /e-mail/i }), "cliente@mova.com");
    await user.type(screen.getByLabelText(/senha/i), "Senha12345");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByRole("heading", { name: /escolha o tipo de carro/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir menu/i }));
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
      await screen.findByRole("heading", { name: /cadastro de locatário/i })
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
});
