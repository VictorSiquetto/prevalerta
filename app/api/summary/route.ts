import { generateSummaryResponse } from "@/lib/gemini";
import { isRateLimited } from "@/lib/rateLimit";
import { buildSummaryPrompt, isSummaryRequest } from "@/lib/summary";

export const maxDuration = 30;

const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_BODY_LENGTH = 500_000;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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
