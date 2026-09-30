import type { AlertsResult } from "@/types/alert";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

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
      alerts: Array.isArray(data?.alerts) ? data.alerts : [],
      mesoregion: typeof data?.mesoregion === "string" ? data.mesoregion : null,
      unavailable: data?.unavailable === true,
    };
  } catch (error) {
    console.error("Falha ao buscar alertas:", error);
    return UNAVAILABLE;
  }
}
