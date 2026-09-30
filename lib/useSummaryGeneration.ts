import { useRef, useState } from "react";
import { describeFetchError } from "@/lib/http";
import { SummaryRequestError } from "@/services/summary";

// Estado de um pedido de resumo à IA (carregando/erro), com trava contra
// cliques repetidos. O texto gerado vai para `onSummary`: quem guarda é a
// página, para ele não se perder ao trocar de aba ou fechar painéis.
export function useSummaryGeneration(
  generate: () => Promise<string>,
  onSummary: (summary: string) => void
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRequestingRef = useRef(false);

  async function run() {
    if (isRequestingRef.current) return;

    isRequestingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      onSummary(await generate());
    } catch (caughtError) {
      console.error("Falha ao gerar resumo:", caughtError);
      setError(
        caughtError instanceof SummaryRequestError
          ? caughtError.message
          : describeFetchError(
              caughtError,
              "Não foi possível gerar o resumo agora. Tente novamente."
            )
      );
    } finally {
      isRequestingRef.current = false;
      setIsLoading(false);
    }
  }

  return { isLoading, error, run };
}
