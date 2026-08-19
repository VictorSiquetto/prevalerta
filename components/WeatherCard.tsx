import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";

type WeatherCardProps = {
  location: Location;
  weather: Weather;
};

export default function WeatherCard({ location, weather }: WeatherCardProps) {
  return (
    <div className="mt-8 w-full rounded-2xl bg-white p-6 text-left shadow-md dark:bg-zinc-900">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {location.name} - {location.state}
      </p>

      <p className="mt-2 text-5xl font-bold text-zinc-900 dark:text-zinc-50">
        {Math.round(weather.temperature)}°C
      </p>

      <div className="mt-6 space-y-2 text-sm">
        <Row label="Umidade" value={`${weather.humidity}%`} />
        <Row label="Chuva" value={`${weather.precipitation} mm`} />
        <Row
          label="Probabilidade de chuva"
          value={`${weather.precipitationProbability}%`}
        />
        <Row label="Vento" value={`${weather.windSpeed} km/h`} />
        <Row label="Rajadas" value={`${weather.windGusts} km/h`} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-zinc-100 py-1 text-zinc-700 last:border-0 dark:border-zinc-800 dark:text-zinc-300">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
