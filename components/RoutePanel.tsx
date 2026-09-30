"use client";

import { useState } from "react";
import type { Location } from "@/types/location";
import type { RouteInfo } from "@/types/route";
import { formatNumber } from "@/lib/format";

type AddStopResult = { ok: true } | { ok: false; error: string };

type RoutePanelProps = {
  stops: Location[];
  routeInfo: RouteInfo | null;
  isRouteLoading: boolean;
  onAddStop: (cityName: string) => Promise<AddStopResult>;
  onRemoveStop: (index: number) => void;
  onMoveStop: (index: number, direction: -1 | 1) => void;
  onClear: () => void;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export default function RoutePanel({
  stops,
  routeInfo,
  isRouteLoading,
  onAddStop,
  onRemoveStop,
  onMoveStop,
  onClear,
}: RoutePanelProps) {
  const [cityName, setCityName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cityName.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    const result = await onAddStop(cityName);
    if (result.ok) {
      setCityName("");
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="mt-2 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Rota ({stops.length} {stops.length === 1 ? "parada" : "paradas"})
        </p>
        {stops.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Limpar rota
          </button>
        )}
      </div>

      {stops.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Adicione as cidades da viagem para traçar o trajeto e ver o clima
          de cada parada.
        </p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {stops.map((stop, index) => (
            <li
              key={`${stop.name}-${index}`}
              className="flex items-center gap-1"
            >
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                {index + 1}
              </span>
              <span className="flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                {stop.name} - {stop.state}
              </span>
              <button
                type="button"
                onClick={() => onMoveStop(index, -1)}
                disabled={index === 0}
                aria-label={`Mover ${stop.name} para cima`}
                className="rounded px-1 text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-200"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveStop(index, 1)}
                disabled={index === stops.length - 1}
                aria-label={`Mover ${stop.name} para baixo`}
                className="rounded px-1 text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-500 dark:hover:text-zinc-200"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onRemoveStop(index)}
                aria-label={`Remover ${stop.name} da rota`}
                className="rounded px-1 text-sm text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {stops.length >= 2 && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {isRouteLoading
            ? "Calculando rota pelas estradas..."
            : routeInfo
              ? `~${formatNumber(routeInfo.distanceKm)} km, ${formatDuration(routeInfo.durationMin)} de carro (estimativa)`
              : "Não foi possível calcular a rota pelas estradas — mostrando linha reta."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={cityName}
          onChange={(event) => setCityName(event.target.value)}
          placeholder="Adicionar parada..."
          aria-label="Adicionar cidade à rota"
          enterKeyHint="done"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <span aria-hidden>{isLoading ? "..." : "+"}</span>
          <span className="sr-only">
            {isLoading ? "Adicionando parada" : "Adicionar parada"}
          </span>
        </button>
      </form>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
