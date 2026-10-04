import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  clearAuthSessionMock,
  getAuthSessionMock,
  fetchCurrentUserProfileMock,
  deleteAccountMock,
  exportarMeusDadosMock,
  anonimizarMinhaContaMock,
} = vi.hoisted(() => ({
  deleteAccountMock: vi.fn(),
  exportarMeusDadosMock: vi.fn(),
  anonimizarMinhaContaMock: vi.fn(),
  navigateMock: vi.fn(),
  clearAuthSessionMock: vi.fn(),
  getAuthSessionMock: vi.fn(),
  fetchCurrentUserProfileMock: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../services/authSession", () => ({
  clearAuthSession: clearAuthSessionMock,
  getAuthSession: getAuthSessionMock,
}));

vi.mock("../services/authService", () => ({
  changePassword: vi.fn(),
  deleteAccount: deleteAccountMock,
  fetchCurrentUserProfile: fetchCurrentUserProfileMock,
  updateUserProfile: vi.fn(),
}));

vi.mock("../services/lgpdService", () => ({
  exportarMeusDados: exportarMeusDadosMock,
  anonimizarMinhaConta: anonimizarMinhaContaMock,
}));

vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../components/FormField", () => ({
  default: ({ ariaLabel, helperText, ...props }) => (
    <>
      <input aria-label={ariaLabel || props.placeholder} {...props} />
      {helperText && <p>{helperText}</p>}
    </>
  ),
}));

vi.mock("../services/authIdentity", () => ({
  getUserCargo: () => "LOCATARIO",
}));

vi.mock("../utils/inputMasks", () => ({
  maskCelphone: (value) => value,
  maskCep: (value) => value,
  maskCpf: (value) => value,
  maskCnpj: (value) => value,
}));

vi.mock("../utils/formValidators", () => ({
  isSenhaForte: () => true,
  validateProfileForm: () => ({}),
}));

import Conta from "./Conta";

describe("Conta - sessao expirada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSessionMock.mockReturnValue({
      token: "jwt-token",
      user: { id: "conta-1", name: "Locatario", cargo: "LOCATARIO" },
    });
    fetchCurrentUserProfileMock.mockRejectedValue(
      new Error("sessao expirada. faca login novamente."),
    );
  });

  it("limpa a sessao e navega para login sem chamar setSession inexistente", async () => {
    render(<Conta />);

    await waitFor(() => expect(clearAuthSessionMock).toHaveBeenCalledTimes(1));
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });
});

describe("Conta - exclusão, LGPD e e-mail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSessionMock.mockReturnValue({
      token: "jwt-token",
      user: { id: "conta-1", name: "Locatario", email: "loc@mova.com", cargo: "LOCATARIO" },
    });
    fetchCurrentUserProfileMock.mockResolvedValue(null);
  });

  it("confirma exclusão em ModalDialog: Esc fecha e devolve o foco ao acionador", async () => {
    const user = userEvent.setup();
    render(<Conta />);

    const trigger = screen.getByRole("button", { name: "Deletar conta" });
    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "Excluir conta" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("409 na exclusão orienta a anonimização em vez de mostrar a rota da API", async () => {
    const user = userEvent.setup();
    deleteAccountMock.mockRejectedValue(Object.assign(
      new Error("A conta possui histórico de reservas e não pode ser excluída. Use a anonimização em POST /api/lgpd/anonimizar."),
      { status: 409, code: "ACCOUNT_HAS_HISTORY" },
    ));
    render(<Conta />);

    await user.click(screen.getByRole("button", { name: "Deletar conta" }));
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));

    expect(await screen.findByText(/não pode ser excluída. Você pode anonimizar seus dados em Privacidade \(LGPD\)/)).toBeInTheDocument();
    expect(screen.queryByText(/POST \/api\/lgpd/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anonimizar minha conta" })).toBeInTheDocument();
  });

  it("baixa os dados pessoais como meus-dados-mova.json", async () => {
    const user = userEvent.setup();
    const { createObjectURL, revokeObjectURL } = URL;
    URL.createObjectURL = vi.fn(() => "blob:dados");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    exportarMeusDadosMock.mockResolvedValue({ conta: { id: "conta-1" } });
    render(<Conta />);

    await user.click(screen.getByRole("button", { name: "Privacidade (LGPD)" }));
    await user.click(screen.getByRole("button", { name: "Baixar meus dados" }));

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(click.mock.instances[0].download).toBe("meus-dados-mova.json");
    expect(exportarMeusDadosMock).toHaveBeenCalledTimes(1);
    click.mockRestore();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it("anonimiza após confirmação, encerra a sessão e volta ao início", async () => {
    const user = userEvent.setup();
    anonimizarMinhaContaMock.mockResolvedValue({ anonimizado: true });
    render(<Conta />);

    await user.click(screen.getByRole("button", { name: "Privacidade (LGPD)" }));
    await user.click(screen.getByRole("button", { name: "Anonimizar minha conta" }));
    expect(anonimizarMinhaContaMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Anonimizar conta" }));

    await waitFor(() => expect(anonimizarMinhaContaMock).toHaveBeenCalledTimes(1));
    expect(clearAuthSessionMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
  });

  it("mostra o e-mail como somente leitura com a orientação", async () => {
    const user = userEvent.setup();
    render(<Conta />);

    await user.click(screen.getByRole("button", { name: "E-mail" }));

    expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
    expect(screen.getByText("O e-mail não pode ser alterado.")).toBeInTheDocument();
  });
});
