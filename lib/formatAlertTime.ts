export function parseAlertDate(rawDate: string): Date {
  const isoString = `${rawDate.replace(" ", "T").replace(/\.\d+$/, "")}Z`;
  return new Date(isoString);
}

export function formatAlertTime(rawDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseAlertDate(rawDate));
}

export function hasAlertStarted(startsAt: string): boolean {
  return Date.now() >= parseAlertDate(startsAt).getTime();
}
