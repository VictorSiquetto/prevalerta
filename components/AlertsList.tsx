import type { WeatherAlert } from "@/types/alert";
import { formatAlertTime, hasAlertStarted } from "@/lib/formatAlertTime";

type AlertsListProps = {
  alerts: WeatherAlert[];
  mesoregion: string | null;
  cityName: string;
  unavailable: boolean;
};

const severityStyles: Record<string, string> = {
  "Perigo Potencial":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  Perigo: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  "Grande Perigo": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function AlertsList({
  alerts,
  mesoregion,
  cityName,
  unavailable,
}: AlertsListProps) {
  if (unavailable) {
    return (
      <div className="w-full text-left">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          Alertas oficiais do INMET
        </p>
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Não foi possível consultar os alertas do INMET agora. Confira
          diretamente em{" "}
          <a
            href="https://portal.inmet.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            portal.inmet.gov.br
          </a>
          .
        </p>
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="w-full text-left">
      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
        Alertas oficiais do INMET
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {mesoregion
          ? `Para a região de "${mesoregion}", onde fica ${cityName}.`
          : "Cobrem regiões do Estado de São Paulo — pode não ser específico da sua cidade."}
      </p>

      <div className="mt-3 space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900"
          >
            <span
              className={`inline-block rounded-md px-2 py-1 text-xs font-semibold ${
                severityStyles[alert.severity] ??
                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {alert.event} — {alert.severity}
            </span>
            <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {hasAlertStarted(alert.startsAt) ? (
                <>🔴 Em vigor agora — até {formatAlertTime(alert.endsAt)}</>
              ) : (
                <>
                  ⏳ Ainda não começou — a partir de{" "}
                  {formatAlertTime(alert.startsAt)}
                </>
              )}
            </p>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {alert.description}
            </p>
            <a
              href={alert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-sky-600 underline dark:text-sky-400"
            >
              Ver detalhes oficiais no INMET
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
