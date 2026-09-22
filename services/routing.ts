import type { Location } from "@/types/location";
import type { RouteInfo } from "@/types/route";

export async function getRoute(stops: Location[]): Promise<RouteInfo | null> {
  if (stops.length < 2) return null;

  try {
    const points = stops
      .map((stop) => `${stop.latitude},${stop.longitude}`)
      .join(";");
    const response = await fetch(`/api/route?points=${points}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data.coordinates)) return null;

    return data as RouteInfo;
  } catch (error) {
    console.error("Falha ao buscar rota:", error);
    return null;
  }
}
