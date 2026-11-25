// ADR 1: only code in src/server/ may import the database client. This runs the
// real eslint.config.mjs, so weakening the rule there fails the test.
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Listed here rather than imported from the ESLint config, so that removing a
// name from the config cannot also remove it from the test.
const DATABASE_CLIENTS = [
  "@neondatabase/serverless",
  "drizzle-orm",
  "drizzle-orm/neon-serverless",
  "pg",
  "postgres",
];

const eslint = new ESLint();

async function lintImport(source: string, filePath: string) {
  const code = `import * as client from "${source}";\nexport { client };\n`;
  const [result] = await eslint.lintText(code, { filePath });
  // A file that did not parse reports no rule at all, which would look allowed.
  expect(result.fatalErrorCount).toBe(0);
  return result.messages.map((message) => message.ruleId);
}

// The first lint loads every plugin in the config, which can pass Vitest's
// default 5 seconds on a cold machine.
describe("database client boundary", { timeout: 30_000 }, () => {
  it.each(DATABASE_CLIENTS)("rejects %s outside src/server/", async (name) => {
    expect(await lintImport(name, "src/features/x/a.ts")).toContain(
      "no-restricted-imports",
    );
  });

  it.each(DATABASE_CLIENTS)("allows %s inside src/server/", async (name) => {
    expect(await lintImport(name, "src/server/db.ts")).not.toContain(
      "no-restricted-imports",
    );
  });
});
