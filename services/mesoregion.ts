type Municipio = {
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
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios"
  );
  const data: Municipio[] = await response.json();
  cachedMunicipios = data;
  return data;
}

export async function getMesoregion(cityName: string): Promise<string | null> {
  const municipios = await getSaoPauloMunicipios();
  const normalized = cityName.trim().toLowerCase();

  const found = municipios.find(
    (municipio) => municipio.nome.trim().toLowerCase() === normalized
  );

  return found?.microrregiao.mesorregiao.nome ?? null;
}
