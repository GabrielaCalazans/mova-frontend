import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getAuthSession = vi.fn();
vi.mock("../services/authSession", () => ({
  AUTH_SESSION_CHANGED_EVENT: "mova:auth-session-changed",
  getAuthSession: () => getAuthSession(),
}));

import { useAuthSession } from "./useAuthSession";

describe("useAuthSession", () => {
  // Task 11: a sessão pode mudar entre a primeira renderização e a inscrição
  // nos eventos (ex.: subárvore suspensa carregando um chunk). O hook precisa
  // reler a sessão ao assinar, senão a mudança é perdida até o próximo evento.
  it("relê a sessão ao assinar os eventos (mudança ocorrida antes da inscrição)", () => {
    const antes = { token: "owner-token", user: { id: "owner-1", cargo: "LOCADOR" } };
    const depois = { token: "renter-token", user: { id: "renter-1", cargo: "LOCATARIO" } };
    getAuthSession.mockReturnValueOnce(antes).mockReturnValue(depois);

    const { result } = renderHook(() => useAuthSession());

    expect(result.current).toEqual(depois);
  });
});
