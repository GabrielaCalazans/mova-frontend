import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  clearAuthSessionMock,
  getAuthSessionMock,
  fetchCurrentUserProfileMock,
} = vi.hoisted(() => ({
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
  deleteAccount: vi.fn(),
  fetchCurrentUserProfile: fetchCurrentUserProfileMock,
  updateUserProfile: vi.fn(),
}));

vi.mock("../layout/AuthenticatedLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../components/FormField", () => ({
  default: ({ ariaLabel, ...props }) => <input aria-label={ariaLabel || props.placeholder} {...props} />,
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
