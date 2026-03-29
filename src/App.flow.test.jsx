import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./services/authService", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

import { requestPasswordReset } from "./services/authService";

const requestPasswordResetMock = vi.mocked(requestPasswordReset);

describe("Fluxo de autenticacao", () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
    requestPasswordResetMock.mockResolvedValue({
      mode: "api",
      message: "Solicitacao de recuperacao enviada com sucesso.",
    });
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

  it("redireciona rota invalida para login", () => {
    window.history.pushState({}, "", "/rota-invalida");

    render(<App />);

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });
});
