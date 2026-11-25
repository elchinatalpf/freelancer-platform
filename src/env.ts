// Environment validation. Runs when this module is first imported, and
// next.config.ts imports it, so a missing or malformed variable stops
// `next dev`, `next build` and `next start` with a readable message instead
// of failing on first use. Add every new variable here and in .env.example.
import { z } from "zod";

const schema = z.object({
  APP_URL: z.url(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables (see .env.example):\n${problems}`,
  );
}

export const env = parsed.data;
