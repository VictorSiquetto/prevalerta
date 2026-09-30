import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import type { RiskClassification, RiskLevel } from "@/lib/riskClassification";
import { formatNumber } from "@/lib/format";

type WeatherCardProps = {
  location: Location;
  weather: Weather;
  risk: RiskClassification;
};

const riskStyles: Record<RiskLevel, string> = {
  normal:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  atencao:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  risco_elevado:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  critico: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function WeatherCard({
  location,
  weather,
  risk,
}: WeatherCardProps) {
  return (
    <div className="w-full rounded-2xl bg-white p-6 text-left shadow-md dark:bg-zinc-900">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {location.name} - {location.state}
      </p>

      <p className="mt-2 text-5xl font-bold text-zinc-900 dark:text-zinc-50">
        {Math.round(weather.temperature)}°C
      </p>

      <div className="mt-6 space-y-2 text-sm">
        <Row label="Umidade" value={`${formatNumber(weather.humidity)}%`} />
        <Row
          label="Chuva"
          value={`${formatNumber(weather.precipitation)} mm`}
        />
        <Row
          label="Probabilidade de chuva"
          value={`${formatNumber(weather.precipitationProbability)}%`}
        />
        <Row label="Vento" value={`${formatNumber(weather.windSpeed)} km/h`} />
        <Row
          label="Rajadas"
          value={`${formatNumber(weather.windGusts)} km/h`}
        />
      </div>

      <div
        className={`mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${riskStyles[risk.level]}`}
      >
        <span>{risk.emoji}</span>
        <span>{risk.label}</span>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Calculado só com os dados do clima local, sem considerar os alertas do
        INMET. Não substitui os alertas oficiais da Defesa Civil.
      </p>
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
