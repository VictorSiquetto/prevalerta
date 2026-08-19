import type { HourlyForecast } from "@/types/weather";
import { getWeatherIcon } from "@/lib/weatherCode";

type HourlyForecastListProps = {
  hourly: HourlyForecast[];
};

export default function HourlyForecastList({
  hourly,
}: HourlyForecastListProps) {
  return (
    <div className="mt-4 w-full">
      <p className="mb-2 text-left font-semibold text-zinc-900 dark:text-zinc-50">
        Próximas horas
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {hourly.map((hour) => (
          <div
            key={hour.time}
            className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900"
          >
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {hour.time.slice(11, 16)}
            </span>
            <span className="text-2xl">{getWeatherIcon(hour.weatherCode)}</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {Math.round(hour.temperature)}°C
            </span>
            <span className="text-xs text-sky-600 dark:text-sky-400">
              {hour.precipitationProbability}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
