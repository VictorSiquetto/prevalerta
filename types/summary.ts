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
