import type { HourlyForecast, Weather } from "@/types/weather";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

// A Open-Meteo às vezes devolve `null` em algum campo (dado indisponível
// naquela hora). Chuva, probabilidade e vento ausentes viram 0, para não
// aparecer "null%" na tela nem quebrar o resumo com IA.
function numberOrZero(value: unknown): number {
  return isNumber(value) ? value : 0;
}

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<Weather> {
  const url = `/api/weather?latitude=${latitude}&longitude=${longitude}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  });
  const data = await response.json();

  const { current, hourly } = data ?? {};
  if (
    !response.ok ||
    !isNumber(current?.temperature_2m) ||
    typeof current.time !== "string" ||
    !Array.isArray(hourly?.time)
  ) {
    throw new Error("Resposta inválida da API de clima.");
  }

  const hours: HourlyForecast[] = hourly.time
    .map((time: unknown, index: number) => ({
      time,
      temperature: hourly.temperature_2m?.[index],
      precipitationProbability: numberOrZero(
        hourly.precipitation_probability?.[index]
      ),
      precipitation: numberOrZero(hourly.precipitation?.[index]),
      weatherCode: numberOrZero(hourly.weather_code?.[index]),
      isDay: hourly.is_day?.[index] === 1,
    }))
    // Sem horário ou temperatura, a hora não tem o que mostrar: fica de fora.
    .filter(
      (hour: { time: unknown; temperature: unknown }) =>
        typeof hour.time === "string" &&
        isNumber(hour.temperature) &&
        hour.time >= current.time
    )
    .slice(0, 24);

  return {
    temperature: current.temperature_2m,
    humidity: numberOrZero(current.relative_humidity_2m),
    precipitation: numberOrZero(current.precipitation),
    precipitationProbability: hours[0]?.precipitationProbability ?? 0,
    windSpeed: numberOrZero(current.wind_speed_10m),
    windGusts: numberOrZero(current.wind_gusts_10m),
    weatherCode: numberOrZero(current.weather_code),
    hourly: hours,
  };
}
