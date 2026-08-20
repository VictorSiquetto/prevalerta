import type { WeatherAlert } from "@/types/alert";

export type AlertsResult = {
  alerts: WeatherAlert[];
  mesoregion: string | null;
};

export async function getAlerts(city: string): Promise<AlertsResult> {
  try {
    const response = await fetch(
      `/api/alerts?city=${encodeURIComponent(city)}`
    );
    if (!response.ok) return { alerts: [], mesoregion: null };

    const data = await response.json();
    return { alerts: data.alerts ?? [], mesoregion: data.mesoregion ?? null };
  } catch (error) {
    console.error("Falha ao buscar alertas:", error);
    return { alerts: [], mesoregion: null };
  }
}
