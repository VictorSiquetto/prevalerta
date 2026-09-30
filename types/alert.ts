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
  // true quando não foi possível consultar o INMET (a lista vazia, nesse
  // caso, não significa que não há alertas).
  unavailable: boolean;
};
