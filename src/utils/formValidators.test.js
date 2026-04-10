import { describe, expect, it } from "vitest";
import {
  validateForgotPasswordForm,
  validateLoginForm,
  validateRegisterForm,
} from "./formValidators";

describe("formValidators", () => {
  it("valida formulario de recuperacao de senha", () => {
    expect(validateForgotPasswordForm({ email: "" })).toEqual({
      email: "Informe seu e-mail.",
    });

    expect(validateForgotPasswordForm({ email: "email-invalido" })).toEqual({
      email: "Digite um e-mail valido.",
    });

    expect(validateForgotPasswordForm({ email: "user@example.com" })).toEqual({});
  });

  it("mantem regras de login", () => {
    const errors = validateLoginForm({ email: "", senha: "123" });

    expect(errors.email).toBe("Informe seu e-mail.");
    expect(errors.senha).toBe("A senha precisa ter mais de 7 caracteres.");
  });

  it("mantem regras principais de cadastro", () => {
    const validValues = {
      name: "Usuario Teste",
      email: "user@example.com",
      celphone: "(11) 99999-9999",
      cpf: "123.456.789-10",
      cnh: "12345678910",
      address: "Rua Exemplo, 123",
      cep: "12345-678",
      password: "12345678",
      confirmPassword: "12345678",
    };

    expect(validateRegisterForm(validValues)).toEqual({});
  });
});
