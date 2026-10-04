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

export type CityData = {
  weather: Weather;
  alertsResult: AlertsResult;
};

export type CityReport = CityData & { location: Location };
