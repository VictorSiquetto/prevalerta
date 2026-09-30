import { getMunicipioId } from "@/services/mesoregion";
import { EXTERNAL_API_TIMEOUT_MS } from "@/lib/http";

// Confere se a resposta é um GeoJSON com pelo menos um polígono: um
// contorno vazio ou malformado quebraria o desenho e o enquadramento do mapa.
function isBoundaryCollection(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const { type, features } = data as { type?: unknown; features?: unknown };
  return (
    type === "FeatureCollection" &&
    Array.isArray(features) &&
    features.length > 0 &&
    features.every((feature) => {
      const geometry = (feature as { geometry?: { type?: unknown; coordinates?: unknown } })
        ?.geometry;
      return (
        (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon") &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length > 0
      );
    })
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return Response.json(
      { error: "Parâmetro city é obrigatório." },
      { status: 400 }
    );
  }

  const id = await getMunicipioId(city);
  if (id === null) {
    return Response.json(
      { error: "Município não encontrado." },
      { status: 404 }
    );
  }

  // Qualidade "intermediaria": contorno fiel o bastante para o mapa e leve
  // (poucos KB por cidade).
  const url = `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${id}?formato=application/vnd.geo%2Bjson&qualidade=intermediaria`;

  try {
    // Limites de municípios praticamente não mudam: guarda por 1 semana.
    const response = await fetch(url, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`IBGE respondeu com status ${response.status}`);
    }
    const data = await response.json();

    if (!isBoundaryCollection(data)) {
      throw new Error("Resposta inesperada da malha do IBGE.");
    }

    return Response.json(data);
  } catch (error) {
    console.error("Falha ao buscar contorno do município:", error);
    return Response.json(
      { error: "Contorno do município indisponível." },
      { status: 502 }
    );
  }
}
