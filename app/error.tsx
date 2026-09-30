"use client";

import { useEffect } from "react";

// Tela de erro da página: aparece no lugar de uma tela em branco se algo
// inesperado quebrar a renderização.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro inesperado na página:", error);
  }, [error]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Algo deu errado
      </h1>
      <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
        Ocorreu um erro inesperado ao exibir o PreVAlerta. Tente novamente; se
        o problema continuar, recarregue a página.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
}
