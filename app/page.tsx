"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { searchCity } from "@/services/geocoding";
import { getWeather } from "@/services/weather";
import { getAlerts, type AlertsResult } from "@/services/alerts";
import { getRoute } from "@/services/routing";
import { classifyRisk } from "@/lib/riskClassification";
import { describeFetchError } from "@/lib/http";
import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
} from "@/lib/searchHistory";
import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import {
  MAX_ROUTE_STOPS,
  type CityData,
  type RouteInfo,
  type StopDataState,
} from "@/types/route";
import type { StopConditions } from "@/components/CityMap";
import {
  MAX_ROUTE_SUMMARY_STOPS,
  type RouteSummaryRequest,
  type SummaryRequest,
} from "@/types/summary";
import WeatherCard from "@/components/WeatherCard";
import HourlyForecastList from "@/components/HourlyForecastList";
import AlertsList from "@/components/AlertsList";
import StatusMessage from "@/components/StatusMessage";
import AiSummary from "@/components/AiSummary";
import SearchHistory from "@/components/SearchHistory";
import RoutePanel from "@/components/RoutePanel";
import RouteStopTabs from "@/components/RouteStopTabs";
import RouteSummary from "@/components/RouteSummary";
import ResizablePanel from "@/components/ResizablePanel";
import MapErrorBoundary from "@/components/MapErrorBoundary";

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      Carregando mapa...
    </div>
  ),
});

const NO_ALERTS: AlertsResult = {
  alerts: [],
  mesoregion: null,
  unavailable: false,
};

// Referência fixa para "sem rota": um [] novo a cada render faria o mapa
// reposicionar a câmera toda vez que a página atualizasse.
const NO_STOPS: Location[] = [];

function toSummaryRequest(location: Location, data: CityData): SummaryRequest {
  return {
    location,
    weather: data.weather,
    alerts: data.alertsResult.alerts,
    alertsUnavailable: data.alertsResult.unavailable,
    mesoregion: data.alertsResult.mesoregion,
  };
}

async function fetchCityData(found: Location): Promise<CityData> {
  const [weather, alertsResult] = await Promise.all([
    getWeather(found.latitude, found.longitude),
    getAlerts(found.name),
  ]);
  return { weather, alertsResult };
}

export default function Home() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [alertsResult, setAlertsResult] = useState<AlertsResult>(NO_ALERTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [history, setHistory] = useState<Location[]>(() => getSearchHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [routeStops, setRouteStops] = useState<Location[]>([]);
  // A rota ativa (mapa, abas e manchas de cada parada) e o painel flutuante
  // de edição são independentes: fechar o painel só o esconde, a rota
  // continua na tela. Quem sai da rota é uma busca nova (ou limpar a rota).
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
  const [routeResult, setRouteResult] = useState<{
    key: string;
    info: RouteInfo | null;
  } | null>(null);
  const [stopData, setStopData] = useState<Record<string, StopDataState>>({});
  const [selectedStopName, setSelectedStopName] = useState<string | null>(
    null
  );
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const isFetchingRef = useRef(false);
  // Número do último pedido de dados de cada parada: se a mesma cidade for
  // pedida de novo (removida e readicionada, "Tentar novamente"), só a
  // resposta mais recente vale — uma antiga que chegue depois é ignorada.
  const stopRequestIds = useRef<Record<string, number>>({});
  const dragStartY = useRef<number | null>(null);

  // Identifica a sequência atual de paradas. A rota calculada guarda a chave
  // de quando foi pedida: se as paradas mudaram desde então, ela está
  // desatualizada e não é mostrada (fica a linha reta até a nova chegar).
  const routeKey = routeStops
    .map((stop) => `${stop.latitude},${stop.longitude}`)
    .join(";");

  // Busca a rota real (seguindo estradas) sempre que a lista de paradas
  // muda. `cancelled` evita guardar uma resposta que chegou depois de as
  // paradas mudarem de novo.
  useEffect(() => {
    if (routeStops.length < 2) return;

    let cancelled = false;
    getRoute(routeStops).then((info) => {
      if (!cancelled) setRouteResult({ key: routeKey, info });
    });

    return () => {
      cancelled = true;
    };
  }, [routeStops, routeKey]);

  function handleSheetPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Captura o ponteiro: o soltar é recebido mesmo que o dedo saia da alça.
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
  }

  function handleSheetPointerCancel() {
    dragStartY.current = null;
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
    // Uma busca nova sai do modo rota para mostrar a cidade pesquisada. A
    // rota continua guardada e volta ao reabrir o painel.
    setIsRouteActive(false);
    setIsRoutePanelOpen(false);
    try {
      const found = options.known ?? (await searchCity(cityName));

      if (!found) {
        setLocation(null);
        setWeather(null);
        setAlertsResult(NO_ALERTS);
        setError(
          "Não conseguimos encontrar essa cidade. Verifique o nome e tente novamente."
        );
        return;
      }

      if (found.state !== "São Paulo") {
        setLocation(null);
        setWeather(null);
        setAlertsResult(NO_ALERTS);
        setError(
          "No momento, este aplicativo cobre apenas cidades do Estado de São Paulo."
        );
        return;
      }

      setLocation(found);

      const data = await fetchCityData(found);
      setWeather(data.weather);
      setAlertsResult(data.alertsResult);
      setHistory(addToSearchHistory(found));
    } catch (caughtError) {
      console.error("Falha ao buscar dados meteorológicos:", caughtError);
      setLocation(null);
      setWeather(null);
      setAlertsResult(NO_ALERTS);
      setError(
        describeFetchError(
          caughtError,
          "Não foi possível obter os dados meteorológicos. Tente novamente."
        )
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

  async function loadStopData(stop: Location) {
    const requestId = (stopRequestIds.current[stop.name] ?? 0) + 1;
    stopRequestIds.current[stop.name] = requestId;
    const isLatest = () => stopRequestIds.current[stop.name] === requestId;

    setStopData((prev) => ({ ...prev, [stop.name]: { status: "loading" } }));
    try {
      const data = await fetchCityData(stop);
      if (!isLatest()) return;
      setStopData((prev) => ({
        ...prev,
        [stop.name]: { status: "ready", data },
      }));
    } catch (caughtError) {
      console.error(`Falha ao buscar dados de ${stop.name}:`, caughtError);
      if (!isLatest()) return;
      setStopData((prev) => ({ ...prev, [stop.name]: { status: "error" } }));
    }
  }

  function handleToggleRoutePanel() {
    const isOpening = !isRoutePanelOpen;
    setIsRoutePanelOpen(isOpening);
    // Abrir o painel (re)ativa a rota; fechar não mexe nela.
    if (isOpening) setIsRouteActive(true);

    // Ao abrir pela primeira vez, começa a rota com a cidade já pesquisada,
    // aproveitando os dados que já estão na tela.
    if (isOpening && routeStops.length === 0 && location && weather) {
      setRouteStops([location]);
      setSelectedStopName(location.name);
      setStopData((prev) => ({
        ...prev,
        [location.name]: {
          status: "ready",
          data: { weather, alertsResult },
        },
      }));
    }
  }

  async function handleAddRouteStop(
    cityName: string
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    if (routeStops.length >= MAX_ROUTE_STOPS) {
      return {
        ok: false,
        error: `A rota aceita até ${MAX_ROUTE_STOPS} paradas.`,
      };
    }

    let found: Location | null;
    try {
      found = await searchCity(cityName);
    } catch (caughtError) {
      console.error("Falha ao buscar cidade da rota:", caughtError);
      return {
        ok: false,
        error: describeFetchError(
          caughtError,
          "Não foi possível buscar essa cidade agora. Tente novamente."
        ),
      };
    }

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
    // Abre direto a aba da cidade recém-adicionada.
    setSelectedStopName(found.name);
    loadStopData(found);
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
    setSelectedStopName(null);
  }

  const hasRouteLine = routeStops.length >= 2;
  const routeInfo =
    hasRouteLine && routeResult?.key === routeKey ? routeResult.info : null;
  const isRouteLoading = hasRouteLine && routeResult?.key !== routeKey;

  // Modo rota: o painel mostra a parada escolhida nas abas. Fora dele,
  // mostra a cidade pesquisada na busca principal.
  const isRouteMode = isRouteActive && routeStops.length > 0;
  const routeButtonLabel = isRoutePanelOpen
    ? "Esconder painel da rota"
    : isRouteMode
      ? "Editar rota"
      : "Planejar rota";
  const selectedStop = isRouteMode
    ? (routeStops.find((stop) => stop.name === selectedStopName) ??
      routeStops[0])
    : null;
  const selectedStopState = selectedStop
    ? stopData[selectedStop.name]
    : undefined;

  const panelLoading = selectedStop
    ? !selectedStopState || selectedStopState.status === "loading"
    : isLoading;
  const panelError = selectedStop
    ? selectedStopState?.status === "error"
      ? "Não foi possível obter os dados meteorológicos desta cidade."
      : null
    : error;
  const shown: (CityData & { location: Location }) | null = selectedStop
    ? selectedStopState?.status === "ready"
      ? { location: selectedStop, ...selectedStopState.data }
      : null
    : location && weather
      ? { location, weather, alertsResult }
      : null;
  const showDetails = !panelLoading && !panelError && shown;

  const showPanel = isRouteMode || isLoading || error || shown;
  const risk = shown ? classifyRisk(shown.weather) : null;
  const searchedRisk = weather ? classifyRisk(weather) : null;
  // Uma busca nova gera uma chave nova, o que zera o resumo anterior.
  const summaryKey = shown
    ? `${shown.location.name}-${shown.weather.hourly[0]?.time}`
    : "";

  const stopConditions: Record<string, StopConditions> = {};
  for (const [name, state] of Object.entries(stopData)) {
    if (state.status === "ready") {
      stopConditions[name] = {
        temperature: state.data.weather.temperature,
        riskLevel: classifyRisk(state.data.weather).level,
      };
    }
  }

  // Resumo da rota: só com todas as paradas carregadas. A chave muda se as
  // paradas, a ordem ou os dados mudarem — aí o resumo antigo deixa de valer.
  const readyStops = routeStops.map((stop) => {
    const state = stopData[stop.name];
    return state?.status === "ready" ? state.data : null;
  });
  const hasStopError = routeStops.some(
    (stop) => stopData[stop.name]?.status === "error"
  );
  const areAllStopsReady = readyStops.every((data) => data !== null);
  const hasTooManyStops = routeStops.length > MAX_ROUTE_SUMMARY_STOPS;
  const routeSummaryData: RouteSummaryRequest | null =
    routeStops.length >= 2 && areAllStopsReady && !hasTooManyStops
      ? {
          stops: routeStops.map((stop, index) =>
            toSummaryRequest(stop, readyStops[index] as CityData)
          ),
        }
      : null;
  const routeSummaryHint = hasTooManyStops
    ? `O resumo da rota aceita até ${MAX_ROUTE_SUMMARY_STOPS} paradas.`
    : hasStopError
      ? "Não foi possível carregar os dados de todas as paradas. Tente de novo na aba da cidade com erro."
      : !areAllStopsReady
        ? "Carregando os dados das paradas..."
        : null;
  const routeSummaryKey = `rota:${routeStops
    .map(
      (stop, index) =>
        `${stop.name}@${readyStops[index]?.weather.hourly[0]?.time ?? ""}`
    )
    .join("|")}`;

  const stopTabs = selectedStop && (
    <RouteStopTabs
      stops={routeStops}
      stopData={stopData}
      selectedName={selectedStop.name}
      onSelect={setSelectedStopName}
    />
  );

  function renderDetails({ includeAlerts }: { includeAlerts: boolean }) {
    return (
      <>
        <StatusMessage isLoading={panelLoading} error={panelError} />
        {selectedStop && panelError && (
          <button
            type="button"
            onClick={() => loadStopData(selectedStop)}
            className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Tentar novamente
          </button>
        )}

        {showDetails && risk && (
          <>
            <WeatherCard
              location={shown.location}
              weather={shown.weather}
              risk={risk}
            />
            <AiSummary
              key={summaryKey}
              data={toSummaryRequest(shown.location, shown)}
              summary={summaries[summaryKey] ?? null}
              onSummary={(text) =>
                setSummaries((prev) => ({ ...prev, [summaryKey]: text }))
              }
            />
            <HourlyForecastList hourly={shown.weather.hourly} />
            {includeAlerts &&
              (shown.alertsResult.alerts.length > 0 ||
                shown.alertsResult.unavailable) && (
              <div className="mt-8">
                <AlertsList
                  alerts={shown.alertsResult.alerts}
                  mesoregion={shown.alertsResult.mesoregion}
                  cityName={shown.location.name}
                  unavailable={shown.alertsResult.unavailable}
                />
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <div className="absolute inset-0 z-0">
        <MapErrorBoundary>
          <CityMap
            location={location}
            temperature={weather?.temperature}
            riskLevel={searchedRisk?.level}
            routeStops={isRouteMode ? routeStops : NO_STOPS}
            routeInfo={isRouteMode ? routeInfo : null}
            stopConditions={stopConditions}
            selectedStopName={selectedStop?.name ?? null}
            onSelectStop={setSelectedStopName}
          />
        </MapErrorBoundary>
      </div>

      <div
        data-map-overlay="top"
        className="absolute top-4 left-4 right-4 z-[1100] mx-auto max-w-md"
      >
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
            aria-label="Cidade do Estado de São Paulo"
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
            title={routeButtonLabel}
            aria-label={routeButtonLabel}
            aria-pressed={isRoutePanelOpen}
            className={`flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors ${
              isRoutePanelOpen
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : isRouteMode
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
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
          >
            {routeStops.length >= 2 && (
              <RouteSummary
                key={routeSummaryKey}
                data={routeSummaryData}
                hint={routeSummaryHint}
                summary={summaries[routeSummaryKey] ?? null}
                onSummary={(text) =>
                  setSummaries((prev) => ({
                    ...prev,
                    [routeSummaryKey]: text,
                  }))
                }
              />
            )}
          </RoutePanel>
        )}
      </div>

      {/* Desktop (xl+): painel direito com clima e previsão, com largura
          ajustável. No modo rota, as abas ficam fixas no topo e só o
          conteúdo rola. */}
      {showPanel && (
        <ResizablePanel side="right" className="right-4 z-[1100] hidden xl:block">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/95">
            {stopTabs && (
              <div className="shrink-0 border-b border-zinc-200 p-3 dark:border-zinc-800">
                {stopTabs}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {renderDetails({ includeAlerts: false })}
            </div>
          </div>
        </ResizablePanel>
      )}

      {/* Desktop (xl+): painel esquerdo com alertas, só quando existem (ou
          quando não deu para consultá-los), também com largura ajustável */}
      {showDetails &&
        (shown.alertsResult.alerts.length > 0 ||
          shown.alertsResult.unavailable) && (
        <ResizablePanel side="left" className="left-4 z-[1100] hidden xl:block">
          <div className="h-full overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/95">
            <AlertsList
              alerts={shown.alertsResult.alerts}
              mesoregion={shown.alertsResult.mesoregion}
              cityName={shown.location.name}
              unavailable={shown.alertsResult.unavailable}
            />
          </div>
        </ResizablePanel>
      )}

      {/* Celular/tablet (abaixo de xl): gaveta arrastável na parte de baixo */}
      {showPanel && (
        <div
          data-map-overlay="bottom"
          className={`fixed inset-x-0 bottom-0 z-[1100] flex flex-col overflow-hidden rounded-t-2xl bg-white/95 shadow-2xl backdrop-blur-sm transition-[max-height] duration-300 ease-out xl:hidden dark:bg-zinc-900/95 ${
            isSheetExpanded ? "max-h-[70dvh]" : "max-h-16"
          }`}
        >
          <div
            onPointerDown={handleSheetPointerDown}
            onPointerUp={handleSheetPointerUp}
            onPointerCancel={handleSheetPointerCancel}
            className="flex shrink-0 touch-none cursor-grab flex-col items-center justify-center gap-1 py-2 active:cursor-grabbing"
          >
            <div className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            {!isSheetExpanded && showDetails && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {shown.location.name} — {Math.round(shown.weather.temperature)}
                °C (arraste para cima)
              </span>
            )}
          </div>

          {stopTabs && isSheetExpanded && (
            <div className="shrink-0 px-4 pb-3">{stopTabs}</div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {renderDetails({ includeAlerts: true })}
          </div>
        </div>
      )}
    </div>
  );
}
