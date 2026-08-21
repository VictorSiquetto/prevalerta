import { getMesoregion } from "@/services/mesoregion";
import { parseAlertDate } from "@/lib/formatAlertTime";

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

function isExpired(endsAt: string): boolean {
  return parseAlertDate(endsAt).getTime() < Date.now();
}

function parseAreas(rawArea: string): string[] {
  const withoutPrefix = rawArea.replace(/^Aviso para as [ÁA]reas:\s*/i, "");
  return withoutPrefix
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    const mesoregion = city ? await getMesoregion(city) : null;

    const response = await fetch(INMET_FEED_URL);
    const xml = await response.text();

    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
      (match) => match[1]
    );

    const alerts = items.map((item) => {
      const guid = extractTag(item, "guid");
      const descriptionHtml = extractCData(extractTag(item, "description"));
      const values = extractTableValues(descriptionHtml);

      const [, event, severity, startsAt, endsAt, description, rawArea] =
        values;

      // O guid termina em ".../rss/{id}" — usamos esse id para montar o
      // link da página visual do aviso (avisos.inmet.gov.br), em vez do
      // link técnico em XML puro.
      const alertId = guid.split("/").pop() ?? "";

      return {
        id: guid,
        event: event ?? "",
        severity: severity ?? "",
        startsAt: startsAt ?? "",
        endsAt: endsAt ?? "",
        description: description ?? "",
        areas: parseAreas(rawArea ?? ""),
        link: `https://avisos.inmet.gov.br/${alertId}`,
      };
    });

    const activeAlerts = alerts.filter((alert) => !isExpired(alert.endsAt));

    const spAlerts = mesoregion
      ? activeAlerts.filter((alert) => alert.areas.includes(mesoregion))
      : activeAlerts.filter((alert) =>
          alert.areas.some(
            (area) => area.includes("Paulista") || area.includes("São Paulo")
          )
        );

    return Response.json({ alerts: spAlerts, mesoregion });
  } catch (error) {
    console.error("Falha ao buscar avisos do INMET:", error);
    return Response.json({ alerts: [], mesoregion: null });
  }
}
