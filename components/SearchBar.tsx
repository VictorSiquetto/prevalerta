"use client";

import { useState } from "react";
import SearchHistory from "@/components/SearchHistory";
import type { Location } from "@/types/location";

export type RouteButtonState = "open" | "active" | "off";

type SearchBarProps = {
  isLoading: boolean;
  history: Location[];
  onSearch: (cityName: string) => void;
  onSelectHistory: (item: Location) => void;
  onRemoveHistory: (name: string) => void;
  onClearHistory: () => void;
  routeState: RouteButtonState;
  onToggleRoute: () => void;
};

const ROUTE_BUTTON: Record<RouteButtonState, { label: string; style: string }> =
  {
    open: {
      label: "Esconder painel da rota",
      style: "bg-blue-600 text-white hover:bg-blue-500",
    },
    active: {
      label: "Editar rota",
      style:
        "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900",
    },
    off: {
      label: "Planejar rota",
      style:
        "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
    },
  };

export default function SearchBar({
  isLoading,
  history,
  onSearch,
  onSelectHistory,
  onRemoveHistory,
  onClearHistory,
  routeState,
  onToggleRoute,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const routeButton = ROUTE_BUTTON[routeState];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setIsHistoryOpen(false);
        onSearch(value);
      }}
      className="relative flex gap-2 rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95"
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
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
        onClick={onToggleRoute}
        title={routeButton.label}
        aria-label={routeButton.label}
        aria-pressed={routeState === "open"}
        className={`flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors ${routeButton.style}`}
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
          onSelect={(item) => {
            setValue(item.name);
            setIsHistoryOpen(false);
            onSelectHistory(item);
          }}
          onRemove={onRemoveHistory}
          onClear={onClearHistory}
        />
      )}
    </form>
  );
}
