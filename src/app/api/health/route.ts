import { connection } from "next/server";
import { getHealth } from "@/features/health/get-health";

export async function GET() {
  // With Cache Components, a handler that reads nothing from the request is
  // prerendered at build time. A health check must run on every request.
  await connection();
  return Response.json(getHealth(), {
    headers: { "Cache-Control": "no-store" },
  });
}
