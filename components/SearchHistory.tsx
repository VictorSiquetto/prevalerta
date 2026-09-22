import type { Location } from "@/types/location";

type SearchHistoryProps = {
  history: Location[];
  onSelect: (item: Location) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
};

// onMouseDown + preventDefault evita que o campo de busca perca o foco
// antes do clique no item ser processado (senão a lista some antes do
// onClick disparar).
export default function SearchHistory({
  history,
  onSelect,
  onRemove,
  onClear,
}: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-full z-[1100] mt-2 rounded-xl bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Pesquisas recentes
        </span>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          className="text-xs text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Limpar histórico
        </button>
      </div>
      <ul>
        {history.map((item) => (
          <li key={item.name} className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
              className="flex-1 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {item.name} - {item.state}
            </button>
            <button
              type="button"
              aria-label={`Remover ${item.name} do histórico`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onRemove(item.name)}
              className="shrink-0 rounded-lg px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
