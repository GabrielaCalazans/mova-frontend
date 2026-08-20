function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

export function isCpfValido(cpf) {
  const digits = onlyDigits(cpf || "");

  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const digito1 = calcularDigitoCpf(digits.slice(0, 9));
  const digito2 = calcularDigitoCpf(digits.slice(0, 9) + digito1);

  return digits.slice(9) === digito1 + digito2;
}

function calcularDigitoCpf(base) {
  let soma = 0;
  for (let i = 0; i < base.length; i += 1) {
    soma += Number(base[i]) * (base.length + 1 - i);
  }
  const resto = soma % 11;
  return resto < 2 ? "0" : String(11 - resto);
}

export function isCnpjValido(cnpj) {
  const digits = onlyDigits(cnpj || "");

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  function calcularDigito(base, pesos) {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += Number(base[i]) * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? "0" : String(11 - resto);
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digito1cnpj = calcularDigito(digits.slice(0, 12), pesos1);
  const digito2cnpj = calcularDigito(digits.slice(0, 12) + digito1cnpj, pesos2);

  return digits.slice(12) === digito1cnpj + digito2cnpj;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (!values.senha.trim()) {
    nextErrors.senha = "Informe sua senha.";
  } else if (values.senha.length < 8) {
    nextErrors.senha = "A senha precisa ter mais de 7 caracteres.";
  }

  return nextErrors;
}

export function validateForgotPasswordForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  return nextErrors;
}

export function validateRegisterForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = "Informe seu nome completo.";

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone))) {
    nextErrors.celphone = "Informe celular com DDD (10 ou 11 digitos).";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cpf))) {
    nextErrors.cpf = "CPF deve conter 11 digitos.";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cnh))) {
    nextErrors.cnh = "CNH deve conter 11 digitos.";
  }

  if (!values.address.trim()) {
    nextErrors.address = "Informe seu endereco completo.";
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep))) {
    nextErrors.cep = "CEP deve conter 8 digitos.";
  }

  if (!values.password.trim()) {
    nextErrors.password = "Informe sua senha.";
  } else if (values.password.length < 8) {
    nextErrors.password = "Senha deve ter pelo menos 8 caracteres.";
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = "Repita a senha para confirmar.";
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = "As senhas devem ser iguais.";
  }

  return nextErrors;
}

export function validateCadastroContaForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (!values.password.trim()) {
    nextErrors.password = "Informe sua senha.";
  } else if (!isSenhaForte(values.password)) {
    nextErrors.password =
      "Senha deve ter 8+ caracteres, com maiuscula, minuscula, numero e caractere especial.";
  }

  return nextErrors;
}

export function validateCadastroDetalhesForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = "Informe seu nome completo.";

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = "Informe celular com DDD (10 ou 11 digitos).";
  }

  if (!isCpfValido(values.cpf)) {
    nextErrors.cpf = "CPF invalido. Confira os numeros digitados.";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cnh))) {
    nextErrors.cnh = "CNH deve conter 11 digitos.";
  }

  const rgNormalizado = (values.rg || "").replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^[0-9]{5,13}[0-9X]$/.test(rgNormalizado)) {
    nextErrors.rg = "RG invalido (apenas numeros, com digito verificador opcional X).";
  }

  if (!values.dataNascimento) {
    nextErrors.dataNascimento = "Informe sua data de nascimento.";
  } else {
    const nascimento = new Date(values.dataNascimento);
    const hoje = new Date();

    if (Number.isNaN(nascimento.getTime()) || nascimento >= hoje) {
      nextErrors.dataNascimento = "Data de nascimento invalida.";
    } else {
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
      if (aindaNaoFezAniversario) idade -= 1;

      if (idade < 18) {
        nextErrors.dataNascimento = "E preciso ter ao menos 18 anos para se cadastrar.";
      } else if (idade > 120) {
        nextErrors.dataNascimento = "Data de nascimento invalida.";
      }
    }
  }

  if (!/^[0-9]{5}-?[0-9]{3}$/.test(values.cep || "")) {
    nextErrors.cep = "CEP deve estar no formato 12345-678.";
  }

  if (!values.address?.trim()) {
    nextErrors.address = "Informe seu endereco residencial.";
  }

  if (!values.agreeTerms) {
    nextErrors.agreeTerms = "E preciso concordar com os termos de uso.";
  }

  if (!values.agreePrivacy) {
    nextErrors.agreePrivacy = "E preciso concordar com os termos de privacidade.";
  }

  return nextErrors;
}

export function validateLocatarioRegisterForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = "Informe seu nome completo.";

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = "Informe telefone com DDD (10 ou 11 digitos).";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cpf))) {
    nextErrors.cpf = "CPF deve conter 11 digitos.";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cnh))) {
    nextErrors.cnh = "CNH deve conter 11 digitos.";
  }

  if (!values.address?.trim()) {
    nextErrors.address = "Informe seu endereco completo.";
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = "CEP deve conter 8 digitos.";
  }

  if (!values.password.trim()) {
    nextErrors.password = "Informe sua senha.";
  } else if (values.password.length < 8) {
    nextErrors.password = "Senha deve ter pelo menos 8 caracteres.";
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = "Repita a senha para confirmar.";
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = "As senhas devem ser iguais.";
  }

  return nextErrors;
}

export function validateLocadorRegisterForm(values) {
  const nextErrors = {};

  if (!values.name?.trim()) {
    nextErrors.name = "Informe o nome do proprietario.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = "Informe telefone com DDD (10 ou 11 digitos).";
  }

  if (!values.empresa.trim()) {
    nextErrors.empresa = "Informe a empresa.";
  }

  if (!isCnpjValido(values.cnpj)) {
    nextErrors.cnpj = "CNPJ invalido. Confira os numeros digitados.";
  }

  if (!values.address?.trim()) {
    nextErrors.address = "Informe seu endereco completo.";
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = "CEP deve conter 8 digitos.";
  }

  if (!values.password.trim()) {
    nextErrors.password = "Informe sua senha.";
  } else if (!isSenhaForte(values.password)) {
    nextErrors.password =
      "Senha deve ter 8+ caracteres, com maiuscula, minuscula, numero e caractere especial.";
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = "Repita a senha para confirmar.";
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = "As senhas devem ser iguais.";
  }

  return nextErrors;
}

export function validateProfileForm(values) {
  const nextErrors = {};
  const isLocador = values.cargo === "LOCADOR" || values.profileType === "locador";

  if (!values.name.trim()) {
    nextErrors.name = "Informe seu nome completo.";
  }

  if (!values.email.trim()) {
    nextErrors.email = "Informe seu e-mail.";
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = "Digite um e-mail valido.";
  }

  if (isLocador) {
    if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
      nextErrors.celphone = "Informe celular com DDD (10 ou 11 digitos).";
    }

    if (!values.empresa?.trim()) {
      nextErrors.empresa = "Informe a empresa.";
    }

    if (!/^[0-9]{14}$/.test(onlyDigits(values.cnpj || ""))) {
      nextErrors.cnpj = "CNPJ deve conter 14 digitos.";
    }

    if (!values.address?.trim()) {
      nextErrors.address = "Informe seu endereco completo.";
    }

    if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
      nextErrors.cep = "CEP deve conter 8 digitos.";
    }

    return nextErrors;
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = "Informe celular com DDD (10 ou 11 digitos).";
  }

  if (!isCpfValido(values.cpf)) {
    nextErrors.cpf = "CPF invalido. Confira os numeros digitados.";
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cnh || ""))) {
    nextErrors.cnh = "CNH deve conter 11 digitos.";
  }

  if (!values.address?.trim()) {
    nextErrors.address = "Informe seu endereco completo.";
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = "CEP deve conter 8 digitos.";
  }

  return nextErrors;
}

const SENHA_FORTE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isSenhaForte(password) {
  return SENHA_FORTE_REGEX.test(password || "");
}

export function getPasswordState(password) {
  if (password.length === 0) return "default";
  if (!isSenhaForte(password)) return "warning";
  return "success";
}