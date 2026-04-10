import { apiRequest, isApiConfigured } from "./apiClient";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "./authSession";

const AUTH_DEBUG_ENABLED = String(import.meta.env.VITE_AUTH_DEBUG).toLowerCase() === "true";

function authDebug(label, payload) {
  if (!AUTH_DEBUG_ENABLED) {
    return;
  }

  console.groupCollapsed(`[auth-debug] ${label}`);
  console.log(payload);
  console.groupEnd();
}

function normalizeError(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}

function normalizeUserProfile(values) {
  return {
    id: values.id,
    name: values.name,
    email: values.email,
    profileType: values.profileType,
    empresa: values.empresa,
    cnpj: values.cnpj,
    celphone: values.celphone,
    cpf: values.cpf,
    cnh: values.cnh,
    address: values.address,
    cep: values.cep,
  };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasProfileFields(value) {
  if (!isObject(value)) {
    return false;
  }

  return Boolean(
    value.id ||
      value._id ||
      value.nome ||
      value.name ||
      value.nomeCompleto ||
      value.nome_completo ||
      value.email ||
      value.empresa ||
      value.cnpj ||
      value.telefone ||
      value.celular ||
      value.celphone ||
      value.endereco ||
      value.address
  );
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getCandidateEmail(candidate) {
  if (!isObject(candidate)) {
    return "";
  }

  return normalizeEmail(candidate.email);
}

function pickProfileSource(candidates, fallbackEmail) {
  const targetEmail = normalizeEmail(fallbackEmail);

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const matchingByEmail = targetEmail
        ? candidate.find((item) => hasProfileFields(item) && getCandidateEmail(item) === targetEmail)
        : null;

      if (matchingByEmail) {
        return matchingByEmail;
      }

      const firstValid = candidate.find(hasProfileFields);
      if (firstValid) {
        return firstValid;
      }
      continue;
    }

    if (hasProfileFields(candidate)) {
      return candidate;
    }
  }

  return null;
}

function normalizeApiUser(payload, fallbackEmail) {
  const root = isObject(payload) ? payload : {};
  const result = isObject(root.result) ? root.result : null;
  const data = isObject(root.data) ? root.data : null;
  const nestedData = isObject(result?.data) ? result.data : null;
  const source = pickProfileSource([
    root.user,
    root.conta,
    result?.user,
    result?.conta,
    data?.user,
    data?.conta,
    nestedData?.user,
    nestedData?.conta,
    root.result,
    root.data,
    result?.data,
    result,
  ], fallbackEmail);

  if (!source) {
    return { email: fallbackEmail };
  }

  return {
    id: source.id || source._id,
    name: source.nome || source.name || source.nomeCompleto || source.nome_completo || source.fullName,
    email: source.email || fallbackEmail,
    empresa: source.empresa,
    cnpj: source.cnpj,
    celphone: source.telefone || source.celular || source.celphone,
    cpf: source.cpf,
    cnh: source.cnh,
    address: source.endereco || source.address || source.logradouro,
    cep: source.cep,
  };
}

function resolveProfileType(profileType, profile) {
  if (profileType === "locador" || profileType === "locatario") {
    return profileType;
  }

  if (profile?.empresa || profile?.cnpj) {
    return "locador";
  }

  return "locatario";
}

function isProfileNode(value) {
  return isObject(value) && Object.keys(value).length > 0;
}

function normalizeCurrentUserFromMe(payload) {
  const root = isObject(payload) ? payload : {};
  const result = isObject(root.result) ? root.result : {};
  const locadorNode = isProfileNode(result.locador) ? result.locador : null;
  const locatarioNode = isProfileNode(result.locatario) ? result.locatario : null;

  let profileType = "locatario";
  let roleData = {};

  if (locadorNode && !locatarioNode) {
    profileType = "locador";
    roleData = locadorNode;
  } else if (locatarioNode && !locadorNode) {
    profileType = "locatario";
    roleData = locatarioNode;
  } else if (locadorNode && locatarioNode) {
    profileType = "locador";
    roleData = locadorNode;
  }

  const user = {
    id: result.id || roleData.id,
    name: result.nome || result.name,
    email: result.email,
    celphone: result.telefone || roleData.telefone || roleData.celular || roleData.celphone || "",
    profileType,
    empresa: roleData.empresa || "",
    cnpj: roleData.cnpj || "",
    cpf: roleData.cpf || "",
    cnh: roleData.cnh || "",
    address: roleData.endereco || roleData.address || "",
    cep: roleData.cep || "",
  };

  return {
    user: {
      ...user,
      profileType: resolveProfileType(profileType, user),
    },
    profileSource: locadorNode ? "locador" : locatarioNode ? "locatario" : "none",
  };
}

function extractToken(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result = payload.result && typeof payload.result === "object" ? payload.result : null;

  return payload.token || result?.token || null;
}

function persistUserProfile(user, token) {
  const session = getAuthSession();
  const nextToken = token ?? session?.token ?? null;

  authDebug("persistUserProfile.input", {
    user,
    hasToken: Boolean(nextToken),
  });

  saveAuthSession({
    token: nextToken,
    user,
  });

  authDebug("persistUserProfile.savedSession", getAuthSession());
}

export async function loginUser({ email, senha }) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  try {
    const result = await apiRequest("/conta/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });

    authDebug("loginUser.apiResponse", result);

    const token = extractToken(result);

    if (!token) {
      throw new Error("Token de autenticacao nao retornado pela API.");
    }

    const apiUser = normalizeApiUser(result, email);
    const currentUser = await fetchCurrentUserProfile({
      authToken: token,
      persistToSession: false,
    });

    const user = {
      ...apiUser,
      ...currentUser,
      profileType: resolveProfileType(currentUser?.profileType, currentUser),
    };

    authDebug("loginUser.profileMerge", {
      email,
      apiUser,
      currentUser,
      mergedUser: user,
      hasToken: Boolean(token),
    });

    persistUserProfile(user, token);

    return {
      mode: "api",
      message: "Login realizado com sucesso.",
      token,
      user,
      ...result,
    };
  } catch (error) {
    const normalized = normalizeError(error, "Nao foi possivel realizar login.");

    if (/credenciais|unauthorized|401/i.test(normalized.message)) {
      throw new Error("Usuario ou senha inválidos.");
    }

    throw normalized;
  }
}

export async function registerUser(values) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  const payload = {
    nome: values.name,
    email: values.email,
    senha: values.password,
  };

  try {
    const result = await apiRequest("/conta/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      mode: "api",
      message: "Cadastrado com sucesso.",
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel concluir o cadastro.");
  }
}

export async function registerLocatario(values) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  try {
    const contaResult = await apiRequest("/conta/auth/register", {
      method: "POST",
      body: JSON.stringify({
        nome: values.name,
        email: values.email,
        telefone: values.celphone.replace(/\D/g, ""),
        senha: values.password,
      }),
    });

    const conta = normalizeApiUser(contaResult, values.email);
    const contaId = conta.id || contaResult?.id || contaResult?.result?.id;

    if (!contaId) {
      throw new Error("Nao foi possivel identificar a conta do locatario.");
    }

    const locatarioResult = await apiRequest("/locatario/", {
      method: "POST",
      body: JSON.stringify({
        id: contaId,
        cpf: values.cpf.replace(/\D/g, ""),
        cnh: values.cnh.replace(/\D/g, ""),
      }),
    });

    return {
      mode: "api",
      message: "Cadastro de locatario realizado com sucesso.",
      conta: contaResult,
      locatario: locatarioResult,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel concluir o cadastro de locatario.");
  }
}

export async function registerLocador(values) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  try {
    const contaResult = await apiRequest("/conta/auth/register", {
      method: "POST",
      body: JSON.stringify({
        nome: values.empresa,
        email: values.email,
        telefone: values.celphone.replace(/\D/g, ""),
        senha: values.password,
      }),
    });

    const conta = normalizeApiUser(contaResult, values.email);
    const contaId = conta.id || contaResult?.id || contaResult?.result?.id;

    if (!contaId) {
      throw new Error("Nao foi possivel identificar a conta do locador.");
    }

    const result = await apiRequest("/locador/", {
      method: "POST",
      body: JSON.stringify({
        id: contaId,
        cnpj: values.cnpj.replace(/\D/g, ""),
      }),
    });

    return {
      mode: "api",
      message: "Cadastro de locador realizado com sucesso.",
      conta: contaResult,
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel concluir o cadastro de locador.");
  }
}

export async function updateUserProfile(values) {
  const normalizedProfile = normalizeUserProfile(values);
  const session = getAuthSession();

  if (!isApiConfigured() || !values.id) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  try {
    const result = await apiRequest(`/conta/update/${values.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome: values.name,
        email: values.email,
        telefone: values.celphone.replace(/\D/g, ""),
      }),
    });

    const apiUser = normalizeApiUser(result, values.email);
    const mergedUser = { ...normalizedProfile, ...apiUser };
    persistUserProfile(mergedUser, session?.token);

    return {
      mode: "api",
      message: "Dados atualizados com sucesso.",
      user: mergedUser,
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel atualizar os dados.");
  }
}

export async function requestPasswordReset({ email }) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  try {
    const result = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    return {
      mode: "api",
      message: "Solicitacao de recuperacao enviada com sucesso.",
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, "Nao foi possivel solicitar recuperacao de senha.");
  }
}

export async function fetchUserProfileByEmail(email, options = {}) {
  if (!email) {
    return null;
  }

  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  authDebug("fetchUserProfileByEmail.request", {
    email,
    options,
  });

  const result = await apiRequest(`/conta?email=${encodeURIComponent(email)}`);
  const user = normalizeApiUser(result, email);

  authDebug("fetchUserProfileByEmail.response", {
    raw: result,
    normalized: user,
  });

  if (options.persistToSession && user?.email) {
    persistUserProfile(user, getAuthSession()?.token ?? null);
  }

  return user;
}

export async function changePassword({ senhaAtual, novaSenha }) {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  const token = getAuthSession()?.token;

  if (!token) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  const result = await apiRequest("/conta/auth/change-password", {
    method: "PATCH",
    authToken: token,
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });

  return {
    mode: "api",
    message: "Senha alterada com sucesso.",
    ...result,
  };
}

export async function deleteAccount() {
  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  const token = getAuthSession()?.token;

  if (!token) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  await apiRequest("/conta/auth/delete-account", {
    method: "DELETE",
    authToken: token,
  });

  clearAuthSession();

  return {
    mode: "api",
    message: "Conta deletada com sucesso.",
  };
}

export async function fetchCurrentUserProfile(options = {}) {
  const token = options.authToken || getAuthSession()?.token;

  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  if (!token) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  authDebug("fetchCurrentUserProfile.request", {
    hasToken: Boolean(token),
    options,
  });

  const result = await apiRequest("/conta/auth/me", {
    method: "GET",
    authToken: token,
  });
  const { user, profileSource } = normalizeCurrentUserFromMe(result);

  authDebug("fetchCurrentUserProfile.response", {
    raw: {
      conta: result,
    },
    profileSource,
    normalized: user,
  });

  if (options.persistToSession && user?.email) {
    persistUserProfile(user, token);
  }

  return user;
}