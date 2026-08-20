import { apiRequest, isApiConfigured } from "./apiClient";
import { normalizeCargo } from "./authIdentity";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "./authSession";

<<<<<<< HEAD
<<<<<<< HEAD
const AUTH_DEBUG_ENABLED =
  String(import.meta.env.AUTH_DEBUG).toLowerCase() === "true";
=======
const AUTH_DEBUG_ENABLED = String(import.meta.env.AUTH_DEBUG).toLowerCase() === "true";
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
const AUTH_DEBUG_ENABLED =
  String(import.meta.env.AUTH_DEBUG).toLowerCase() === "true";
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

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
    accountId: values.accountId || values.id,
    profileId: values.profileId,
    name: values.name,
    email: values.email,
    cargo: normalizeCargo(values.cargo || values.profileType),
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
    value.address,
<<<<<<< HEAD
=======
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
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  );
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function resolveCargo(cargo, profile) {
  const normalizedCargo = normalizeCargo(cargo);

  if (normalizedCargo) {
    return normalizedCargo;
  }

  if (profile) {
    return normalizeCargo(profile.cargo || profile.profileType);
  }

  return "";
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildContaPayload(values) {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  // O backend exige o campo "cargo" (LOCATARIO | LOCADOR | ADMIN).
  // Inferimos pelo contexto: se vier em values.cargo, usamos;
  // caso contrario, values.cnpj ou values.empresa indicam LOCADOR; default LOCATARIO.
  const cargo =
    values.cargo ||
    (values.cnpj || values.empresa ? "LOCADOR" : "LOCATARIO");

<<<<<<< HEAD
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  return {
    nome: values.name,
    email: values.email,
    telefone: onlyDigits(values.celphone),
    endereco: values.address || "",
    cep: onlyDigits(values.cep),
<<<<<<< HEAD
<<<<<<< HEAD
    cargo,
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
    cargo,
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  };
}

/**
 * @typedef {Object} LocatarioUpdatePayload
 * @property {string} cnh
 * @property {string} cpf
 */

/**
 * @typedef {Object} LocadorUpdatePayload
 * @property {string} empresa
 * @property {string} cnpj
 */

/**
 * @param {Object} values
 * @returns {LocatarioUpdatePayload}
 */
function buildLocatarioUpdatePayload(values) {
  return {
    cnh: onlyDigits(values.cnh),
    cpf: onlyDigits(values.cpf),
  };
}

/**
 * @param {Object} values
 * @returns {LocadorUpdatePayload}
 */
function buildLocadorUpdatePayload(values) {
  return {
    id: values.id || values.accountId || values.profileId || "",
    empresa: String(values.empresa || ""),
    cnpj: onlyDigits(values.cnpj),
  };
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
        ? candidate.find(
            (item) =>
              hasProfileFields(item) && getCandidateEmail(item) === targetEmail,
          )
<<<<<<< HEAD
=======
        ? candidate.find((item) => hasProfileFields(item) && getCandidateEmail(item) === targetEmail)
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const cargo = resolveCargo(
    root.cargo || result?.cargo || data?.cargo,
    result || data || root,
  );
  const source = pickProfileSource(
    [
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
    ],
    fallbackEmail,
  );
<<<<<<< HEAD
=======
  const cargo = resolveCargo(root.cargo || result?.cargo || data?.cargo, result || data || root);
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
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

  if (!source) {
    return { email: fallbackEmail };
  }

  return {
    id: source.id || source._id,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    name:
      source.nome ||
      source.name ||
      source.nomeCompleto ||
      source.nome_completo ||
      source.fullName,
<<<<<<< HEAD
=======
    name: source.nome || source.name || source.nomeCompleto || source.nome_completo || source.fullName,
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    email: source.email || fallbackEmail,
    cargo: resolveCargo(source.cargo || source.profileType || cargo, source),
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
  return resolveCargo(profileType, profile).toLowerCase();
}

function isProfileNode(value) {
  return isObject(value) && Object.keys(value).length > 0;
}

function normalizeCurrentUserFromMe(payload) {
  const root = isObject(payload) ? payload : {};
  const result = isObject(root.result) ? root.result : {};
  const conta = isObject(result.conta) ? result.conta : result;
  const locadorNode = isProfileNode(conta.locador) ? conta.locador : null;
  const locatarioNode = isProfileNode(conta.locatario) ? conta.locatario : null;
  let explicitProfileType =
    root.profileType ||
    result.profileType ||
    conta.profileType ||
    root.tipoPerfil ||
    result.tipoPerfil ||
    conta.tipoPerfil ||
    root.cargo ||
    result.cargo ||
    conta.cargo ||
    "";

  let cargo = resolveCargo(explicitProfileType, conta);
  let roleData = {};

  if (cargo === "LOCADOR" && locadorNode) {
    roleData = locadorNode;
    cargo = "LOCADOR";
  } else if (cargo === "LOCATARIO" && locatarioNode) {
    roleData = locatarioNode;
    cargo = "LOCATARIO";
  } else if (locadorNode && locatarioNode) {
    cargo = "LOCADOR";
    roleData = locadorNode;
  } else if (locadorNode) {
    cargo = "LOCADOR";
    roleData = locadorNode;
  } else if (locatarioNode) {
    cargo = "LOCATARIO";
    roleData = locatarioNode;
  }

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const accountId =
    conta.id ||
    result.id ||
    result.contaId ||
    roleData.contaId ||
    roleData.accountId;
<<<<<<< HEAD
=======
  const accountId = conta.id || result.id || result.contaId || roleData.contaId || roleData.accountId;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const profileId = roleData.id || roleData._id;

  const user = {
    id: accountId || profileId,
    accountId: accountId || profileId,
    profileId: profileId || "",
    name: conta.nome || conta.name || result.nome || result.name,
    email: conta.email || result.email,
    cargo,
    profileType: cargo.toLowerCase(),
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    celphone:
      conta.telefone ||
      conta.celular ||
      conta.celphone ||
      roleData.telefone ||
      roleData.celular ||
      roleData.celphone ||
      "",
<<<<<<< HEAD
=======
    celphone: conta.telefone || conta.celular || conta.celphone || roleData.telefone || roleData.celular || roleData.celphone || "",
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    empresa: roleData.empresa || "",
    cnpj: roleData.cnpj || "",
    cpf: roleData.cpf || "",
    cnh: roleData.cnh || "",
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    address:
      conta.endereco ||
      conta.address ||
      result.endereco ||
      result.address ||
      roleData.endereco ||
      roleData.address ||
      "",
<<<<<<< HEAD
=======
    address: conta.endereco || conta.address || result.endereco || result.address || roleData.endereco || roleData.address || "",
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    cep: conta.cep || result.cep || roleData.cep || "",
  };

  return {
    user: {
      ...user,
      cargo: resolveCargo(cargo, user),
      profileType: resolveProfileType(cargo, user),
    },
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    profileSource: locadorNode
      ? "locador"
      : locatarioNode
        ? "locatario"
        : "none",
<<<<<<< HEAD
=======
    profileSource: locadorNode ? "locador" : locatarioNode ? "locatario" : "none",
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  };
}

function extractToken(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const result =
    payload.result && typeof payload.result === "object"
      ? payload.result
      : null;
<<<<<<< HEAD
=======
  const result = payload.result && typeof payload.result === "object" ? payload.result : null;
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

  return payload.token || result?.token || null;
}

function persistUserProfile(user, token) {
  const session = getAuthSession();
  const nextToken = token ?? session?.token ?? null;
  const previousUser = session?.user || {};
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const nextCargo = resolveCargo(
    user?.cargo ||
      user?.profileType ||
      previousUser.cargo ||
      previousUser.profileType,
    {
      ...previousUser,
      ...user,
    },
  );
<<<<<<< HEAD
=======
  const nextCargo = resolveCargo(user?.cargo || user?.profileType || previousUser.cargo || previousUser.profileType, {
    ...previousUser,
    ...user,
  });
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  const nextUser = {
    ...previousUser,
    ...user,
  };

  nextUser.cargo = nextCargo || nextUser.cargo || "";
  if (nextUser.cargo) {
    nextUser.profileType = nextUser.cargo.toLowerCase();
  }

  if (!nextUser.id) {
    nextUser.id = nextUser.accountId || previousUser.id || "";
  }

  if (!nextUser.accountId) {
    nextUser.accountId = nextUser.id;
  }

  if (!nextUser.profileId && previousUser.profileId) {
    nextUser.profileId = previousUser.profileId;
  }

  authDebug("persistUserProfile.input", {
    user: nextUser,
    hasToken: Boolean(nextToken),
  });

  saveAuthSession({
    token: nextToken,
    user: nextUser,
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      cargo: resolveCargo(
        currentUser?.cargo ||
          apiUser?.cargo ||
          currentUser?.profileType ||
          apiUser?.profileType,
        currentUser || apiUser,
      ),
<<<<<<< HEAD
=======
      cargo: resolveCargo(currentUser?.cargo || apiUser?.cargo || currentUser?.profileType || apiUser?.profileType, currentUser || apiUser),
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    };

    user.profileType = resolveProfileType(user.cargo || user.profileType, user);

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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    const normalized = normalizeError(
      error,
      "Nao foi possivel realizar login.",
    );
<<<<<<< HEAD
=======
    const normalized = normalizeError(error, "Nao foi possivel realizar login.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

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
        ...buildContaPayload(values),
        senha: values.password,
<<<<<<< HEAD
<<<<<<< HEAD
        cargo: "LOCATARIO",
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
        cargo: "LOCATARIO",
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
        rg: values.rg.replace(/[.\-\s]/g, "").toUpperCase(),
        dataNascimento: values.dataNascimento,
        ...(values.deficienciaId ? { deficiencia_id: values.deficienciaId } : {}),
=======
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
      }),
    });

    return {
      mode: "api",
      message: "Cadastro de locatario realizado com sucesso.",
      conta: contaResult,
      locatario: locatarioResult,
    };
  } catch (error) {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    throw normalizeError(
      error,
      "Nao foi possivel concluir o cadastro de locatario.",
    );
<<<<<<< HEAD
=======
    throw normalizeError(error, "Nao foi possivel concluir o cadastro de locatario.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
        ...buildContaPayload(values),
        senha: values.password,
      }),
    });

    const conta = normalizeApiUser(contaResult, values.email);
    const contaId = conta.id || contaResult?.id || contaResult?.result?.id;

    if (!contaId) {
      throw new Error("Nao foi possivel identificar a conta do locador.");
    }

    const result = await apiRequest("/locador", {
      method: "POST",
      body: JSON.stringify({
        id: contaId,
        empresa: values.empresa,
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    throw normalizeError(
      error,
      "Nao foi possivel concluir o cadastro de locador.",
    );
<<<<<<< HEAD
=======
    throw normalizeError(error, "Nao foi possivel concluir o cadastro de locador.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
  }
}

export async function updateUserProfile(values) {
  const normalizedProfile = normalizeUserProfile(values);
  const session = getAuthSession();
  const token = session?.token;
  const sessionUser = session?.user || {};
<<<<<<< HEAD
<<<<<<< HEAD
  const accountId =
    values.id || values.accountId || sessionUser.accountId || sessionUser.id;
  let profileId = values.profileId || sessionUser.profileId;
  let cargo = resolveCargo(
    values.cargo ||
      values.profileType ||
      sessionUser.cargo ||
      sessionUser.profileType,
    {
      ...sessionUser,
      ...values,
    },
  );
=======
  const accountId = values.id || values.accountId || sessionUser.accountId || sessionUser.id;
  let profileId = values.profileId || sessionUser.profileId;
  let cargo = resolveCargo(values.cargo || values.profileType || sessionUser.cargo || sessionUser.profileType, {
    ...sessionUser,
    ...values,
  });
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
  const accountId =
    values.id || values.accountId || sessionUser.accountId || sessionUser.id;
  let profileId = values.profileId || sessionUser.profileId;
  let cargo = resolveCargo(
    values.cargo ||
      values.profileType ||
      sessionUser.cargo ||
      sessionUser.profileType,
    {
      ...sessionUser,
      ...values,
    },
  );
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2

  if (!isApiConfigured()) {
    throw new Error("API_BASE_URL nao configurada.");
  }

  if (!token) {
    throw new Error("Sessao expirada. Faca login novamente.");
  }

  if ((cargo === "LOCATARIO" || cargo === "LOCADOR") && !profileId) {
    try {
      const freshProfile = await fetchCurrentUserProfile({
        authToken: token,
        persistToSession: false,
      });

      if (freshProfile) {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
        cargo = resolveCargo(
          freshProfile.cargo || freshProfile.profileType || cargo,
          {
            ...freshProfile,
            ...values,
          },
        );
<<<<<<< HEAD
=======
        cargo = resolveCargo(freshProfile.cargo || freshProfile.profileType || cargo, {
          ...freshProfile,
          ...values,
        });
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
        profileId = freshProfile.profileId || profileId;
      }
    } catch {
      // Ignore identity refresh failures here; explicit profileId validation below handles errors.
    }
  }

  try {
    const result = await apiRequest("/conta/auth/update-profile", {
      method: "PUT",
      authToken: token,
      body: JSON.stringify({
        ...buildContaPayload(values),
      }),
    });

    if (cargo === "LOCATARIO") {
      if (!profileId) {
<<<<<<< HEAD
<<<<<<< HEAD
        throw new Error(
          "Nao foi possivel identificar o perfil vinculado da conta autenticada.",
        );
=======
        throw new Error("Nao foi possivel identificar o perfil vinculado da conta autenticada.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
        throw new Error(
          "Nao foi possivel identificar o perfil vinculado da conta autenticada.",
        );
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      }

      try {
        await apiRequest(`/locatario/${profileId}`, {
          method: "PUT",
          authToken: token,
          body: JSON.stringify(buildLocatarioUpdatePayload(values)),
        });
      } catch {
<<<<<<< HEAD
<<<<<<< HEAD
        throw new Error(
          "Dados da conta atualizados, mas falha ao atualizar dados de perfil.",
        );
=======
        throw new Error("Dados da conta atualizados, mas falha ao atualizar dados de perfil.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
        throw new Error(
          "Dados da conta atualizados, mas falha ao atualizar dados de perfil.",
        );
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      }
    }

    if (cargo === "LOCADOR") {
      if (!profileId) {
<<<<<<< HEAD
<<<<<<< HEAD
        throw new Error(
          "Nao foi possivel identificar o perfil vinculado da conta autenticada.",
        );
=======
        throw new Error("Nao foi possivel identificar o perfil vinculado da conta autenticada.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
        throw new Error(
          "Nao foi possivel identificar o perfil vinculado da conta autenticada.",
        );
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      }

      try {
        await apiRequest(`/locador/${profileId}`, {
          method: "PUT",
          authToken: token,
          body: JSON.stringify(buildLocadorUpdatePayload(values)),
        });
      } catch {
<<<<<<< HEAD
<<<<<<< HEAD
        throw new Error(
          "Dados da conta atualizados, mas falha ao atualizar dados de perfil.",
        );
=======
        throw new Error("Dados da conta atualizados, mas falha ao atualizar dados de perfil.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
        throw new Error(
          "Dados da conta atualizados, mas falha ao atualizar dados de perfil.",
        );
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      }
    }

    const apiUser = normalizeApiUser(result, values.email);
    const mergedUser = {
      ...normalizedProfile,
      ...apiUser,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      id:
        accountId || sessionUser.id || apiUser.id || normalizedProfile.id || "",
      accountId:
        accountId ||
        sessionUser.accountId ||
        sessionUser.id ||
        apiUser.id ||
        normalizedProfile.id ||
        "",
<<<<<<< HEAD
=======
      id: accountId || sessionUser.id || apiUser.id || normalizedProfile.id || "",
      accountId: accountId || sessionUser.accountId || sessionUser.id || apiUser.id || normalizedProfile.id || "",
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
      profileId: profileId || sessionUser.profileId || "",
      cargo,
      profileType: resolveProfileType(cargo, normalizedProfile),
    };
    persistUserProfile(mergedUser, token);

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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
    throw normalizeError(
      error,
      "Nao foi possivel solicitar recuperacao de senha.",
    );
<<<<<<< HEAD
=======
    throw normalizeError(error, "Nao foi possivel solicitar recuperacao de senha.");
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
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
<<<<<<< HEAD
<<<<<<< HEAD
}
=======
}
>>>>>>> 1c95901965c2026bba2162d3f430df8344c59244
=======
}
>>>>>>> 983b85b0d16831b05a20056748c836730f6d9fc2
