const AUTH_SESSION_KEY = "mova_auth_session";

function isClient() {
  return typeof window !== "undefined";
}

function safeParse(rawValue) {
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function getAuthSession() {
  if (!isClient()) return null;
  return safeParse(window.localStorage.getItem(AUTH_SESSION_KEY));
}

export function saveAuthSession(session) {
  if (!isClient()) return;
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (!isClient()) return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

