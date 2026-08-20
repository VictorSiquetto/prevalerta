import type { Weather } from "@/types/weather";
import type { WeatherAlert } from "@/types/alert";
import { hasAlertStarted } from "@/lib/formatAlertTime";

export type RiskLevel = "normal" | "atencao" | "risco_elevado" | "critico";
export type RiskSource = "weather" | "alert";

export type RiskClassification = {
  level: RiskLevel;
  label: string;
  emoji: string;
  source: RiskSource;
};

const LEVEL_ORDER: RiskLevel[] = [
  "normal",
  "atencao",
  "risco_elevado",
  "critico",
];

const LEVEL_INFO: Record<RiskLevel, { label: string; emoji: string }> = {
  normal: { label: "NORMAL", emoji: "🟢" },
  atencao: { label: "ATENÇÃO", emoji: "🟡" },
  risco_elevado: { label: "RISCO ELEVADO", emoji: "🟠" },
  critico: { label: "CRÍTICO", emoji: "🔴" },
};

function classifyFromWeather(weather: Weather): RiskLevel {
  const { precipitation, precipitationProbability, windGusts } = weather;

  if (precipitation >= 30 || windGusts >= 70) return "critico";
  if (precipitation >= 15 || windGusts >= 50 || precipitationProbability >= 70)
    return "risco_elevado";
  if (precipitation >= 5 || windGusts >= 35 || precipitationProbability >= 50)
    return "atencao";
  return "normal";
}

function classifyFromAlerts(alerts: WeatherAlert[]): RiskLevel {
  // "Perigo Potencial" (o nível mais brando do INMET, e o mais frequente/genérico)
  // fica de fora de propósito: ele cobre regiões inteiras e é comum demais para
  // ser um sinal confiável de que ESTA cidade está com a situação alterada.
  const activeAlerts = alerts.filter((alert) =>
    hasAlertStarted(alert.startsAt)
  );

  if (activeAlerts.some((alert) => alert.severity === "Grande Perigo"))
    return "critico";
  if (activeAlerts.some((alert) => alert.severity === "Perigo"))
    return "risco_elevado";
  return "normal";
}

export function classifyRisk(
  weather: Weather,
  alerts: WeatherAlert[]
): RiskClassification {
  const weatherLevel = classifyFromWeather(weather);
  const alertLevel = classifyFromAlerts(alerts);

  const weatherIndex = LEVEL_ORDER.indexOf(weatherLevel);
  const alertIndex = LEVEL_ORDER.indexOf(alertLevel);

  const source: RiskSource = alertIndex > weatherIndex ? "alert" : "weather";
  const level = LEVEL_ORDER[Math.max(weatherIndex, alertIndex)];

  return { level, source, ...LEVEL_INFO[level] };
}
