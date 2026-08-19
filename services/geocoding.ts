import type { Location } from "@/types/location";

export async function searchCity(city: string): Promise<Location | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=pt&format=json`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const found = data.results[0];
  return {
    name: found.name,
    state: found.admin1,
    latitude: found.latitude,
    longitude: found.longitude,
  };
}
