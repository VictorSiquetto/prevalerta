"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { searchCity } from "@/services/geocoding";
import { getWeather } from "@/services/weather";
import { getAlerts, type AlertsResult } from "@/services/alerts";
import { getRoute } from "@/services/routing";
import { classifyRisk } from "@/lib/riskClassification";
import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
} from "@/lib/searchHistory";
import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import type { RouteInfo } from "@/types/route";
import WeatherCard from "@/components/WeatherCard";
import HourlyForecastList from "@/components/HourlyForecastList";
import AlertsList from "@/components/AlertsList";
import StatusMessage from "@/components/StatusMessage";
import AiSummary from "@/components/AiSummary";
import SearchHistory from "@/components/SearchHistory";
import RoutePanel from "@/components/RoutePanel";

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      Carregando mapa...
    </div>
  ),
});

export default function Home() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [alertsResult, setAlertsResult] = useState<AlertsResult>({
    alerts: [],
    mesoregion: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [history, setHistory] = useState<Location[]>(() => getSearchHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [routeStops, setRouteStops] = useState<Location[]>([]);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
  const [rawRouteInfo, setRawRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const dragStartY = useRef<number | null>(null);

  // Busca a rota real (seguindo estradas) sempre que a lista de paradas
  // muda. `cancelled` evita atualizar o estado se as paradas mudarem de
  // novo antes dessa busca terminar. Com menos de 2 paradas não há o que
  // buscar; `routeInfo` (abaixo) já resolve pra null nesse caso sozinho.
  useEffect(() => {
    if (routeStops.length < 2) return;

    let cancelled = false;
    setIsRouteLoading(true);
    getRoute(routeStops).then((result) => {
      if (cancelled) return;
      setRawRouteInfo(result);
      setIsRouteLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [routeStops]);

  function handleSheetPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStartY.current = event.clientY;
  }

  function handleSheetPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;

    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;

    const DRAG_THRESHOLD = 30;
    if (delta > DRAG_THRESHOLD) {
      setIsSheetExpanded(false);
    } else if (delta < -DRAG_THRESHOLD) {
      setIsSheetExpanded(true);
    } else {
      setIsSheetExpanded((prev) => !prev);
    }
  }

  // Busca por nome (usa o geocoding) ou, quando vem do histórico, usa a
  // localização já conhecida e pula direto para o clima.
  async function runSearch(options: { cityName?: string; known?: Location }) {
    if (isFetchingRef.current) return;

    const cityName = options.known?.name ?? options.cityName ?? "";
    if (!cityName.trim()) {
      setError("Digite o nome de uma cidade.");
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsSheetExpanded(true);
    setIsHistoryOpen(false);
    try {
      const found = options.known ?? (await searchCity(cityName));

      if (!found) {
        setLocation(null);
        setWeather(null);
        setAlertsResult({ alerts: [], mesoregion: null });
        setError(
          "Não conseguimos encontrar essa cidade. Verifique o nome e tente novamente."
        );
        return;
      }

      if (found.state !== "São Paulo") {
        setLocation(null);
        setWeather(null);
        setAlertsResult({ alerts: [], mesoregion: null });
        setError(
          "No momento, este aplicativo cobre apenas cidades do Estado de São Paulo."
        );
        return;
      }

      setLocation(found);

      const [weatherData, alertsData] = await Promise.all([
        getWeather(found.latitude, found.longitude),
        getAlerts(found.name),
      ]);
      setWeather(weatherData);
      setAlertsResult(alertsData);
      setHistory(addToSearchHistory(found));
    } catch (caughtError) {
      console.error("Falha ao buscar dados meteorológicos:", caughtError);
      setLocation(null);
      setWeather(null);
      setAlertsResult({ alerts: [], mesoregion: null });
      setError(
        "Não foi possível obter os dados meteorológicos. Tente novamente."
      );
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleSelectHistory(item: Location) {
    setCity(item.name);
    runSearch({ known: item });
  }

  function handleRemoveHistoryItem(name: string) {
    setHistory(removeFromSearchHistory(name));
  }

  function handleClearHistory() {
    setHistory(clearSearchHistory());
  }

  function handleToggleRoutePanel() {
    setIsRoutePanelOpen((prev) => {
      const next = !prev;
      // Ao abrir pela primeira vez, começa a rota com a cidade já pesquisada.
      if (next && routeStops.length === 0 && location) {
        setRouteStops([location]);
      }
      return next;
    });
  }

  async function handleAddRouteStop(
    cityName: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const found = await searchCity(cityName);

    if (!found) {
      return { ok: false, error: "Não conseguimos encontrar essa cidade." };
    }
    if (found.state !== "São Paulo") {
      return {
        ok: false,
        error: "No momento, cobrimos apenas cidades do Estado de São Paulo.",
      };
    }
    if (routeStops.some((stop) => stop.name === found.name)) {
      return { ok: false, error: "Essa cidade já está na rota." };
    }

    setRouteStops((prev) => [...prev, found]);
    return { ok: true };
  }

  function handleRemoveRouteStop(index: number) {
    setRouteStops((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMoveRouteStop(index: number, direction: -1 | 1) {
    setRouteStops((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }

  function handleClearRoute() {
    setRouteStops([]);
  }

  const showPanel = isLoading || error || (location && weather);
  const risk = weather ? classifyRisk(weather) : null;
  const summaryData =
    location && weather
      ? {
          location,
          weather,
          alerts: alertsResult.alerts,
          mesoregion: alertsResult.mesoregion,
        }
      : null;
  // Uma busca nova gera uma chave nova, o que zera o resumo anterior.
  const summaryKey = `${location?.name}-${weather?.hourly[0]?.time}`;
  const routeInfo = routeStops.length >= 2 ? rawRouteInfo : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="absolute inset-0 z-0">
        <CityMap
          location={location}
          temperature={weather?.temperature}
          riskLevel={risk?.level}
          routeStops={routeStops}
          routeInfo={routeInfo}
        />
      </div>

      <div className="absolute top-4 left-4 right-4 z-[1100] mx-auto max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch({ cityName: city });
          }}
          className="relative flex gap-2 rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95"
        >
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => setIsHistoryOpen(true)}
            onBlur={() => setIsHistoryOpen(false)}
            placeholder="Pesquise uma cidade..."
            enterKeyHint="search"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isLoading ? "Buscando..." : "Pesquisar"}
          </button>

          <button
            type="button"
            onClick={handleToggleRoutePanel}
            title={isRoutePanelOpen ? "Fechar rota" : "Planejar rota"}
            aria-label={isRoutePanelOpen ? "Fechar rota" : "Planejar rota"}
            aria-pressed={isRoutePanelOpen}
            className={`flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors ${
              isRoutePanelOpen
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <circle cx="6" cy="7" r="2.25" />
              <circle cx="18" cy="17" r="2.25" />
              <path d="M8 8.5 L16 15.5" strokeDasharray="2.8 2.8" />
            </svg>
          </button>

          {isHistoryOpen && (
            <SearchHistory
              history={history}
              onSelect={handleSelectHistory}
              onRemove={handleRemoveHistoryItem}
              onClear={handleClearHistory}
            />
          )}
        </form>

        {isRoutePanelOpen && (
          <RoutePanel
            stops={routeStops}
            routeInfo={routeInfo}
            isRouteLoading={isRouteLoading}
            onAddStop={handleAddRouteStop}
            onRemoveStop={handleRemoveRouteStop}
            onMoveStop={handleMoveRouteStop}
            onClear={handleClearRoute}
          />
        )}
      </div>

      {/* Desktop (xl+): painel direito com clima e previsão */}
      {showPanel && (
        <div className="fixed top-24 right-4 bottom-4 z-[1100] hidden w-80 overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm xl:block dark:bg-zinc-900/95">
          <StatusMessage isLoading={isLoading} error={error} />

          {!isLoading && !error && location && weather && risk && (
            <>
              <WeatherCard location={location} weather={weather} risk={risk} />
              {summaryData && (
                <AiSummary key={summaryKey} data={summaryData} />
              )}
              <HourlyForecastList hourly={weather.hourly} />
            </>
          )}
        </div>
      )}

      {/* Desktop (xl+): painel esquerdo com alertas, só quando existem */}
      {!isLoading && !error && alertsResult.alerts.length > 0 && (
        <div className="fixed top-24 left-4 bottom-4 z-[1100] hidden w-80 overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm xl:block dark:bg-zinc-900/95">
          <AlertsList
            alerts={alertsResult.alerts}
            mesoregion={alertsResult.mesoregion}
          />
        </div>
      )}

      {/* Celular/tablet (abaixo de xl): gaveta arrastável na parte de baixo */}
      {showPanel && (
        <div
          className={`fixed inset-x-0 bottom-0 z-[1100] overflow-hidden rounded-t-2xl bg-white/95 shadow-2xl backdrop-blur-sm transition-[max-height] duration-300 ease-out xl:hidden dark:bg-zinc-900/95 ${
            isSheetExpanded ? "max-h-[70vh]" : "max-h-16"
          }`}
        >
          <div
            onPointerDown={handleSheetPointerDown}
            onPointerUp={handleSheetPointerUp}
            className="flex touch-none cursor-grab flex-col items-center justify-center gap-1 py-2 active:cursor-grabbing"
          >
            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            {!isSheetExpanded && !isLoading && !error && location && weather && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {location.name} — {Math.round(weather.temperature)}°C
                (arraste para cima)
              </span>
            )}
          </div>

          <div className="max-h-[calc(70vh-3.5rem)] overflow-y-auto px-4 pb-4">
            <StatusMessage isLoading={isLoading} error={error} />

            {!isLoading && !error && location && weather && risk && (
              <>
                <WeatherCard location={location} weather={weather} risk={risk} />
                {summaryData && (
                  <AiSummary key={summaryKey} data={summaryData} />
                )}
                <HourlyForecastList hourly={weather.hourly} />
                <AlertsList
                  alerts={alertsResult.alerts}
                  mesoregion={alertsResult.mesoregion}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
