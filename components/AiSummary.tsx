"use client";

import { getSummary } from "@/services/summary";
import { useSummaryGeneration } from "@/lib/useSummaryGeneration";
import type { CityReport } from "@/types/weather";

type AiSummaryProps = {
  report: CityReport;
  summary: string | null;
  onSummary: (summary: string) => void;
};

// O texto gerado fica guardado na página (por cidade), e não aqui: assim ele
// não se perde ao trocar de aba entre as paradas da rota e voltar.
export default function AiSummary({
  report,
  summary,
  onSummary,
}: AiSummaryProps) {
  const { isLoading, error, run } = useSummaryGeneration(
    () => getSummary([report]),
    onSummary
  );

  return (
    <div className="mt-4 w-full rounded-2xl bg-white p-4 text-left shadow-md dark:bg-zinc-900">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Resumo com IA
      </p>

      {summary ? (
        <>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            {summary}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Gerado por IA a partir dos dados acima. Pode conter imprecisões e
            não substitui alertas oficiais.
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={run}
          disabled={isLoading}
          className="mt-2 w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isLoading ? "Gerando resumo..." : "Gerar resumo"}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
