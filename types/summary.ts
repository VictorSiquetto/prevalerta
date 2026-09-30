import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import type { WeatherAlert } from "@/types/alert";

export type SummaryRequest = {
  location: Location;
  weather: Weather;
  alerts: WeatherAlert[];
  alertsUnavailable: boolean;
  mesoregion: string | null;
};

// Paradas na ordem da rota, cada uma com os mesmos dados do resumo de uma
// cidade.
export type RouteSummaryRequest = {
  stops: SummaryRequest[];
};

// Limite de paradas no resumo da rota: mantém o texto enviado à IA (e a
// resposta) num tamanho razoável.
export const MAX_ROUTE_SUMMARY_STOPS = 10;
