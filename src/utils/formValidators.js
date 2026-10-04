import { t } from "../i18n";
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

// Mesmo algoritmo de isValidCnh (mova-backend/src/shared/documentos.ts).
export function isCnhValida(cnh) {
  const c = onlyDigits(cnh || "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  let soma = 0;
  for (let i = 0, peso = 9; i < 9; i += 1, peso -= 1) soma += Number(c[i]) * peso;
  let dsc = 0;
  let dv1 = soma % 11;
  if (dv1 >= 10) {
    dv1 = 0;
    dsc = 2;
  }

  soma = 0;
  for (let i = 0, peso = 1; i < 9; i += 1, peso += 1) soma += Number(c[i]) * peso;
  let dv2 = soma % 11;
  if (dv2 >= 10) dv2 = 0;
  dv2 -= dsc;
  if (dv2 < 0) dv2 += 11;

  return dv1 === Number(c[9]) && dv2 === Number(c[10]);
}

function cnhError(cnh) {
  if (!/^[0-9]{11}$/.test(onlyDigits(cnh || ""))) return t("validation.cnhDigits");
  return isCnhValida(cnh) ? null : t("validation.cnhInvalid");
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
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (!values.senha.trim()) {
    nextErrors.senha = t("validation.passwordRequired");
  } else if (values.senha.length < 8) {
    nextErrors.senha = t("validation.loginPasswordLength");
  }

  return nextErrors;
}

export function validateForgotPasswordForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  return nextErrors;
}

export function validateResetPasswordForm(values) {
  const nextErrors = {};

  if (!values.token) {
    nextErrors.token = t("validation.resetLinkInvalid");
  }

  if (!values.novaSenha?.trim()) {
    nextErrors.novaSenha = t("validation.newPasswordRequired");
  } else if (!isSenhaForte(values.novaSenha)) {
    nextErrors.novaSenha =
      t("validation.passwordStrong");
  }

  if (!values.confirmarNovaSenha?.trim()) {
    nextErrors.confirmarNovaSenha = t("validation.confirmNewPassword");
  } else if (values.novaSenha !== values.confirmarNovaSenha) {
    nextErrors.confirmarNovaSenha = t("validation.passwordsMismatch");
  }

  return nextErrors;
}

export function validateRegisterForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = t("validation.nameRequired");

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone))) {
    nextErrors.celphone = t("validation.mobileRequired");
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cpf))) {
    nextErrors.cpf = t("validation.cpfDigits");
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cnh))) {
    nextErrors.cnh = t("validation.cnhDigits");
  }

  if (!values.address.trim()) {
    nextErrors.address = t("validation.addressRequired");
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep))) {
    nextErrors.cep = t("validation.cepDigits");
  }

  if (!values.password.trim()) {
    nextErrors.password = t("validation.passwordRequired");
  } else if (values.password.length < 8) {
    nextErrors.password = t("validation.passwordMinLength");
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = t("validation.confirmPassword");
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = t("validation.passwordsMismatch");
  }

  return nextErrors;
}

export function validateCadastroContaForm(values) {
  const nextErrors = {};

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (!values.password.trim()) {
    nextErrors.password = t("validation.passwordRequired");
  } else if (!isSenhaForte(values.password)) {
    nextErrors.password =
      t("validation.passwordStrong");
  }

  return nextErrors;
}

export function validateCadastroDetalhesForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = t("validation.nameRequired");

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = t("validation.mobileRequired");
  }

  if (!isCpfValido(values.cpf)) {
    nextErrors.cpf = t("validation.cpfInvalid");
  }

  const erroCnh = cnhError(values.cnh);
  if (erroCnh) nextErrors.cnh = erroCnh;

  const rgNormalizado = (values.rg || "").replace(/[.\-\s]/g, "").toUpperCase();
  if (!/^[0-9]{5,13}[0-9X]$/.test(rgNormalizado)) {
    nextErrors.rg = t("validation.rgInvalid");
  }

  if (!values.dataNascimento) {
    nextErrors.dataNascimento = t("validation.birthDateRequired");
  } else {
    const nascimento = new Date(values.dataNascimento);
    const hoje = new Date();

    if (Number.isNaN(nascimento.getTime()) || nascimento >= hoje) {
      nextErrors.dataNascimento = t("validation.birthDateInvalid");
    } else {
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const aindaNaoFezAniversario =
        hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
      if (aindaNaoFezAniversario) idade -= 1;

      if (idade < 18) {
        nextErrors.dataNascimento = t("validation.minimumAge");
      } else if (idade > 120) {
        nextErrors.dataNascimento = t("validation.birthDateInvalid");
      }
    }
  }

  if (!/^[0-9]{5}-?[0-9]{3}$/.test(values.cep || "")) {
    nextErrors.cep = t("validation.cepFormat");
  }

  if (!values.address?.trim()) {
    nextErrors.address = t("validation.residentialAddressRequired");
  }

  if (!values.agreeTerms) {
    nextErrors.agreeTerms = t("validation.termsRequired");
  }

  if (!values.agreePrivacy) {
    nextErrors.agreePrivacy = t("validation.privacyRequired");
  }

  return nextErrors;
}

export function validateLocatarioRegisterForm(values) {
  const nextErrors = {};

  if (!values.name.trim()) nextErrors.name = t("validation.nameRequired");

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = t("validation.phoneRequired");
  }

  if (!/^[0-9]{11}$/.test(onlyDigits(values.cpf))) {
    nextErrors.cpf = t("validation.cpfDigits");
  }

  const erroCnh = cnhError(values.cnh);
  if (erroCnh) nextErrors.cnh = erroCnh;

  if (!values.address?.trim()) {
    nextErrors.address = t("validation.addressRequired");
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = t("validation.cepDigits");
  }

  if (!values.password.trim()) {
    nextErrors.password = t("validation.passwordRequired");
  } else if (values.password.length < 8) {
    nextErrors.password = t("validation.passwordMinLength");
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = t("validation.confirmPassword");
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = t("validation.passwordsMismatch");
  }

  return nextErrors;
}

export function validateLocadorRegisterForm(values) {
  const nextErrors = {};

  if (!values.name?.trim()) {
    nextErrors.name = t("validation.ownerNameRequired");
  }

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = t("validation.phoneRequired");
  }

  if (!values.empresa.trim()) {
    nextErrors.empresa = t("validation.companyRequired");
  }

  if (!isCnpjValido(values.cnpj)) {
    nextErrors.cnpj = t("validation.cnpjInvalid");
  }

  if (!values.address?.trim()) {
    nextErrors.address = t("validation.addressRequired");
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = t("validation.cepDigits");
  }

  if (!values.password.trim()) {
    nextErrors.password = t("validation.passwordRequired");
  } else if (!isSenhaForte(values.password)) {
    nextErrors.password =
      t("validation.passwordStrong");
  }

  if (!values.confirmPassword?.trim()) {
    nextErrors.confirmPassword = t("validation.confirmPassword");
  } else if (values.confirmPassword !== values.password) {
    nextErrors.confirmPassword = t("validation.passwordsMismatch");
  }

  return nextErrors;
}

export function validateProfileForm(values) {
  const nextErrors = {};
  const isLocador = values.cargo === "LOCADOR" || values.profileType === "locador";

  if (!values.name.trim()) {
    nextErrors.name = t("validation.nameRequired");
  }

  if (!values.email.trim()) {
    nextErrors.email = t("validation.emailRequired");
  } else if (!isValidEmail(values.email)) {
    nextErrors.email = t("validation.emailInvalid");
  }

  if (isLocador) {
    if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
      nextErrors.celphone = t("validation.mobileRequired");
    }

    if (!values.empresa?.trim()) {
      nextErrors.empresa = t("validation.companyRequired");
    }

    if (!/^[0-9]{14}$/.test(onlyDigits(values.cnpj || ""))) {
      nextErrors.cnpj = t("validation.cnpjDigits");
    }

    if (!values.address?.trim()) {
      nextErrors.address = t("validation.addressRequired");
    }

    if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
      nextErrors.cep = t("validation.cepDigits");
    }

    return nextErrors;
  }

  if (!/^[0-9]{10,11}$/.test(onlyDigits(values.celphone || ""))) {
    nextErrors.celphone = t("validation.mobileRequired");
  }

  if (!isCpfValido(values.cpf)) {
    nextErrors.cpf = t("validation.cpfInvalid");
  }

  const erroCnh = cnhError(values.cnh);
  if (erroCnh) nextErrors.cnh = erroCnh;

  if (!values.address?.trim()) {
    nextErrors.address = t("validation.addressRequired");
  }

  if (!/^[0-9]{8}$/.test(onlyDigits(values.cep || ""))) {
    nextErrors.cep = t("validation.cepDigits");
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
