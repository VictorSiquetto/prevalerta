import type { GeoJsonObject } from "geojson";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

// Guarda o pedido de cada cidade: a mesma cidade aparece várias vezes (busca,
// paradas da rota, idas e vindas entre abas) e o contorno não muda.
const cache = new Map<string, Promise<GeoJsonObject | null>>();

async function fetchBoundary(city: string): Promise<GeoJsonObject | null> {
  try {
    const response = await fetch(
      `/api/boundary?city=${encodeURIComponent(city)}`,
      { signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) }
    );
    if (!response.ok) return null;
    return (await response.json()) as GeoJsonObject;
  } catch (error) {
    console.error("Falha ao buscar contorno da cidade:", error);
    return null;
  }
}

export function getCityBoundary(city: string): Promise<GeoJsonObject | null> {
  const cached = cache.get(city);
  if (cached) return cached;

  const request = fetchBoundary(city).then((boundary) => {
    // Uma falha não fica guardada: a próxima tentativa busca de novo.
    if (!boundary) cache.delete(city);
    return boundary;
  });
  cache.set(city, request);
  return request;
}
