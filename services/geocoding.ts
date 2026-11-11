import type { Location } from "@/types/location";
import { CLIENT_TIMEOUT_MS, describeFetchError } from "@/lib/http";
import { getOfficialName } from "@/services/mesoregion";

type GeocodingResult = {
  name?: unknown;
  admin1?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export type CityLookup =
  | { ok: true; location: Location }
  | { ok: false; error: string };

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
  )}&count=10&language=pt&format=json&countryCode=BR`;

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

  const isInSaoPaulo = (location: Location) => location.state === "São Paulo";
  const sameName = locations.filter(
    (location) =>
      location.name.localeCompare(city.trim(), "pt-BR", {
        sensitivity: "base",
      }) === 0
  );
  const match =
    sameName.find(isInSaoPaulo) ??
    sameName[0] ??
    locations.find(isInSaoPaulo) ??
    locations[0];
  if (!match || !isInSaoPaulo(match)) return match ?? null;

  const officialName = getOfficialName(city);
  return officialName ? { ...match, name: officialName } : match;
}

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
