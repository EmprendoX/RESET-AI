"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingAnswers } from "@ai-coach/shared";

const FOCUS_AREAS = [
  "dinero", "negocio", "mentalidad", "disciplina", "habitos", "calma",
  "ventas", "contenido", "proposito", "productividad", "claridad", "confianza",
];

const COACHING_STYLES = [
  "directo", "suave", "estrategico", "espiritual", "intenso", "motivador", "practico", "estructurado",
];

const defaultAnswers: OnboardingAnswers = {
  step1: { name: "", country: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, dailyTimeMinutes: 30 },
  step2: { mainGoal90Days: "", focusArea: "negocio" },
  step3: { mainBlocker: "", repeatingPattern: "", triedBefore: "" },
  step4: { hasBusiness: false, offer: "", idealCustomer: "", mainChannel: "", growthGoal: "", hardestPart: "" },
  step5: { coachingStyle: "practico" },
  step6: { memoryEnabled: true },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>(defaultAnswers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    diagnosis: string;
    sevenDayPlan: Array<{ day: number; title: string; description: string }>;
  } | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
      return;
    }
    setResult({ diagnosis: data.diagnosis, sevenDayPlan: data.sevenDayPlan });
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <h1 className="mb-4 text-2xl font-semibold">¡Listo, {answers.step1.name}!</h1>
        <p className="mb-6 whitespace-pre-wrap text-neutral-700">{result.diagnosis}</p>
        <h2 className="mb-3 text-lg font-medium">Tu plan de 7 días</h2>
        <div className="space-y-3">
          {result.sevenDayPlan.map((day) => (
            <div key={day.day} className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="font-medium">Día {day.day}: {day.title}</p>
              <p className="text-sm text-neutral-600">{day.description}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/chat")}
          className="mt-6 rounded-lg bg-neutral-900 px-6 py-2 text-sm font-medium text-white"
        >
          Ir al chat
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="mb-2 text-2xl font-semibold">Onboarding</h1>
      <p className="mb-6 text-sm text-neutral-500">Paso {step} de 6</p>

      {step === 1 && (
        <div className="space-y-4">
          <input placeholder="¿Cómo te llamas?" value={answers.step1.name} onChange={(e) => setAnswers({ ...answers, step1: { ...answers.step1, name: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="¿En qué país estás?" value={answers.step1.country} onChange={(e) => setAnswers({ ...answers, step1: { ...answers.step1, country: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Zona horaria" value={answers.step1.timezone} onChange={(e) => setAnswers({ ...answers, step1: { ...answers.step1, timezone: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input type="number" placeholder="Minutos al día" value={answers.step1.dailyTimeMinutes} onChange={(e) => setAnswers({ ...answers, step1: { ...answers.step1, dailyTimeMinutes: Number(e.target.value) } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <textarea placeholder="¿Qué quieres lograr en 90 días?" value={answers.step2.mainGoal90Days} onChange={(e) => setAnswers({ ...answers, step2: { ...answers.step2, mainGoal90Days: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
          <select value={answers.step2.focusArea} onChange={(e) => setAnswers({ ...answers, step2: { ...answers.step2, focusArea: e.target.value as OnboardingAnswers["step2"]["focusArea"] } })} className="w-full rounded-lg border px-3 py-2 text-sm">
            {FOCUS_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <textarea placeholder="¿Qué te está frenando?" value={answers.step3.mainBlocker} onChange={(e) => setAnswers({ ...answers, step3: { ...answers.step3, mainBlocker: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
          <textarea placeholder="¿Qué patrón se repite?" value={answers.step3.repeatingPattern} onChange={(e) => setAnswers({ ...answers, step3: { ...answers.step3, repeatingPattern: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
          <textarea placeholder="¿Qué has intentado antes?" value={answers.step3.triedBefore} onChange={(e) => setAnswers({ ...answers, step3: { ...answers.step3, triedBefore: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={answers.step4.hasBusiness} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, hasBusiness: e.target.checked } })} /> Tengo negocio o proyecto</label>
          {answers.step4.hasBusiness && <input placeholder="Nombre del negocio" value={answers.step4.businessName ?? ""} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, businessName: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />}
          <input placeholder="¿Qué vendes o construyes?" value={answers.step4.offer} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, offer: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="¿A quién ayudas?" value={answers.step4.idealCustomer} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, idealCustomer: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Canal principal" value={answers.step4.mainChannel} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, mainChannel: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Meta de crecimiento" value={answers.step4.growthGoal} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, growthGoal: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="¿Qué se te dificulta más?" value={answers.step4.hardestPart} onChange={(e) => setAnswers({ ...answers, step4: { ...answers.step4, hardestPart: e.target.value } })} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
      )}

      {step === 5 && (
        <select value={answers.step5.coachingStyle} onChange={(e) => setAnswers({ ...answers, step5: { coachingStyle: e.target.value as OnboardingAnswers["step5"]["coachingStyle"] } })} className="w-full rounded-lg border px-3 py-2 text-sm">
          {COACHING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">¿Quieres que el coach recuerde tus respuestas y avances?</p>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={answers.step6.memoryEnabled} onChange={() => setAnswers({ ...answers, step6: { memoryEnabled: true } })} /> Sí, activar memoria</label>
          <label className="flex items-center gap-2 text-sm"><input type="radio" checked={!answers.step6.memoryEnabled} onChange={() => setAnswers({ ...answers, step6: { memoryEnabled: false } })} /> No, sin memoria personalizada</label>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-3">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="rounded-lg border px-4 py-2 text-sm">Atrás</button>}
        {step < 6 ? (
          <button onClick={() => setStep(step + 1)} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Siguiente</button>
        ) : (
          <button onClick={handleComplete} disabled={loading} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50">
            {loading ? "Generando..." : "Completar onboarding"}
          </button>
        )}
      </div>
    </div>
  );
}
