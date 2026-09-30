"use client";

import { getRouteSummary } from "@/services/summary";
import { useSummaryGeneration } from "@/lib/useSummaryGeneration";
import type { RouteSummaryRequest } from "@/types/summary";

type RouteSummaryProps = {
  // null enquanto não dá para resumir (paradas carregando, com erro, etc.);
  // nesse caso `hint` explica o motivo.
  data: RouteSummaryRequest | null;
  hint: string | null;
  summary: string | null;
  onSummary: (summary: string) => void;
};

// Resumo com IA de todas as paradas de uma vez, dentro do painel de rota.
export default function RouteSummary({
  data,
  hint,
  summary,
  onSummary,
}: RouteSummaryProps) {
  const { isLoading, error, run } = useSummaryGeneration(async () => {
    if (!data) throw new Error("Dados da rota incompletos.");
    return getRouteSummary(data);
  }, onSummary);

  return (
    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      {summary ? (
        <>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Resumo da rota
          </p>
          <p className="mt-1 max-h-48 overflow-y-auto text-sm text-zinc-700 dark:text-zinc-300">
            {summary}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Gerado por IA com o clima atual de cada cidade, não o da hora em
            que você passar. Não substitui alertas oficiais.
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={run}
            disabled={!data || isLoading}
            className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Resumindo a rota..." : "Resumir rota com IA"}
          </button>
          {hint && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {hint}
            </p>
          )}
        </>
      )}

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
