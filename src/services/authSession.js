const AUTH_SESSION_KEY = "mova_auth_session";

const AUTH_FEEDBACK_KEY = "mova_auth_feedback";

export const AUTH_SESSION_CHANGED_EVENT = "mova:auth-session-changed";

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
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function clearAuthSession() {
  if (!isClient()) return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function saveAuthFeedback(feedback) {
  if (!isClient()) return;
  window.sessionStorage.setItem(AUTH_FEEDBACK_KEY, JSON.stringify(feedback));
}

export function consumeAuthFeedback() {
  if (!isClient()) return null;
  const raw = window.sessionStorage.getItem(AUTH_FEEDBACK_KEY);
  window.sessionStorage.removeItem(AUTH_FEEDBACK_KEY);
  return safeParse(raw);
}
