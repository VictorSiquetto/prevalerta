export type WeatherAlert = {
  id: string;
  event: string;
  severity: string;
  startsAt: string;
  endsAt: string;
  description: string;
  link: string;
};

export type AlertsResult = {
  alerts: WeatherAlert[];
  mesoregion: string | null;
  unavailable: boolean;
};
