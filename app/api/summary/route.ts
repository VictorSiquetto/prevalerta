import { ApiError, GoogleGenAI } from "@google/genai";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryPrompt,
  isSummaryRequest,
} from "@/lib/summary";

export const maxDuration = 30;

const MODEL = "gemini-3.8-flash";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isSummaryRequest(body)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Resumo por IA não configurado." },
      { status: 503 }
    );
  }

  try {
    const ai = new GoogleGenAI({});
    const interaction = await ai.interactions.create({
      model: MODEL,
      input: buildSummaryPrompt(body),
      system_instruction: SUMMARY_SYSTEM_PROMPT,
      generation_config: { max_output_tokens: 2048, thinking_level: "low" },
      store: false,
    });

    const summary = interaction.output_text?.trim();
    if (interaction.status !== "completed" || !summary) {
      return Response.json(
        { error: "Não foi possível gerar o resumo." },
        { status: 502 }
      );
    }

    return Response.json({ summary });
  } catch (error) {
    console.error("Falha ao gerar resumo:", error);
    const status = error instanceof ApiError && error.status === 429 ? 429 : 502;
    return Response.json(
      { error: "Não foi possível gerar o resumo." },
      { status }
    );
  }
}
