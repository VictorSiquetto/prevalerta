import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];
const ATTEMPT_TIMEOUT_MS = 9_000;

function getErrorStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : null;
}

export async function generateSummaryResponse({
  input,
  systemInstruction,
}: {
  input: string;
  systemInstruction: string;
}): Promise<Response> {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Resumo por IA não configurado." },
      { status: 503 }
    );
  }

  const ai = new GoogleGenAI({});
  let isOverloaded = false;

  for (const model of MODELS) {
    try {
      const interaction = await ai.interactions.create(
        {
          model,
          input,
          system_instruction: systemInstruction,
          generation_config: { max_output_tokens: 2048, thinking_level: "low" },
          store: false,
        },
        { maxRetries: 0, timeout: ATTEMPT_TIMEOUT_MS }
      );

      const summary = interaction.output_text?.trim();
      if (interaction.status === "completed" && summary) {
        return Response.json({ summary });
      }
      console.error(`Resposta sem resumo do modelo ${model}:`, interaction.status);
    } catch (error) {
      console.error(
        `Falha ao gerar resumo com o modelo ${model}:`,
        error instanceof Error ? error.message : error
      );
      const status = getErrorStatus(error);
      if (status === 429 || status === 503) isOverloaded = true;
    }
  }

  return Response.json(
    { error: "Não foi possível gerar o resumo." },
    { status: isOverloaded ? 503 : 502 }
  );
}
