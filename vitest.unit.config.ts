// The unit project alone. vitest.config.ts includes it. Stryker uses this file
// directly, because its Vitest runner has no option to pick one project.
import { configDefaults, defineConfig } from "vitest/config";

// Inline projects inherit nothing from a root config, so every project spreads
// these.
export const shared = {
  // No test reads .env files. Without this, Vite loads them from the root.
  envDir: false,
  resolve: { tsconfigPaths: true },
} as const;

export const sharedTest = {
  environment: "node",
  // A dummy value for each variable src/env.ts requires.
  env: { APP_URL: "http://dummy.invalid" },
  exclude: [
    ...configDefaults.exclude,
    "tests/e2e/**",
    ".stryker-tmp/**",
    ".next/**",
  ],
};

export default defineConfig({
  ...shared,
  test: {
    ...sharedTest,
    name: "unit",
    include: ["tests/unit/**", "src/**/*.test.ts"],
  },
});
