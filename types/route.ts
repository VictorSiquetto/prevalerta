import type { CityData } from "@/types/weather";

// Limite de paradas por rota: o servidor público do OSRM é compartilhado e
// tem limites de uso. Vale para a tela e para a rota da API.
export const MAX_ROUTE_STOPS = 25;

export type RouteInfo = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

// Situação dos dados de cada parada da rota, buscados em segundo plano
// assim que a parada é adicionada.
export type StopDataState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: CityData };
