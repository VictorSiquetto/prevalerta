import type { Location } from "@/types/location";
import { CLIENT_TIMEOUT_MS, describeFetchError } from "@/lib/http";

type GeocodingResult = {
  name?: unknown;
  admin1?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export type CityLookup =
  | { ok: true; location: Location }
  | { ok: false; error: string };

// Só aceita resultados com nome e coordenadas válidos: um resultado sem
// coordenadas levaria o mapa e a busca do clima a falhar mais adiante.
function toLocation(result: GeocodingResult): Location | null {
  const { name, admin1, latitude, longitude } = result;
  if (
    typeof name !== "string" ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }
  return {
    name,
    state: typeof admin1 === "string" ? admin1 : "",
    latitude,
    longitude,
  };
}

async function searchCity(city: string): Promise<Location | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=5&language=pt&format=json`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Geocoding respondeu com status ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data?.results)) {
    return null;
  }

  const locations = (data.results as GeocodingResult[])
    .map(toLocation)
    .filter((location): location is Location => location !== null);

  return (
    locations.find((location) => location.state === "São Paulo") ??
    locations[0] ??
    null
  );
}

// Busca a cidade e confere se ela é do Estado de São Paulo, já com a
// mensagem de erro pronta para a tela. Usada na busca principal e ao
// adicionar paradas na rota.
export async function lookupSaoPauloCity(name: string): Promise<CityLookup> {
  try {
    const location = await searchCity(name);
    if (!location) {
      return {
        ok: false,
        error:
          "Não conseguimos encontrar essa cidade. Verifique o nome e tente novamente.",
      };
    }
    if (location.state !== "São Paulo") {
      return {
        ok: false,
        error:
          "No momento, o PreVAlerta cobre apenas cidades do Estado de São Paulo.",
      };
    }
    return { ok: true, location };
  } catch (error) {
    console.error("Falha ao buscar cidade:", error);
    return {
      ok: false,
      error: describeFetchError(
        error,
        "Não foi possível buscar essa cidade agora. Tente novamente."
      ),
    };
  }
}
