import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ADR 1: only the Data Access Layer in src/server/ may import these.
const DATABASE_CLIENT_IMPORTS = [
  "@neondatabase/serverless",
  "drizzle-orm",
  "drizzle-orm/*",
  "pg",
  "postgres",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**"],
    ignores: ["src/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // The leading slash anchors each name to the start of the import
              // path, so a local file such as ./pg is not restricted.
              group: DATABASE_CLIENT_IMPORTS.map((name) => `/${name}`),
              message:
                "Only src/server/ may import the database client (ADR 1).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Tool output, at the root only:
    ".vitest/**",
    ".stryker-tmp/**",
    "reports/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
