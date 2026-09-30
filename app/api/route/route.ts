// Limite de paradas por rota: evita pedidos enormes ao servidor público do
// OSRM, que é compartilhado e tem limites de uso.
const MAX_POINTS = 25;

function parsePoints(
  raw: string
): { latitude: number; longitude: number }[] {
  return raw.split(";").map((pair) => {
    const [latitude, longitude] = pair.split(",").map(Number);
    return { latitude, longitude };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("points");

  if (!raw) {
    return Response.json(
      { error: "Parâmetro points é obrigatório." },
      { status: 400 }
    );
  }

  const points = parsePoints(raw);
  const isValid =
    points.length >= 2 &&
    points.length <= MAX_POINTS &&
    points.every(
      (point) =>
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude) &&
        Math.abs(point.latitude) <= 90 &&
        Math.abs(point.longitude) <= 180
    );

  if (!isValid) {
    return Response.json(
      { error: `São necessários de 2 a ${MAX_POINTS} pontos válidos.` },
      { status: 400 }
    );
  }

  // OSRM espera "longitude,latitude", ao contrário da nossa convenção.
  const coordinates = points
    .map((point) => `${point.longitude},${point.latitude}`)
    .join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

  try {
    // Guarda por 1 hora: a mesma rota entre duas cidades não muda de um
    // minuto para o outro, e evita sobrecarregar o servidor público do OSRM.
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !Array.isArray(data.routes?.[0]?.geometry?.coordinates)
    ) {
      return Response.json(
        { error: "Não foi possível calcular a rota entre esses pontos." },
        { status: 502 }
      );
    }

    const route = data.routes[0];
    const routeCoordinates: [number, number][] =
      route.geometry.coordinates.map(([longitude, latitude]: number[]) => [
        latitude,
        longitude,
      ]);

    return Response.json({
      coordinates: routeCoordinates,
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
    });
  } catch (error) {
    console.error("Falha ao buscar rota no OSRM:", error);
    return Response.json(
      { error: "Serviço de rotas indisponível." },
      { status: 502 }
    );
  }
}
