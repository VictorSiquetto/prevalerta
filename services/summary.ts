import type { SummaryRequest } from "@/types/summary";

export async function getSummary(data: SummaryRequest): Promise<string> {
  const response = await fetch("/api/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();

  if (!response.ok || typeof result.summary !== "string") {
    throw new Error(result.error ?? "Resposta inválida do resumo.");
  }

  return result.summary;
}
