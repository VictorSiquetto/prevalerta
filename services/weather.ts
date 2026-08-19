import type { HourlyForecast, Weather } from "@/types/weather";

export async function getWeather(
  latitude: number,
  longitude: number
): Promise<Weather> {
  const url = `/api/weather?latitude=${latitude}&longitude=${longitude}`;

  const response = await fetch(url);
  const data = await response.json();

  const hourly: HourlyForecast[] = data.hourly.time
    .map((time: string, index: number) => ({
      time,
      temperature: data.hourly.temperature_2m[index],
      precipitationProbability: data.hourly.precipitation_probability[index],
      precipitation: data.hourly.precipitation[index],
      weatherCode: data.hourly.weather_code[index],
    }))
    .filter((hour: HourlyForecast) => hour.time >= data.current.time)
    .slice(0, 6);

  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    precipitationProbability: hourly[0]?.precipitationProbability ?? 0,
    windSpeed: data.current.wind_speed_10m,
    windGusts: data.current.wind_gusts_10m,
    weatherCode: data.current.weather_code,
    hourly,
  };
}
