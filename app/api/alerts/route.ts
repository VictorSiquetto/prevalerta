import { getMesoregion } from "@/services/mesoregion";

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
      const link = extractTag(item, "link");
      const descriptionHtml = extractCData(extractTag(item, "description"));
      const values = extractTableValues(descriptionHtml);

      const [, event, severity, startsAt, endsAt, description, rawArea] =
        values;

      return {
        id: guid,
        event: event ?? "",
        severity: severity ?? "",
        startsAt: startsAt ?? "",
        endsAt: endsAt ?? "",
        description: description ?? "",
        areas: parseAreas(rawArea ?? ""),
        link,
      };
    });

    const spAlerts = mesoregion
      ? alerts.filter((alert) => alert.areas.includes(mesoregion))
      : alerts.filter((alert) =>
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
