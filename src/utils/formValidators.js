function onlyDigits(value) {
  return value.replace(/\D/g, "");
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

  if (!/^[0-9]{14}$/.test(onlyDigits(values.cnpj))) {
    nextErrors.cnpj = "CNPJ deve conter 14 digitos.";
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

export function validateProfileForm(values) {
  const nextErrors = {};
  const isLocador = values.profileType === "locador";

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

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cpf || ""))) {
    nextErrors.cpf = "CPF deve conter 11 digitos.";
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

export function getPasswordState(password) {
  if (password.length === 0) return "default";
  if (password.length < 8) return "warning";
  return "success";
}