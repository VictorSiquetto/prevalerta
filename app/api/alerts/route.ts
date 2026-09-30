import { getMesoregion } from "@/services/mesoregion";
import { parseAlertDate } from "@/lib/formatAlertTime";
import { EXTERNAL_API_TIMEOUT_MS } from "@/lib/http";

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

function isValidDate(rawDate: string): boolean {
  return !Number.isNaN(parseAlertDate(rawDate).getTime());
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

    // Guarda o feed do INMET por 5 minutos: ele é o mesmo para qualquer
    // cidade, então evita rebaixar a rede toda vez que alguém pesquisa.
    const response = await fetch(INMET_FEED_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`INMET respondeu com status ${response.status}`);
    }
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

    // Descarta avisos com datas que não conseguimos ler: além de não dar
    // para saber se estão em vigor, formatar uma data inválida quebraria a
    // tela de alertas.
    const activeAlerts = alerts.filter(
      (alert) =>
        isValidDate(alert.startsAt) &&
        isValidDate(alert.endsAt) &&
        !isExpired(alert.endsAt)
    );

    const spAlerts = mesoregion
      ? activeAlerts.filter((alert) => alert.areas.includes(mesoregion))
      : activeAlerts.filter((alert) =>
          alert.areas.some(
            (area) => area.includes("Paulista") || area.includes("São Paulo")
          )
        );

    return Response.json({ alerts: spAlerts, mesoregion, unavailable: false });
  } catch (error) {
    // Sinaliza a falha em vez de devolver só uma lista vazia: "não há
    // alertas" e "não deu para consultar" são coisas bem diferentes.
    console.error("Falha ao buscar avisos do INMET:", error);
    return Response.json({ alerts: [], mesoregion: null, unavailable: true });
  }
}
