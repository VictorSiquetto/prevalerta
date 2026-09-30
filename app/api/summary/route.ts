import { generateSummaryResponse } from "@/lib/gemini";
import { isRateLimited } from "@/lib/rateLimit";
import { buildSummaryPrompt, isSummaryRequest } from "@/lib/summary";

export const maxDuration = 30;

// Resumos por minuto para cada visitante: protege a cota da chave do
// Gemini contra uso abusivo da rota.
const MAX_REQUESTS_PER_MINUTE = 10;
// Tamanho máximo do pedido: um resumo de rota com o máximo de cidades fica
// bem abaixo disso.
const MAX_BODY_LENGTH = 500_000;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Uma cidade gera o resumo da cidade; duas ou mais, o resumo da rota.
export async function POST(request: Request) {
  if (isRateLimited(request, MAX_REQUESTS_PER_MINUTE)) {
    return Response.json(
      { error: "Muitos pedidos de resumo. Aguarde um minuto." },
      { status: 429 }
    );
  }

  const text = await request.text();
  const body = text.length <= MAX_BODY_LENGTH ? parseJson(text) : null;
  if (!isSummaryRequest(body)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  return generateSummaryResponse(buildSummaryPrompt(body));
}
