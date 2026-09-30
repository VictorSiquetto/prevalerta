import { generateSummaryResponse } from "@/lib/gemini";
import {
  SUMMARY_SYSTEM_PROMPT,
  buildSummaryPrompt,
  isSummaryRequest,
} from "@/lib/summary";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isSummaryRequest(body)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  return generateSummaryResponse(
    buildSummaryPrompt(body),
    SUMMARY_SYSTEM_PROMPT
  );
}
