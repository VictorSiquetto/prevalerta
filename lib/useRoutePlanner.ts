import { useEffect, useRef, useState } from "react";
import { lookupSaoPauloCity } from "@/services/geocoding";
import { getRoute } from "@/services/routing";
import { getCityData } from "@/services/weather";
import type { Location } from "@/types/location";
import {
  MAX_ROUTE_STOPS,
  type RouteInfo,
  type StopDataState,
} from "@/types/route";
import { MAX_SUMMARY_STOPS } from "@/types/summary";
import type { CityReport } from "@/types/weather";

export type AddStopResult = { ok: true } | { ok: false; error: string };

export function useRoutePlanner() {
  const [stops, setStops] = useState<Location[]>([]);
  const [stopData, setStopData] = useState<Record<string, StopDataState>>({});
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<{
    key: string;
    info: RouteInfo | null;
  } | null>(null);
  const requestIds = useRef<Record<string, number>>({});

  const routeKey = stops
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join(";");

  useEffect(() => {
    if (stops.length < 2) return;

    let cancelled = false;
    getRoute(stops).then((info) => {
      if (!cancelled) setRouteResult({ key: routeKey, info });
    });

    return () => {
      cancelled = true;
    };
  }, [stops, routeKey]);

  async function loadStopData(stop: Location) {
    const requestId = (requestIds.current[stop.name] ?? 0) + 1;
    requestIds.current[stop.name] = requestId;
    const isLatest = () => requestIds.current[stop.name] === requestId;

    setStopData((prev) => ({ ...prev, [stop.name]: { status: "loading" } }));
    try {
      const data = await getCityData(stop);
      if (!isLatest()) return;
      setStopData((prev) => ({ ...prev, [stop.name]: { status: "ready", data } }));
    } catch (error) {
      console.error(`Falha ao buscar dados de ${stop.name}:`, error);
      if (!isLatest()) return;
      setStopData((prev) => ({ ...prev, [stop.name]: { status: "error" } }));
    }
  }

  function startWith({ location, weather, alertsResult }: CityReport) {
    setStops([location]);
    setSelectedName(location.name);
    setStopData((prev) => ({
      ...prev,
      [location.name]: { status: "ready", data: { weather, alertsResult } },
    }));
  }

  async function addStop(cityName: string): Promise<AddStopResult> {
    if (stops.length >= MAX_ROUTE_STOPS) {
      return { ok: false, error: `A rota aceita até ${MAX_ROUTE_STOPS} paradas.` };
    }

    const lookup = await lookupSaoPauloCity(cityName);
    if (!lookup.ok) return lookup;

    const { location } = lookup;
    if (stops.some((stop) => stop.name === location.name)) {
      return { ok: false, error: "Essa cidade já está na rota." };
    }

    setStops((prev) => [...prev, location]);
    setSelectedName(location.name);
    loadStopData(location);
    return { ok: true };
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStop(index: number, direction: -1 | 1) {
    setStops((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }

  function clear() {
    setStops([]);
    setSelectedName(null);
  }

  const hasLine = stops.length >= 2;
  const currentRoute =
    hasLine && routeResult?.key === routeKey ? routeResult : null;

  const reports = stops.map((stop): CityReport | null => {
    const state = stopData[stop.name];
    return state?.status === "ready" ? { location: stop, ...state.data } : null;
  });
  const readyReports = reports.filter(
    (report): report is CityReport => report !== null
  );
  const areAllReady = readyReports.length === stops.length;
  const hasTooManyStops = stops.length > MAX_SUMMARY_STOPS;
  const hasStopError = stops.some(
    (stop) => stopData[stop.name]?.status === "error"
  );

  return {
    stops,
    stopData,
    selectedStop:
      stops.find((stop) => stop.name === selectedName) ?? stops[0] ?? null,
    selectStop: setSelectedName,
    routeInfo: currentRoute?.info ?? null,
    isRouteLoading: hasLine && !currentRoute,
    loadStopData,
    startWith,
    addStop,
    removeStop,
    moveStop,
    clear,
    summary: {
      stops: hasLine && areAllReady && !hasTooManyStops ? readyReports : null,
      hint: hasTooManyStops
        ? `O resumo da rota aceita até ${MAX_SUMMARY_STOPS} paradas.`
        : hasStopError
          ? "Não foi possível carregar os dados de todas as paradas. Tente de novo na aba da cidade com erro."
          : !areAllReady
            ? "Carregando os dados das paradas..."
            : null,
      key: `rota:${reports
        .map(
          (report, index) =>
            `${stops[index].name}@${report?.weather.hourly[0]?.time ?? ""}`
        )
        .join("|")}`,
    },
  };
}
