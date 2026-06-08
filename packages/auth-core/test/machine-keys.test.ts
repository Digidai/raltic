import { describe, expect, it } from "vitest";
import { requireMachineKeyPepper } from "../src/machine-keys";

describe("requireMachineKeyPepper", () => {
  it("rejects missing or short peppers", () => {
    expect(() => requireMachineKeyPepper({ MACHINE_KEY_PEPPER: "" })).toThrow(/MACHINE_KEY_PEPPER/);
    expect(() => requireMachineKeyPepper({ MACHINE_KEY_PEPPER: "short" })).toThrow(/MACHINE_KEY_PEPPER/);
  });

  it("accepts sufficiently long peppers", () => {
    const pepper = "test-machine-key-pepper-stable-for-hash-roundtrip";
    expect(requireMachineKeyPepper({ MACHINE_KEY_PEPPER: pepper })).toBe(pepper);
  });
});
