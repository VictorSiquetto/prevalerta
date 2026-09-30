import { ApiError, GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.8-flash";

// Gera um resumo com o Gemini e já devolve a resposta HTTP pronta, no mesmo
// formato para o resumo de uma cidade e o da rota: { summary } ou { error }.
export async function generateSummaryResponse(
  input: string,
  systemInstruction: string
): Promise<Response> {
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
      input,
      system_instruction: systemInstruction,
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
