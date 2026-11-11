import type { GeoJsonObject } from "geojson";
import { CLIENT_TIMEOUT_MS } from "@/lib/http";

type Feature = { geometry?: { type?: unknown; coordinates?: unknown } };

const cache = new Map<string, Promise<GeoJsonObject | null>>();

function isBoundaryCollection(data: unknown): data is GeoJsonObject {
  if (typeof data !== "object" || data === null) return false;
  const { type, features } = data as { type?: unknown; features?: unknown };
  return (
    type === "FeatureCollection" &&
    Array.isArray(features) &&
    features.length > 0 &&
    features.every((feature: Feature | null) => {
      const geometry = feature?.geometry;
      return (
        (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon") &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length > 0
      );
    })
  );
}

async function fetchBoundary(city: string): Promise<GeoJsonObject | null> {
  try {
    const response = await fetch(
      `/api/boundary?city=${encodeURIComponent(city)}`,
      { signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS) }
    );
    if (!response.ok) return null;

    const data: unknown = await response.json();
    return isBoundaryCollection(data) ? data : null;
  } catch (error) {
    console.error("Falha ao buscar contorno da cidade:", error);
    return null;
  }
}

export function getCityBoundary(city: string): Promise<GeoJsonObject | null> {
  const cached = cache.get(city);
  if (cached) return cached;

  const request = fetchBoundary(city).then((boundary) => {
    if (!boundary) cache.delete(city);
    return boundary;
  });
  cache.set(city, request);
  return request;
}
