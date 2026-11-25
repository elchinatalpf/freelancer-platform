import { describe, expect, it } from "vitest";
import { getHealth } from "@/features/health/get-health";

describe("getHealth", () => {
  it('returns exactly { status: "ok" }', () => {
    expect(getHealth()).toStrictEqual({ status: "ok" });
  });
});
