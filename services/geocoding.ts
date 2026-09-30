import type { Location } from "@/types/location";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

type GeocodingResult = {
  name?: unknown;
  admin1?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

// Só aceita resultados com nome e coordenadas válidos: um resultado sem
// coordenadas levaria o mapa e a busca do clima a falhar mais adiante.
function toLocation(result: GeocodingResult): Location | null {
  const { name, admin1, latitude, longitude } = result;
  if (
    typeof name !== "string" ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return {
    name,
    state: typeof admin1 === "string" ? admin1 : "",
    latitude,
    longitude,
  };
}

export async function searchCity(city: string): Promise<Location | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=5&language=pt&format=json`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Geocoding respondeu com status ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data?.results)) {
    return null;
  }

  const locations = (data.results as GeocodingResult[])
    .map(toLocation)
    .filter((location): location is Location => location !== null);

  return (
    locations.find((location) => location.state === "São Paulo") ??
    locations[0] ??
    null
  );
}
