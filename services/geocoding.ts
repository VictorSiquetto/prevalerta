import type { Location } from "@/types/location";

export async function searchCity(city: string): Promise<Location | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=5&language=pt&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding respondeu com status ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data.results) || data.results.length === 0) {
    return null;
  }

  type GeocodingResult = { admin1?: string };
  const found =
    data.results.find(
      (result: GeocodingResult) => result.admin1 === "São Paulo"
    ) ?? data.results[0];
  return {
    name: found.name,
    state: found.admin1,
    latitude: found.latitude,
    longitude: found.longitude,
  };
}
