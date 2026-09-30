import type { Location } from "@/types/location";
import type { RouteInfo } from "@/types/route";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

export async function getRoute(stops: Location[]): Promise<RouteInfo | null> {
  if (stops.length < 2) return null;

  try {
    const points = stops
      .map((stop) => `${stop.latitude},${stop.longitude}`)
      .join(";");
    const response = await fetch(`/api/route?points=${points}`, {
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (
      !Array.isArray(data?.coordinates) ||
      typeof data.distanceKm !== "number" ||
      typeof data.durationMin !== "number"
    ) {
      return null;
    }

    return data as RouteInfo;
  } catch (error) {
    console.error("Falha ao buscar rota:", error);
    return null;
  }
}
