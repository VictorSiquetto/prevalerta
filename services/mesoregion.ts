import municipios from "@/data/sp-municipios.json";

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-\s]+/g, " ")
    .trim()
    .toLowerCase();
}

const municipiosByName = new Map(
  municipios.map((municipio) => [normalizeName(municipio.nome), municipio])
);

export function getOfficialName(cityName: string): string | null {
  return municipiosByName.get(normalizeName(cityName))?.nome ?? null;
}

export function getMesoregion(cityName: string): string | null {
  return municipiosByName.get(normalizeName(cityName))?.mesorregiao ?? null;
}

export function getMunicipioId(cityName: string): number | null {
  return municipiosByName.get(normalizeName(cityName))?.id ?? null;
}
