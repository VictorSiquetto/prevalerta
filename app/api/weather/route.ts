import { EXTERNAL_API_TIMEOUT_MS, isTimeoutError } from "@/lib/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude") ?? NaN);
  const longitude = Number(searchParams.get("longitude") ?? NaN);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return Response.json(
      { error: "Parâmetros latitude e longitude inválidos." },
      { status: 400 }
    );
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,is_day&timezone=America%2FSao_Paulo&forecast_days=2`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS),
    });
    return Response.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("Falha ao buscar dados da Open-Meteo:", error);
    return Response.json(
      { error: "Serviço meteorológico indisponível." },
      { status: isTimeoutError(error) ? 504 : 502 }
    );
  }
}
