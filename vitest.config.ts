import { defineConfig } from "vitest/config";
import unit, { shared, sharedTest } from "./vitest.unit.config";

export default defineConfig({
  ...shared,
  test: {
    projects: [
      unit,
      {
        ...shared,
        test: {
          ...sharedTest,
          name: "integration",
          include: ["tests/integration/**", "tests/security/**"],
        },
      },
    ],
  },
});
