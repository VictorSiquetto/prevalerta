import type { AlertsResult } from "@/types/alert";
import type { Location } from "@/types/location";

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
};

export type Weather = {
  temperature: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windGusts: number;
  weatherCode: number;
  hourly: HourlyForecast[];
};

// Clima e alertas oficiais de uma cidade.
export type CityData = {
  weather: Weather;
  alertsResult: AlertsResult;
};

// Uma cidade com os seus dados: o que o painel mostra e o que vai para o
// resumo com IA.
export type CityReport = CityData & { location: Location };
