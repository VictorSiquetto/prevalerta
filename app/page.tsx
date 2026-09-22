"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { searchCity } from "@/services/geocoding";
import { getWeather } from "@/services/weather";
import { getAlerts, type AlertsResult } from "@/services/alerts";
import { classifyRisk } from "@/lib/riskClassification";
import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import WeatherCard from "@/components/WeatherCard";
import HourlyForecastList from "@/components/HourlyForecastList";
import AlertsList from "@/components/AlertsList";
import StatusMessage from "@/components/StatusMessage";
import AiSummary from "@/components/AiSummary";

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
  const isFetchingRef = useRef(false);
  const dragStartY = useRef<number | null>(null);

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

  async function handleSearch() {
    if (isFetchingRef.current) return;

    if (!city.trim()) {
      setError("Digite o nome de uma cidade.");
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsSheetExpanded(true);
    try {
      const found = await searchCity(city);

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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="absolute inset-0 z-0">
        <CityMap
          location={location}
          temperature={weather?.temperature}
          riskLevel={risk?.level}
        />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="absolute top-4 left-4 right-4 z-[1100] mx-auto flex max-w-md gap-2 rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95"
      >
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
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
      </form>

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
