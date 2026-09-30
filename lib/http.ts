// Tempo máximo de espera pelos serviços externos (Open-Meteo, INMET, IBGE,
// OSRM) nas rotas da API. Sem isso, um serviço travado deixaria a busca
// "carregando" para sempre.
export const EXTERNAL_API_TIMEOUT_MS = 10_000;

// Tempo máximo do navegador esperando as rotas da própria API. Um pouco
// acima do limite delas, para o erro do servidor chegar antes.
export const CLIENT_TIMEOUT_MS = 20_000;

// O resumo com IA pode levar mais (a rota tem limite de 30 s no servidor).
export const SUMMARY_CLIENT_TIMEOUT_MS = 40_000;

export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

// Mensagem para o usuário a partir de um erro de rede: diferencia "sem
// internet" e "demorou demais" do erro genérico de cada tela.
export function describeFetchError(error: unknown, fallback: string): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "Você está sem conexão com a internet. Verifique a rede e tente novamente.";
  }
  if (isTimeoutError(error)) {
    return "O serviço demorou demais para responder. Tente novamente em instantes.";
  }
  return fallback;
}
