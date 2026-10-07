import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { loadLocale } from "../i18n";

await Promise.all([loadLocale("en"), loadLocale("es")]);

const blockedRequests = [];
globalThis.__movaBlockedRequests = blockedRequests;

function blockedError(method, url) {
  return new TypeError(`[mova-test] rede bloqueada em teste unitário: ${method} ${url}`);
}

function guardedFetch(input, init = {}) {
  const url = typeof input === "string" ? input : input?.url ?? String(input);
  const method = (init.method || "GET").toUpperCase();
  blockedRequests.push({ method, url });
  return Promise.reject(blockedError(method, url));
}

class GuardedXMLHttpRequest {
  constructor() {
    this.upload = {};
  }
  open(method, url) {
    this.method = String(method).toUpperCase();
    this.url = String(url);
  }
  setRequestHeader() {}
  send() {
    blockedRequests.push({ method: this.method, url: this.url });
    queueMicrotask(() => this.onerror?.(blockedError(this.method, this.url)));
  }
  abort() {}
}

function installNetworkGuard() {
  globalThis.fetch = guardedFetch;
  globalThis.XMLHttpRequest = GuardedXMLHttpRequest;
}

installNetworkGuard();
beforeEach(() => {
  blockedRequests.length = 0;
});
afterEach(() => {
  installNetworkGuard();
});
