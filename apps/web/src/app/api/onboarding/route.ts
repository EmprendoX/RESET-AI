import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import {
  onboardingSchema,
  createServiceClient,
  emitEvent,
  auditLog,
} from "@ai-coach/db";
import { generateOnboardingArtifacts } from "@ai-coach/agent";
import { generateIdempotencyKey } from "@ai-coach/shared";
import { getFeatureFlag } from "@ai-coach/config";

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_ONBOARDING_ENABLED")) {
    return NextResponse.json({ error: "Onboarding disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid onboarding data" }, { status: 400 });
    }

    const answers = parsed.data;
    const supabase = await createClient();
    const service = createServiceClient();

    await emitEvent(service, {
      userId: user.id,
      eventType: "onboarding_started",
      idempotencyKey: generateIdempotencyKey("onboarding_started", user.id),
    });

    await supabase.from("onboarding_forms").upsert(
      {
        user_id: user.id,
        answers_json: answers,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("coach_profiles").update({
      name: answers.step1.name,
      timezone: answers.step1.timezone,
      main_focus: answers.step2.focusArea,
      coaching_style: answers.step5.coachingStyle,
      memory_enabled: answers.step6.memoryEnabled,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    await supabase.from("business_profiles").upsert(
      {
        user_id: user.id,
        has_business: answers.step4.hasBusiness,
        business_name: answers.step4.businessName ?? null,
        offer: answers.step4.offer,
        ideal_customer: answers.step4.idealCustomer,
        main_channel: answers.step4.mainChannel,
        monthly_goal: answers.step4.growthGoal,
        main_blocker: answers.step3.mainBlocker,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    const answersSummary = JSON.stringify(answers, null, 2);
    let artifacts;
    try {
      artifacts = await generateOnboardingArtifacts(answersSummary);
    } catch {
      artifacts = {
        diagnosis: `Tu meta principal es: ${answers.step2.mainGoal90Days}. Tu bloqueo principal: ${answers.step3.mainBlocker}.`,
        sevenDayPlan: [
          { day: 1, title: "Aclarar tu oferta", description: "Define en una frase a quién ayudas." },
          { day: 2, title: "Escribir tu mensaje", description: "Redacta por qué tu oferta ayuda." },
          { day: 3, title: "Primer contacto", description: "Contacta a 1 persona." },
          { day: 4, title: "Contenido simple", description: "Publica algo útil." },
          { day: 5, title: "Seguimiento", description: "Haz follow-up a un prospecto." },
          { day: 6, title: "Revisar bloqueos", description: "Identifica qué te frenó." },
          { day: 7, title: "Check-in", description: "Evalúa avances con tu coach." },
        ],
        initialRecommendations: [
          {
            type: "task",
            title: "Escribe tu oferta en una frase",
            description: "Define claramente a quién ayudas y cómo.",
            reason: answers.step3.mainBlocker,
          },
        ],
        initialGoal: {
          title: answers.step2.mainGoal90Days,
          description: answers.step2.mainGoal90Days,
          category: answers.step2.focusArea,
        },
      };
    }

    const { data: goal } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: artifacts.initialGoal.title,
        description: artifacts.initialGoal.description,
        category: artifacts.initialGoal.category,
        status: "active",
        progress: 0,
        created_by: "coach",
      })
      .select()
      .single();

    if (answers.step6.memoryEnabled) {
      await supabase.from("memories").insert([
        {
          user_id: user.id,
          type: "profile",
          title: "Meta principal",
          content: answers.step2.mainGoal90Days,
          source: "onboarding",
          confidence: "high",
        },
        {
          user_id: user.id,
          type: "blocker",
          title: "Bloqueo principal",
          content: answers.step3.mainBlocker,
          source: "onboarding",
          confidence: "high",
        },
        {
          user_id: user.id,
          type: "business",
          title: "Contexto de negocio",
          content: `${answers.step4.offer} — Cliente: ${answers.step4.idealCustomer}`,
          source: "onboarding",
          confidence: "high",
        },
      ]);
    }

    for (const rec of artifacts.initialRecommendations) {
      await supabase.from("recommendations").insert({
        user_id: user.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        reason: rec.reason,
        status: "pending",
        created_by: "coach",
      });
    }

    for (const day of artifacts.sevenDayPlan) {
      await supabase.from("tasks").insert({
        user_id: user.id,
        title: `Día ${day.day}: ${day.title}`,
        description: day.description,
        status: "pending",
        source: "seven_day_plan",
      });
    }

    await supabase.from("recommendations").insert({
      user_id: user.id,
      type: "plan_7_days",
      title: "Plan de 7 días",
      description: artifacts.diagnosis,
      reason: "Generado al completar onboarding",
      status: "accepted",
      created_by: "coach",
    });

    await emitEvent(service, {
      userId: user.id,
      eventType: "onboarding_completed",
      idempotencyKey: generateIdempotencyKey("onboarding_completed", user.id),
    });

    if (goal) {
      await emitEvent(service, {
        userId: user.id,
        eventType: "goal_created",
        objectType: "goal",
        objectId: goal.id,
        idempotencyKey: generateIdempotencyKey("goal_created", user.id, goal.id),
      });
    }

    await auditLog(service, {
      userId: user.id,
      action: "onboarding_completed",
      entityType: "coach_profile",
      entityId: user.id,
    });

    return NextResponse.json({
      diagnosis: artifacts.diagnosis,
      sevenDayPlan: artifacts.sevenDayPlan,
      initialRecommendations: artifacts.initialRecommendations,
      initialGoal: artifacts.initialGoal,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No pudimos guardar tus respuestas. Revisa tu conexión e intenta de nuevo." },
      { status: 500 }
    );
  }
}
