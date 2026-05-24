import type { TypedSupabaseClient } from "@ai-coach/db";
import type OpenAI from "openai";

export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_active_goals",
      description: "Obtiene las metas activas del usuario",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "search_user_memories",
      description: "Busca memorias activas del usuario",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Tipo de memoria a filtrar" },
          query: { type: "string", description: "Texto a buscar" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_user_memory",
      description: "Guarda una memoria del usuario (solo si memory_enabled)",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["type", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goal_proposal",
      description: "Propone una meta (requiere confirmación del usuario, no persiste directamente)",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_recommendation",
      description: "Crea una recomendación para el usuario",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          reason: { type: "string" },
        },
        required: ["type", "title", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Crea una tarea para el usuario",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          due_date: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_events",
      description: "Obtiene eventos recientes del usuario",
      parameters: {
        type: "object",
        properties: { limit: { type: "number" } },
      },
    },
  },
];

export interface ToolResult {
  name: string;
  result: unknown;
}

export async function executeTool(
  client: TypedSupabaseClient,
  userId: string,
  memoryEnabled: boolean,
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case "get_active_goals": {
      const { data } = await client
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");
      return { name, result: data ?? [] };
    }
    case "search_user_memories": {
      if (!memoryEnabled) return { name, result: [] };
      let query = client
        .from("memories")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);
      if (args.type) query = query.eq("type", args.type as string);
      const { data } = await query.limit(20);
      const filtered = args.query
        ? (data ?? []).filter(
            (m) =>
              m.title.includes(args.query as string) ||
              m.content.includes(args.query as string)
          )
        : data;
      return { name, result: filtered ?? [] };
    }
    case "save_user_memory": {
      if (!memoryEnabled) {
        return { name, result: { error: "Memoria desactivada por el usuario" } };
      }
      const { data, error } = await client
        .from("memories")
        .insert({
          user_id: userId,
          type: args.type as string,
          title: args.title as string,
          content: args.content as string,
          source: "conversation",
          confidence: "high",
          is_active: true,
        })
        .select()
        .single();
      return { name, result: error ? { error: error.message } : data };
    }
    case "create_goal_proposal": {
      return {
        name,
        result: {
          proposal: true,
          title: args.title,
          description: args.description,
          category: args.category,
          message: "Meta propuesta. El usuario debe confirmar para guardarla.",
        },
      };
    }
    case "create_recommendation": {
      const { data, error } = await client
        .from("recommendations")
        .insert({
          user_id: userId,
          type: args.type as string,
          title: args.title as string,
          description: (args.description as string) ?? null,
          reason: (args.reason as string) ?? null,
          status: "pending",
          created_by: "coach",
        })
        .select()
        .single();
      return { name, result: error ? { error: error.message } : data };
    }
    case "create_task": {
      const { data, error } = await client
        .from("tasks")
        .insert({
          user_id: userId,
          title: args.title as string,
          description: (args.description as string) ?? null,
          due_date: (args.due_date as string) ?? null,
          status: "pending",
          source: "coach",
        })
        .select()
        .single();
      return { name, result: error ? { error: error.message } : data };
    }
    case "get_recent_events": {
      const limit = (args.limit as number) ?? 10;
      const { data } = await client
        .from("user_events")
        .select("*")
        .eq("user_id", userId)
        .order("occurred_at", { ascending: false })
        .limit(limit);
      return { name, result: data ?? [] };
    }
    default:
      return { name, result: { error: `Unknown tool: ${name}` } };
  }
}
