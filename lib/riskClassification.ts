import type { Weather } from "@/types/weather";

export type RiskLevel = "normal" | "atencao" | "risco_elevado" | "critico";

export type RiskClassification = {
  level: RiskLevel;
  label: string;
  emoji: string;
};

export function classifyRisk(weather: Weather): RiskClassification {
  const { precipitation, precipitationProbability, windGusts } = weather;

  if (precipitation >= 30 || windGusts >= 70) {
    return { level: "critico", label: "CRÍTICO", emoji: "🔴" };
  }

  if (precipitation >= 15 || windGusts >= 50 || precipitationProbability >= 70) {
    return { level: "risco_elevado", label: "RISCO ELEVADO", emoji: "🟠" };
  }

  if (precipitation >= 5 || windGusts >= 35 || precipitationProbability >= 50) {
    return { level: "atencao", label: "ATENÇÃO", emoji: "🟡" };
  }

  return { level: "normal", label: "NORMAL", emoji: "🟢" };
}
