import { classifyRisk, RISK_COLORS } from "@/lib/riskClassification";
import type { Location } from "@/types/location";
import type { StopDataState } from "@/types/route";

type RouteStopTabsProps = {
  stops: Location[];
  stopData: Record<string, StopDataState>;
  selectedName: string;
  onSelect: (name: string) => void;
};

// Uma aba por parada da rota: alterna entre as cidades sem empilhar tudo
// na tela. A temperatura e o ponto colorido (nível de risco) já dão uma
// visão geral de todas as paradas antes de abrir cada uma.
export default function RouteStopTabs({
  stops,
  stopData,
  selectedName,
  onSelect,
}: RouteStopTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Paradas da rota"
      className="flex flex-wrap gap-2"
    >
      {stops.map((stop, index) => {
        const state = stopData[stop.name];
        const isSelected = stop.name === selectedName;
        const risk =
          state?.status === "ready" ? classifyRisk(state.data.weather) : null;

        return (
          <button
            key={stop.name}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(stop.name)}
            title={risk ? `${stop.name}: ${risk.label}` : stop.name}
            className={`flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isSelected
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            <span className="opacity-60">{index + 1}</span>
            <span className="truncate">{stop.name}</span>
            {state?.status === "ready" && risk ? (
              <>
                <span>{Math.round(state.data.weather.temperature)}°</span>
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: RISK_COLORS[risk.level] }}
                />
              </>
            ) : state?.status === "error" ? (
              <span className="font-bold text-red-500">!</span>
            ) : (
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-zinc-400"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
