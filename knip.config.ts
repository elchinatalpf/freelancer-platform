// Unused files, exports and dependencies. Every ignore says why.
import type { KnipConfig } from "knip";

const config: KnipConfig = {
  next: true,
  vitest: true,
  playwright: true,
  stryker: true,
  // Claude Code runs the hooks (.claude/settings.json); nothing imports them.
  entry: [".claude/hooks/*.mjs"],
  project: [
    // CSS too: knip follows its @import lines, such as tailwindcss.
    "**/*.{css,js,jsx,mjs,cjs,ts,tsx,mts,cts}",
    "!.vitest/**", // Vitest output
    "!.stryker-tmp/**", // Stryker's copy of the project
    "!reports/**", // Stryker reports
    "!test-results/**", // Playwright output
    "!playwright-report/**", // Playwright HTML report
  ],
};

export default config;
