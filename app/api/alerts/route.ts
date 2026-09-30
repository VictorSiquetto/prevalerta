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

// Transforma um <item> do feed em aviso. As áreas atingidas ficam à parte:
// só servem para o filtro por região aqui no servidor, não vão para a tela.
function parseItem(item: string): { alert: WeatherAlert; areas: string[] } {
  const guid = extractTag(item, "guid");
  const values = extractTableValues(
    extractCData(extractTag(item, "description"))
  );
  const [, event, severity, startsAt, endsAt, description, rawArea] = values;

  // O guid termina em ".../rss/{id}" — usamos esse id para montar o link da
  // página visual do aviso (avisos.inmet.gov.br), em vez do XML técnico.
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

// Aviso ainda válido. Datas que não conseguimos ler são descartadas: além
// de não dar para saber se o aviso está em vigor, formatar uma data
// inválida quebraria a tela de alertas.
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

    // Guarda o feed do INMET por 5 minutos: ele é o mesmo para qualquer
    // cidade, então evita baixá-lo de novo a cada pesquisa.
    const response = await fetch(INMET_FEED_URL, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`INMET respondeu com status ${response.status}`);
    }
    const xml = await response.text();

    // Com a mesorregião, filtra os avisos exatos dela; sem ela, fica com
    // os que citam regiões do Estado (a tela avisa que podem ser genéricos).
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
    // Sinaliza a falha em vez de devolver só uma lista vazia: "não há
    // alertas" e "não deu para consultar" são coisas bem diferentes.
    console.error("Falha ao buscar avisos do INMET:", error);
    return Response.json({ alerts: [], mesoregion: null, unavailable: true });
  }
}
