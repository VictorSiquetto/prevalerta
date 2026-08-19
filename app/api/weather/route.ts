export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");

  if (!latitude || !longitude) {
    return Response.json(
      { error: "Parâmetros latitude e longitude são obrigatórios." },
      { status: 400 }
    );
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=America%2FSao_Paulo&forecast_days=2`;

  const response = await fetch(url);
  const data = await response.json();

  return Response.json(data);
}
