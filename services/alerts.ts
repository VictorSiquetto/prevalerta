import type { WeatherAlert } from "@/types/alert";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

export type AlertsResult = {
  alerts: WeatherAlert[];
  mesoregion: string | null;
  // true quando não foi possível consultar o INMET (a lista vazia, nesse
  // caso, não significa que não há alertas).
  unavailable: boolean;
};

const UNAVAILABLE: AlertsResult = {
  alerts: [],
  mesoregion: null,
  unavailable: true,
};

export async function getAlerts(city: string): Promise<AlertsResult> {
  try {
    const response = await fetch(
      `/api/alerts?city=${encodeURIComponent(city)}`,
      { signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) }
    );
    if (!response.ok) return UNAVAILABLE;

    const data = await response.json();
    return {
      alerts: Array.isArray(data.alerts) ? data.alerts : [],
      mesoregion: data.mesoregion ?? null,
      unavailable: data.unavailable === true,
    };
  } catch (error) {
    console.error("Falha ao buscar alertas:", error);
    return UNAVAILABLE;
  }
}
