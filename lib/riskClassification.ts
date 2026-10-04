import type { Weather } from "@/types/weather";

export type RiskLevel = "normal" | "atencao" | "risco_elevado" | "critico";

export type RiskClassification = {
  level: RiskLevel;
  label: string;
  emoji: string;
  color: string;
};

const LEVEL_INFO: Record<RiskLevel, Omit<RiskClassification, "level">> = {
  normal: { label: "NORMAL", emoji: "🟢", color: "#10b981" },
  atencao: { label: "ATENÇÃO", emoji: "🟡", color: "#eab308" },
  risco_elevado: { label: "RISCO ELEVADO", emoji: "🟠", color: "#f97316" },
  critico: { label: "CRÍTICO", emoji: "🔴", color: "#ef4444" },
};

function getLevel(weather: Weather): RiskLevel {
  const { precipitation, precipitationProbability, windGusts } = weather;

  if (precipitation >= 30 || windGusts >= 70) return "critico";
  if (precipitation >= 15 || windGusts >= 50 || precipitationProbability >= 70)
    return "risco_elevado";
  if (precipitation >= 5 || windGusts >= 35 || precipitationProbability >= 50)
    return "atencao";
  return "normal";
}

export function classifyRisk(weather: Weather): RiskClassification {
  const level = getLevel(weather);
  return { level, ...LEVEL_INFO[level] };
}
