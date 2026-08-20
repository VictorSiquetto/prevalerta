export type WeatherAlert = {
  id: string;
  event: string;
  severity: string;
  startsAt: string;
  endsAt: string;
  description: string;
  areas: string[];
  link: string;
};
