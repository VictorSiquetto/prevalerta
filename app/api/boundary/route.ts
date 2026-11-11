import { getMunicipioId } from "@/services/mesoregion";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return Response.json(
      { error: "Parâmetro city é obrigatório." },
      { status: 400 }
    );
  }

  const id = getMunicipioId(city);
  if (id === null) {
    return Response.json(
      { error: "Município não encontrado." },
      { status: 404 }
    );
  }

  return Response.redirect(
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${id}?formato=application/vnd.geo%2Bjson&qualidade=intermediaria`,
    307
  );
}
