import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ForgotPassword from "./ForgotPassword";
import { requestPasswordReset } from "../services/authService";

vi.mock("../services/authService", () => ({
  requestPasswordReset: vi.fn(),
}));

describe("ForgotPassword", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia e-mail, mostra loading e sucesso genérico", async () => {
    let resolveRequest;
    requestPasswordReset.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "user@example.com");
    const button = screen.getByRole("button", { name: /enviar link/i });
    await user.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Enviando");

    resolveRequest({
      message: "Se existir uma conta associada a este e-mail, enviaremos as instruções de recuperação.",
    });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Se existir"));
    expect(screen.queryByText(/não cadastrado|nao cadastrado/i)).not.toBeInTheDocument();
  });

  it("mostra erro de rede sem enumerar contas", async () => {
    requestPasswordReset.mockRejectedValue(new Error("Falha de rede"));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "user@example.com");
    await user.click(screen.getByRole("button", { name: /enviar link/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Falha de rede"));
    expect(screen.queryByText(/não cadastrado|nao cadastrado/i)).not.toBeInTheDocument();
  });
});
