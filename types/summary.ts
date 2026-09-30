import type { CityReport } from "@/types/weather";

// Uma cidade (resumo da cidade) ou várias, na ordem da viagem (resumo da
// rota): a mesma rota da API atende os dois casos.
export type SummaryRequest = {
  stops: CityReport[];
};

// Limite de cidades num resumo: mantém o texto enviado à IA (e a resposta)
// num tamanho razoável.
export const MAX_SUMMARY_STOPS = 10;
