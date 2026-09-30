import { generateSummaryResponse } from "@/lib/gemini";
import {
  ROUTE_SUMMARY_SYSTEM_PROMPT,
  buildRouteSummaryPrompt,
  isRouteSummaryRequest,
} from "@/lib/summary";

export const maxDuration = 30;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRouteSummaryRequest(body)) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  return generateSummaryResponse(
    buildRouteSummaryPrompt(body),
    ROUTE_SUMMARY_SYSTEM_PROMPT
  );
}
