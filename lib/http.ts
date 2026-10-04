export const EXTERNAL_API_TIMEOUT_MS = 10_000;

export const CLIENT_TIMEOUT_MS = 20_000;

export const SUMMARY_CLIENT_TIMEOUT_MS = 40_000;

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

export function describeFetchError(error: unknown, fallback: string): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "Você está sem conexão com a internet. Verifique a rede e tente novamente.";
  }
  if (isTimeoutError(error)) {
    return "O serviço demorou demais para responder. Tente novamente em instantes.";
  }
  return fallback;
}
