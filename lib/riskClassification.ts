import type { Weather } from "@/types/weather";

export type RiskLevel = "normal" | "atencao" | "risco_elevado" | "critico";

export type RiskClassification = {
  level: RiskLevel;
  label: string;
  emoji: string;
};

const LEVEL_INFO: Record<RiskLevel, { label: string; emoji: string }> = {
  normal: { label: "NORMAL", emoji: "🟢" },
  atencao: { label: "ATENÇÃO", emoji: "🟡" },
  risco_elevado: { label: "RISCO ELEVADO", emoji: "🟠" },
  critico: { label: "CRÍTICO", emoji: "🔴" },
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  normal: "#10b981",
  atencao: "#eab308",
  risco_elevado: "#f97316",
  critico: "#ef4444",
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
