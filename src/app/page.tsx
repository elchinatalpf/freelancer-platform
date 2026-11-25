import { getHealth } from "@/features/health/get-health";

export default function HomePage() {
  const { status } = getHealth();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Empowered Professional Platform
      </h1>
      <p className="font-mono text-sm">
        Health: <strong>{status}</strong>
      </p>
    </main>
  );
}
