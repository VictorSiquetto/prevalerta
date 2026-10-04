import type { CityData } from "@/types/weather";

export const MAX_ROUTE_STOPS = 25;

export type RouteInfo = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
};

export type StopDataState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: CityData };
