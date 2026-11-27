import { expect, it } from "vitest";

it("acceptance test 5 of 0.6: fails on purpose, reverted next", () => {
  expect("red").toBe("green");
});
