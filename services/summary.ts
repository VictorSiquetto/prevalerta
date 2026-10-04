import type { CityReport } from "@/types/weather";
import { SUMMARY_CLIENT_TIMEOUT_MS } from "@/lib/http";

export class SummaryRequestError extends Error {}

function messageForStatus(status: number): string {
  if (status === 429) {
    return "Muitos pedidos de resumo no momento. Aguarde um minuto e tente de novo.";
  }
  if (status === 503) {
    return "O resumo com IA não está disponível no momento.";
  }
  if (status === 504) {
    return "A IA demorou demais para responder. Tente novamente.";
  }
  return "Não foi possível gerar o resumo agora. Tente novamente.";
}

export async function getSummary(stops: CityReport[]): Promise<string> {
  const response = await fetch("/api/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stops }),
    signal: AbortSignal.timeout(SUMMARY_CLIENT_TIMEOUT_MS),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok || typeof result?.summary !== "string") {
    throw new SummaryRequestError(
      messageForStatus(response.ok ? 502 : response.status)
    );
  }

  return result.summary;
}
