"use client";

import { catchError, type ErrorInfo } from "next/error";

// Isola o mapa: se o Leaflet (ou o carregamento do mapa) falhar, só a área
// do mapa mostra o aviso — a busca e os painéis de clima continuam
// funcionando normalmente.
function MapErrorFallback(_props: object, { error, reset }: ErrorInfo) {
  console.error("Falha ao exibir o mapa:", error);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-100 px-6 text-center dark:bg-zinc-900">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Não foi possível exibir o mapa. As informações de clima continuam
        disponíveis nos painéis.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Recarregar mapa
      </button>
    </div>
  );
}

export default catchError(MapErrorFallback);
