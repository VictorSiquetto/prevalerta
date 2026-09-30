import type { AlertsResult } from "@/services/alerts";
import type { Weather } from "@/types/weather";

export type RouteInfo = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

export type CityData = {
  weather: Weather;
  alertsResult: AlertsResult;
};

// Situação dos dados de cada parada da rota, buscados em segundo plano
// assim que a parada é adicionada.
export type StopDataState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: CityData };
