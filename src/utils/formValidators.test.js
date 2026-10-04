import { describe, expect, it } from "vitest";
import {
  isCnhValida,
  validateCadastroDetalhesForm,
  validateForgotPasswordForm,
  validateLoginForm,
  validateLocadorRegisterForm,
  validateProfileForm,
  validateRegisterForm,
} from "./formValidators";

describe("formValidators", () => {
  it("valida formulario de recuperacao de senha", () => {
    expect(validateForgotPasswordForm({ email: "" })).toEqual({
      email: "Informe seu e-mail.",
    });

    expect(validateForgotPasswordForm({ email: "email-invalido" })).toEqual({
      email: "Digite um e-mail válido.",
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

  it("valida cadastro de locador com nome do proprietario", () => {
    const validValues = {
      name: "Maria Silva",
      email: "maria@empresa.com",
      celphone: "(11) 99999-8888",
      empresa: "Empresa Silva LTDA",
      cnpj: "12.345.678/0001-95",
      address: "Rua Exemplo, 123",
      cep: "12345-678",
      password: "Senha123!",
      confirmPassword: "Senha123!",
    };

    expect(validateLocadorRegisterForm(validValues)).toEqual({});
  });

  it("valida perfil de locador com campos comuns e empresa", () => {
    const validValues = {
      profileType: "locador",
      name: "Maria Silva",
      email: "maria@empresa.com",
      celphone: "(11) 99999-8888",
      empresa: "Empresa Silva LTDA",
      cnpj: "12.345.678/0001-99",
      address: "Rua Exemplo, 123",
      cep: "12345-678",
    };

    expect(validateProfileForm(validValues)).toEqual({});
  });

  it("valida digitos verificadores da CNH como o backend", () => {
    expect(isCnhValida("12345678900")).toBe(true);
    expect(isCnhValida("123.456.789-00")).toBe(true);
    expect(isCnhValida("12345678910")).toBe(false);
    expect(isCnhValida("11111111111")).toBe(false);
    expect(isCnhValida("1234567890")).toBe(false);
  });

  it("rejeita no cadastro CNH com 11 digitos mas DV invalido", () => {
    const base = {
      name: "Usuario Teste",
      celphone: "(11) 99999-9999",
      cpf: "123.456.789-09",
      rg: "123456789",
      dataNascimento: "1990-05-15",
      cep: "12345-678",
      address: "Rua Exemplo, 123",
      agreeTerms: true,
      agreePrivacy: true,
    };

    expect(validateCadastroDetalhesForm({ ...base, cnh: "12345678910" }).cnh).toBe("CNH inválida.");
    expect(validateCadastroDetalhesForm({ ...base, cnh: "123" }).cnh).toBe("CNH deve conter 11 dígitos.");
    expect(validateCadastroDetalhesForm({ ...base, cnh: "12345678900" })).toEqual({});
  });
});
