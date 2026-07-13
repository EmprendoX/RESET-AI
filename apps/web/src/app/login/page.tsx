"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Input } from "@ai-coach/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "No pudimos iniciar sesión. Revisá tu correo y contraseña.");
        setLoading(false);
        return;
      }

      // Sesión creada: entramos al panel.
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="ro-card ro-fade-up w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/logo.svg" alt="RESET-ORDER" width={44} height={44} className="rounded-xl" />
          <div>
            <div className="ro-wordmark text-base">RESET-ORDER</div>
            <div className="text-[10px] uppercase tracking-widest text-accent">Coach</div>
          </div>
        </div>
        <h1 className="mb-1 text-2xl font-bold">Bienvenido de vuelta</h1>
        <p className="mb-6 text-sm text-ink-muted">Iniciá sesión para seguir tu sistema.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Correo</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:underline">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
