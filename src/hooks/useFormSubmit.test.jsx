import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFormSubmit } from "./useFormSubmit";

describe("useFormSubmit", () => {
  it("define feedback de erro quando validacao falha", async () => {
    const setFormErrors = vi.fn();
    const setFeedback = vi.fn();

    const { result } = renderHook(() =>
      useFormSubmit({
        values: { email: "" },
        validate: () => ({ email: "Informe seu e-mail." }),
        setFormErrors,
        setFeedback,
        getInvalidFeedback: () => ({
          type: "error",
          message: "Campos invalidos.",
        }),
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(setFormErrors).toHaveBeenCalledWith({ email: "Informe seu e-mail." });
    expect(setFeedback).toHaveBeenCalledWith({
      type: "error",
      message: "Campos invalidos.",
    });
  });

  it("executa onSubmit e feedback de sucesso quando validacao passa", async () => {
    const setFormErrors = vi.fn();
    const setFeedback = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue({ mode: "api", message: "ok" });

    const { result } = renderHook(() =>
      useFormSubmit({
        values: { email: "cliente@mova.com" },
        validate: () => ({}),
        setFormErrors,
        setFeedback,
        onSubmit,
        getValidFeedback: (_values, submitResult) => ({
          type: "success",
          message: submitResult.message,
        }),
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() });
    });

    expect(onSubmit).toHaveBeenCalledWith({ email: "cliente@mova.com" });
    expect(setFeedback).toHaveBeenCalledWith({
      type: "success",
      message: "ok",
    });
  });

  it("ignora um segundo envio enquanto o primeiro ainda está em andamento", async () => {
    let concluir;
    const onSubmit = vi.fn(() => new Promise((resolve) => { concluir = resolve; }));

    const { result } = renderHook(() =>
      useFormSubmit({
        values: { email: "cliente@mova.com" },
        validate: () => ({}),
        setFormErrors: vi.fn(),
        setFeedback: vi.fn(),
        onSubmit,
      })
    );

    await act(async () => {
      const primeiro = result.current.handleSubmit({ preventDefault: vi.fn() });
      const segundo = result.current.handleSubmit({ preventDefault: vi.fn() });
      concluir();
      await Promise.all([primeiro, segundo]);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
