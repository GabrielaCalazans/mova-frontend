import { describe, expect, it } from "vitest";
import { sanitizeAuthDebug } from "./authService";

describe("auth debug redaction", () => {
  it("removes credentials and payment secrets recursively", () => {
    const safe = sanitizeAuthDebug({
      token: "jwt-secret",
      senha: "senha-secreta",
      nested: { authorization: "Bearer jwt-secret", cvv: "123", email: "cliente@example.test" },
      items: [{ password: "senha-secreta" }],
    });

    expect(safe).toEqual({
      token: "[redacted]",
      senha: "[redacted]",
      nested: { authorization: "[redacted]", cvv: "[redacted]", email: "cliente@example.test" },
      items: [{ password: "[redacted]" }],
    });
  });

  it("keeps only safe error metadata", () => {
    expect(sanitizeAuthDebug(new Error("falha de rede"))).toEqual({
      name: "Error",
      message: "falha de rede",
    });
  });
});
