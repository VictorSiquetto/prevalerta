import { EXTERNAL_API_TIMEOUT_MS } from "@/lib/http";

type Municipio = {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      nome: string;
    };
  };
};

let cachedMunicipios: Municipio[] | null = null;

async function getSaoPauloMunicipios(): Promise<Municipio[]> {
  if (cachedMunicipios) return cachedMunicipios;

  const response = await fetch(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios",
    {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    }
  );
  if (!response.ok) {
    throw new Error(`IBGE respondeu com status ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Resposta inesperada do IBGE.");
  }
  cachedMunicipios = data as Municipio[];
  return cachedMunicipios;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]+/g, " ")
    .trim()
    .toLowerCase();
}

async function findMunicipio(cityName: string): Promise<Municipio | null> {
  const municipios = await getSaoPauloMunicipios();
  const normalized = normalizeName(cityName);
  return (
    municipios.find(
      (municipio) => normalizeName(municipio.nome) === normalized
    ) ?? null
  );
}

export async function getMesoregion(cityName: string): Promise<string | null> {
  try {
    const found = await findMunicipio(cityName);
    return found?.microrregiao?.mesorregiao?.nome ?? null;
  } catch (error) {
    console.error("Falha ao buscar mesorregião no IBGE:", error);
    return null;
  }
}

export async function getMunicipioId(cityName: string): Promise<number | null> {
  try {
    const found = await findMunicipio(cityName);
    return typeof found?.id === "number" ? found.id : null;
  } catch (error) {
    console.error("Falha ao buscar município no IBGE:", error);
    return null;
  }
}
