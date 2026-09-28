import { describe, expect, it } from "vitest";

import { resolveAuthRoute } from "./authIdentity";

describe("resolveAuthRoute", () => {
  it("envia locador para painel operacional", () => {
    expect(resolveAuthRoute({ cargo: "LOCADOR" })).toBe("/painel");
  });

  it("envia locatario para Home", () => {
    expect(resolveAuthRoute({ cargo: "LOCATARIO" })).toBe("/home");
  });
});
