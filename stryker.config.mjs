// Mutation testing: would a test notice if a line broke? Run at phase gates.
/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
const config = {
  mutate: ["src/server/**/*.{ts,tsx}", "!src/server/**/*.test.{ts,tsx}"],
  // Named because pnpm's isolated node_modules defeats the default discovery.
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  // Unit tests only. The runner cannot pick a project, so it gets its own file.
  vitest: { configFile: "vitest.unit.config.ts" },
  coverageAnalysis: "perTest",
  // No break threshold yet: it is set at the Phase 1 gate.
  // Stryker copies the project into .stryker-tmp/, where the rules that stop
  // Claude Code reading .env.local do not reach. Keep every .env file out.
  ignorePatterns: [".env*"],
};

export default config;
