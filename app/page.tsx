"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { describeFetchError } from "@/lib/http";
import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeFromSearchHistory,
} from "@/lib/searchHistory";
import { useRoutePlanner } from "@/lib/useRoutePlanner";
import { lookupSaoPauloCity } from "@/services/geocoding";
import { getCityData } from "@/services/weather";
import type { Location } from "@/types/location";
import type { CityData, CityReport } from "@/types/weather";
import AiSummary from "@/components/AiSummary";
import AlertsList from "@/components/AlertsList";
import BottomSheet from "@/components/BottomSheet";
import HourlyForecastList from "@/components/HourlyForecastList";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import ResizablePanel from "@/components/ResizablePanel";
import RoutePanel from "@/components/RoutePanel";
import RouteStopTabs from "@/components/RouteStopTabs";
import RouteSummary from "@/components/RouteSummary";
import SearchBar from "@/components/SearchBar";
import StatusMessage from "@/components/StatusMessage";
import WeatherCard from "@/components/WeatherCard";

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      Carregando mapa...
    </div>
  ),
});

// Referência fixa para "sem rota": um [] novo a cada render faria o mapa
// reposicionar a câmera toda vez que a página atualizasse.
const NO_STOPS: Location[] = [];

export default function Home() {
  // Cidade da busca principal e os dados dela.
  const [location, setLocation] = useState<Location | null>(null);
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Location[]>(() => getSearchHistory());
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  // A rota ativa (mapa, abas e manchas de cada parada) e o painel flutuante
  // de edição são independentes: fechar o painel só o esconde, a rota
  // continua na tela. Quem sai da rota é uma busca nova (ou limpar a rota).
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
  // Resumos com IA já gerados. A chave inclui o horário dos dados, então um
  // resumo antigo não aparece para dados novos.
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const isFetchingRef = useRef(false);
  const route = useRoutePlanner();

  // Busca por nome ou, quando vem do histórico, usa a localização já
  // conhecida e pula direto para o clima.
  async function runSearch(cityName: string, known?: Location) {
    if (isFetchingRef.current || !cityName.trim()) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsSheetExpanded(true);
    // Uma busca nova sai do modo rota para mostrar a cidade pesquisada. A
    // rota continua guardada e volta ao reabrir o painel.
    setIsRouteActive(false);
    setIsRoutePanelOpen(false);
    // Tira os dados da cidade anterior já no início: assim o mapa não pinta
    // nem enquadra a mancha antiga enquanto a nova busca carrega.
    setCityData(null);
    try {
      const lookup = known
        ? { ok: true as const, location: known }
        : await lookupSaoPauloCity(cityName);
      if (!lookup.ok) {
        setLocation(null);
        setError(lookup.error);
        return;
      }

      setLocation(lookup.location);
      setCityData(await getCityData(lookup.location));
      setHistory(addToSearchHistory(lookup.location));
    } catch (caughtError) {
      console.error("Falha ao buscar dados meteorológicos:", caughtError);
      setLocation(null);
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

  const searched: CityReport | null =
    location && cityData ? { location, ...cityData } : null;

  function handleToggleRoutePanel() {
    const isOpening = !isRoutePanelOpen;
    setIsRoutePanelOpen(isOpening);
    if (!isOpening) return;

    // Abrir o painel (re)ativa a rota. Na primeira vez, ela começa pela
    // cidade já pesquisada, aproveitando os dados que já estão na tela.
    setIsRouteActive(true);
    if (route.stops.length === 0 && searched) route.startWith(searched);
  }

  function saveSummary(key: string, text: string) {
    setSummaries((prev) => ({ ...prev, [key]: text }));
  }

  // No modo rota, o painel mostra a parada escolhida nas abas; fora dele, a
  // cidade da busca principal.
  const isRouteMode = isRouteActive && route.stops.length > 0;
  const selectedStop = isRouteMode ? route.selectedStop : null;
  const selectedState = selectedStop
    ? route.stopData[selectedStop.name]
    : undefined;

  const panelLoading = selectedStop
    ? !selectedState || selectedState.status === "loading"
    : isLoading;
  const panelError = selectedStop
    ? selectedState?.status === "error"
      ? "Não foi possível obter os dados meteorológicos desta cidade."
      : null
    : error;
  const shown: CityReport | null = selectedStop
    ? selectedState?.status === "ready"
      ? { location: selectedStop, ...selectedState.data }
      : null
    : searched;

  const showPanel = isRouteMode || isLoading || error !== null || shown !== null;
  const showAlerts =
    shown !== null &&
    (shown.alertsResult.alerts.length > 0 || shown.alertsResult.unavailable);
  const summaryKey = shown
    ? `${shown.location.name}@${shown.weather.hourly[0]?.time ?? ""}`
    : "";

  const stopTabs = selectedStop && (
    <RouteStopTabs
      stops={route.stops}
      stopData={route.stopData}
      selectedName={selectedStop.name}
      onSelect={route.selectStop}
    />
  );

  function renderDetails(includeAlerts: boolean) {
    return (
      <>
        <StatusMessage isLoading={panelLoading} error={panelError} />
        {selectedStop && panelError && (
          <button
            type="button"
            onClick={() => route.loadStopData(selectedStop)}
            className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Tentar novamente
          </button>
        )}

        {shown && (
          <>
            <WeatherCard location={shown.location} weather={shown.weather} />
            <AiSummary
              key={summaryKey}
              report={shown}
              summary={summaries[summaryKey] ?? null}
              onSummary={(text) => saveSummary(summaryKey, text)}
            />
            <HourlyForecastList hourly={shown.weather.hourly} />
            {includeAlerts && showAlerts && (
              <div className="mt-8">
                <AlertsList
                  alertsResult={shown.alertsResult}
                  cityName={shown.location.name}
                />
              </div>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapErrorBoundary>
          <CityMap
            location={location}
            weather={cityData?.weather ?? null}
            routeStops={isRouteMode ? route.stops : NO_STOPS}
            routeInfo={isRouteMode ? route.routeInfo : null}
            stopData={route.stopData}
            selectedStopName={selectedStop?.name ?? null}
            onSelectStop={route.selectStop}
          />
        </MapErrorBoundary>
      </div>

      <div
        data-map-overlay="top"
        className="absolute top-4 left-4 right-4 z-[1100] mx-auto max-w-md"
      >
        <SearchBar
          isLoading={isLoading}
          history={history}
          onSearch={(cityName) => runSearch(cityName)}
          onSelectHistory={(item) => runSearch(item.name, item)}
          onRemoveHistory={(name) => setHistory(removeFromSearchHistory(name))}
          onClearHistory={() => setHistory(clearSearchHistory())}
          routeState={
            isRoutePanelOpen ? "open" : isRouteMode ? "active" : "off"
          }
          onToggleRoute={handleToggleRoutePanel}
        />

        {isRoutePanelOpen && (
          <RoutePanel
            stops={route.stops}
            routeInfo={route.routeInfo}
            isRouteLoading={route.isRouteLoading}
            onAddStop={route.addStop}
            onRemoveStop={route.removeStop}
            onMoveStop={route.moveStop}
            onClear={route.clear}
          >
            {route.stops.length >= 2 && (
              <RouteSummary
                key={route.summary.key}
                stops={route.summary.stops}
                hint={route.summary.hint}
                summary={summaries[route.summary.key] ?? null}
                onSummary={(text) => saveSummary(route.summary.key, text)}
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
              {renderDetails(false)}
            </div>
          </div>
        </ResizablePanel>
      )}

      {/* Desktop (xl+): painel esquerdo com alertas, só quando existem (ou
          quando não deu para consultá-los), também com largura ajustável */}
      {showAlerts && (
        <ResizablePanel side="left" className="left-4 z-[1100] hidden xl:block">
          <div className="h-full overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/95">
            <AlertsList
              alertsResult={shown.alertsResult}
              cityName={shown.location.name}
            />
          </div>
        </ResizablePanel>
      )}

      {/* Celular/tablet (abaixo de xl): gaveta arrastável na parte de baixo */}
      {showPanel && (
        <BottomSheet
          isExpanded={isSheetExpanded}
          onExpandedChange={setIsSheetExpanded}
          collapsedLabel={
            shown
              ? `${shown.location.name} — ${Math.round(shown.weather.temperature)}°C`
              : null
          }
          header={stopTabs}
        >
          {renderDetails(true)}
        </BottomSheet>
      )}
    </div>
  );
}
