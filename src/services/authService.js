import { t } from "../i18n";
import { apiRequest, isApiConfigured } from "./apiClient";
import { normalizeCargo } from "./authIdentity";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "./authSession";

const AUTH_DEBUG_ENABLED =
  String(import.meta.env.AUTH_DEBUG).toLowerCase() === "true";

const SENSITIVE_DEBUG_KEY = /authorization|token|senha|password|secret|cookie|cpf|cnh|cnpj|cvv|cartao|card/i;

export function sanitizeAuthDebug(value, key = "") {
  if (SENSITIVE_DEBUG_KEY.test(key)) {
    return "[redacted]";
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuthDebug(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeAuthDebug(entryValue, entryKey)]),
    );
  }
  return value;
}

function authDebug(label, payload) {
  if (!AUTH_DEBUG_ENABLED) {
    return;
  }

  console.groupCollapsed(`[auth-debug] ${label}`);
  console.log(sanitizeAuthDebug(payload));
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

function buildProfileUpdatePayload(values) {
  return {
    nome: values.name,
    email: values.email,
    telefone: onlyDigits(values.celphone),
    endereco: values.address || "",
    cep: onlyDigits(values.cep),
  };
}

function buildRegistrationPayload(values, cargo) {
  return {
    ...buildProfileUpdatePayload(values),
    cargo,
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
        ? candidate.find(
            (item) =>
              hasProfileFields(item) && getCandidateEmail(item) === targetEmail,
          )
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

  if (!source) {
    return { email: fallbackEmail };
  }

  return {
    id: source.id || source._id,
    name:
      source.nome ||
      source.name ||
      source.nomeCompleto ||
      source.nome_completo ||
      source.fullName,
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

  const accountId =
    conta.id ||
    result.id ||
    result.contaId ||
    roleData.contaId ||
    roleData.accountId;
  const profileId = roleData.id || roleData._id;

  const user = {
    id: accountId || profileId,
    accountId: accountId || profileId,
    profileId: profileId || "",
    name: conta.nome || conta.name || result.nome || result.name,
    email: conta.email || result.email,
    cargo,
    profileType: cargo.toLowerCase(),
    celphone:
      conta.telefone ||
      conta.celular ||
      conta.celphone ||
      roleData.telefone ||
      roleData.celular ||
      roleData.celphone ||
      "",
    empresa: roleData.empresa || "",
    cnpj: roleData.cnpj || "",
    cpf: roleData.cpf || "",
    cnh: roleData.cnh || "",
    // RN01: usado no POST /reserva quando o veículo é adaptado/PCD.
    deficienciaId: roleData.deficienciaId || "",
    address:
      conta.endereco ||
      conta.address ||
      result.endereco ||
      result.address ||
      roleData.endereco ||
      roleData.address ||
      "",
    cep: conta.cep || result.cep || roleData.cep || "",
  };

  return {
    user: {
      ...user,
      cargo: resolveCargo(cargo, user),
      profileType: resolveProfileType(cargo, user),
    },
    profileSource: locadorNode
      ? "locador"
      : locatarioNode
        ? "locatario"
        : "none",
  };
}

function extractToken(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const result =
    payload.result && typeof payload.result === "object"
      ? payload.result
      : null;

  return payload.token || result?.token || null;
}

function persistUserProfile(user, token) {
  const session = getAuthSession();
  const nextToken = token ?? session?.token ?? null;
  const previousUser = session?.user || {};
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
    throw new Error(t("errors.apiNotConfigured"));
  }

  try {
    const result = await apiRequest("/conta/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });

    authDebug("loginUser.apiResponse", result);

    const token = extractToken(result);

    if (!token) {
      throw new Error(t("errors.tokenMissing"));
    }

    const apiUser = normalizeApiUser(result, email);
    const currentUser = await fetchCurrentUserProfile({
      authToken: token,
      persistToSession: false,
    });

    const user = {
      ...apiUser,
      ...currentUser,
      cargo: resolveCargo(
        currentUser?.cargo ||
          apiUser?.cargo ||
          currentUser?.profileType ||
          apiUser?.profileType,
        currentUser || apiUser,
      ),
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
      message: t("common.feedback.loginSuccess"),
      token,
      user,
      ...result,
    };
  } catch (error) {
    const normalized = normalizeError(
      error,
      t("errors.loginFailed"),
    );

    if (/credenciais|credentials|credenciales|unauthorized|401/i.test(normalized.message)) {
      throw new Error(t("errors.invalidCredentials"));
    }

    throw normalized;
  }
}

export async function registerUser(values) {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
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
      message: t("common.feedback.registered"),
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, t("errors.registerFailed"));
  }
}

export async function registerLocatario(values) {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  try {
    const contaResult = await apiRequest("/conta/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...buildRegistrationPayload(values, "LOCATARIO"),
        senha: values.password,
      }),
    });

    const token = extractToken(contaResult);
    if (!token) {
      throw new Error(t("errors.renterAuthFailed"));
    }

    const locatarioResult = await apiRequest("/locatario/", {
      method: "POST",
      authToken: token,
      body: JSON.stringify({
        cpf: values.cpf.replace(/\D/g, ""),
        cnh: values.cnh.replace(/\D/g, ""),
        rg: values.rg.replace(/[.\-\s]/g, "").toUpperCase(),
        dataNascimento: values.dataNascimento,
        ...(values.deficienciaId ? { deficiencia_id: values.deficienciaId } : {}),
      }),
    });

    return {
      mode: "api",
      message: t("common.feedback.renterRegistered"),
      conta: contaResult,
      locatario: locatarioResult,
    };
  } catch (error) {
    throw normalizeError(
      error,
      t("errors.renterRegisterFailed"),
    );
  }
}

export async function registerLocador(values) {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  try {
    const contaResult = await apiRequest("/conta/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...buildRegistrationPayload(values, "LOCADOR"),
        senha: values.password,
      }),
    });

    const conta = normalizeApiUser(contaResult, values.email);
    const contaId = conta.id || contaResult?.id || contaResult?.result?.id;
    const token = contaResult?.result?.token;

    if (!contaId) {
      throw new Error(t("errors.ownerAccountMissing"));
    }

    if (!token) {
      throw new Error(t("errors.ownerAuthFailed"));
    }

    const result = await apiRequest("/locador", {
      method: "POST",
      authToken: token,
      body: JSON.stringify({
        id: contaId,
        empresa: values.empresa,
        cnpj: values.cnpj.replace(/\D/g, ""),
      }),
    });

    return {
      mode: "api",
      message: t("common.feedback.ownerRegistered"),
      conta: contaResult,
      ...result,
    };
  } catch (error) {
    throw normalizeError(
      error,
      t("errors.ownerRegisterFailed"),
    );
  }
}

export async function updateUserProfile(values) {
  const normalizedProfile = normalizeUserProfile(values);
  const session = getAuthSession();
  const token = session?.token;
  const sessionUser = session?.user || {};
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

  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  if (!token) {
    throw new Error(t("errors.sessionExpired"));
  }

  if ((cargo === "LOCATARIO" || cargo === "LOCADOR") && !profileId) {
    try {
      const freshProfile = await fetchCurrentUserProfile({
        authToken: token,
        persistToSession: false,
      });

      if (freshProfile) {
        cargo = resolveCargo(
          freshProfile.cargo || freshProfile.profileType || cargo,
          {
            ...freshProfile,
            ...values,
          },
        );
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
        ...buildProfileUpdatePayload(values),
        // O backend não altera e-mail pelo perfil; não enviar evita sugerir
        // que a troca aconteceu (JSON.stringify omite undefined).
        email: undefined,
      }),
    });

    if (cargo === "LOCATARIO") {
      if (!profileId) {
        throw new Error(
          t("errors.profileMissing"),
        );
      }

      try {
        await apiRequest(`/locatario/${profileId}`, {
          method: "PUT",
          authToken: token,
          body: JSON.stringify(buildLocatarioUpdatePayload(values)),
        });
      } catch {
        throw new Error(
          t("errors.profilePartialUpdate"),
        );
      }
    }

    if (cargo === "LOCADOR") {
      if (!profileId) {
        throw new Error(
          t("errors.profileMissing"),
        );
      }

      try {
        await apiRequest(`/locador/${profileId}`, {
          method: "PUT",
          authToken: token,
          body: JSON.stringify(buildLocadorUpdatePayload(values)),
        });
      } catch {
        throw new Error(
          t("errors.profilePartialUpdate"),
        );
      }
    }

    const apiUser = normalizeApiUser(result, values.email);
    const mergedUser = {
      ...normalizedProfile,
      ...apiUser,
      id:
        accountId || sessionUser.id || apiUser.id || normalizedProfile.id || "",
      accountId:
        accountId ||
        sessionUser.accountId ||
        sessionUser.id ||
        apiUser.id ||
        normalizedProfile.id ||
        "",
      profileId: profileId || sessionUser.profileId || "",
      cargo,
      profileType: resolveProfileType(cargo, normalizedProfile),
    };
    persistUserProfile(mergedUser, token);

    return {
      mode: "api",
      message: t("common.feedback.dataUpdated"),
      user: mergedUser,
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, t("errors.updateFailed"));
  }
}

export async function requestPasswordReset({ email }) {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  try {
    const result = await apiRequest("/conta/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    const payload = result?.result || result || {};

    return {
      mode: "api",
      message:
        payload.message ||
        t("common.feedback.recoveryRequested"),
      ...result,
    };
  } catch (error) {
    throw normalizeError(
      error,
      t("errors.recoveryFailed"),
    );
  }
}

export async function resetPassword({ token, novaSenha }) {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  try {
    const result = await apiRequest("/conta/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, novaSenha }),
    });

    return {
      mode: "api",
      message: t("common.feedback.passwordReset"),
      ...result,
    };
  } catch (error) {
    throw normalizeError(error, t("errors.resetFailed"));
  }
}

export async function fetchUserProfileByEmail(email, options = {}) {
  if (!email) {
    return null;
  }

  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
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
    throw new Error(t("errors.apiNotConfigured"));
  }

  const token = getAuthSession()?.token;

  if (!token) {
    throw new Error(t("errors.sessionExpired"));
  }

  const result = await apiRequest("/conta/auth/change-password", {
    method: "PATCH",
    authToken: token,
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });

  return {
    mode: "api",
    message: t("common.feedback.passwordChanged"),
    ...result,
  };
}

export async function deleteAccount() {
  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  const token = getAuthSession()?.token;

  if (!token) {
    throw new Error(t("errors.sessionExpired"));
  }

  await apiRequest("/conta/auth/delete-account", {
    method: "DELETE",
    authToken: token,
  });

  clearAuthSession();

  return {
    mode: "api",
    message: t("common.feedback.accountDeleted"),
  };
}

export async function fetchCurrentUserProfile(options = {}) {
  const token = options.authToken || getAuthSession()?.token;

  if (!isApiConfigured()) {
    throw new Error(t("errors.apiNotConfigured"));
  }

  if (!token) {
    throw new Error(t("errors.sessionExpired"));
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
