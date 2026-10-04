import { getMesoregion } from "@/services/mesoregion";
import { parseAlertDate } from "@/lib/formatAlertTime";
import { EXTERNAL_API_TIMEOUT_MS } from "@/lib/http";
import type { WeatherAlert } from "@/types/alert";

const INMET_FEED_URL = "https://apiprevmet3.inmet.gov.br/avisos/rss";

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : "";
}

function extractCData(xml: string): string {
  const match = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return match ? match[1] : "";
}

function extractTableValues(html: string): string[] {
  const matches = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
  return matches.map((match) => match[1].trim());
}

function parseAreas(rawArea: string): string[] {
  const withoutPrefix = rawArea.replace(/^Aviso para as [ÁA]reas:\s*/i, "");
  return withoutPrefix
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
}

function parseItem(item: string): { alert: WeatherAlert; areas: string[] } {
  const guid = extractTag(item, "guid");
  const values = extractTableValues(
    extractCData(extractTag(item, "description"))
  );
  const [, event, severity, startsAt, endsAt, description, rawArea] = values;

  const alertId = guid.split("/").pop() ?? "";

  return {
    areas: parseAreas(rawArea ?? ""),
    alert: {
      id: guid,
      event: event ?? "",
      severity: severity ?? "",
      startsAt: startsAt ?? "",
      endsAt: endsAt ?? "",
      description: description ?? "",
      link: `https://avisos.inmet.gov.br/${encodeURIComponent(alertId)}`,
    },
  };
}

function isActive({ startsAt, endsAt }: WeatherAlert): boolean {
  const start = parseAlertDate(startsAt).getTime();
  const end = parseAlertDate(endsAt).getTime();
  return !Number.isNaN(start) && !Number.isNaN(end) && end >= Date.now();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    const mesoregion = city ? await getMesoregion(city) : null;

    const response = await fetch(INMET_FEED_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`INMET respondeu com status ${response.status}`);
    }
    const xml = await response.text();

    const isInRegion = (areas: string[]) =>
      mesoregion
        ? areas.includes(mesoregion)
        : areas.some(
            (area) => area.includes("Paulista") || area.includes("São Paulo")
          );

    const alerts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((match) => parseItem(match[1]))
      .filter(({ alert, areas }) => isActive(alert) && isInRegion(areas))
      .map(({ alert }) => alert);

    return Response.json({ alerts, mesoregion, unavailable: false });
  } catch (error) {
    console.error("Falha ao buscar avisos do INMET:", error);
    return Response.json({ alerts: [], mesoregion: null, unavailable: true });
  }
}
