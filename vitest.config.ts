import { configDefaults, defineConfig } from "vitest/config";

// Inline projects inherit nothing from the root config, so both spread these.
const shared = {
  // No test reads .env files. Without this, Vite loads them from the root.
  envDir: false,
  resolve: { tsconfigPaths: true },
} as const;

const sharedTest = {
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
    projects: [
      {
        ...shared,
        test: {
          ...sharedTest,
          name: "unit",
          include: ["tests/unit/**", "src/**/*.test.ts"],
        },
      },
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
