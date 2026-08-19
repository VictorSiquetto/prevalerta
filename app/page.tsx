"use client";

import { useState } from "react";

type Location = {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
};

type HourlyForecast = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
};

type Weather = {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  weatherCode: number;
  hourly: HourlyForecast[];
};

export default function Home() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  async function fetchWeather(latitude: number, longitude: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=America%2FSao_Paulo&forecast_days=2`;

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

    setWeather({
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      windSpeed: data.current.wind_speed_10m,
      windGusts: data.current.wind_gusts_10m,
      weatherCode: data.current.weather_code,
      hourly,
    });
  }

  async function handleSearch() {
    if (!city.trim()) return;

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=pt&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log("Cidade não encontrada");
      setLocation(null);
      setWeather(null);
      return;
    }

    const found = data.results[0];
    setLocation({
      name: found.name,
      state: found.admin1,
      latitude: found.latitude,
      longitude: found.longitude,
    });

    await fetchWeather(found.latitude, found.longitude);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Clima SP
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Veja as condições atuais de uma cidade do Estado de São Paulo.
        </p>

        <div className="mt-8 flex gap-2">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Pesquise uma cidade..."
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            onClick={handleSearch}
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Pesquisar
          </button>
        </div>

        {location && (
          <div className="mt-8 text-left text-zinc-700 dark:text-zinc-300">
            <p className="font-semibold">Cidade encontrada:</p>
            <p>
              {location.name} - {location.state}
            </p>
            <p>Latitude: {location.latitude}</p>
            <p>Longitude: {location.longitude}</p>
          </div>
        )}

        {weather && (
          <div className="mt-4 text-left text-zinc-700 dark:text-zinc-300">
            <p>Temperatura: {weather.temperature}°C</p>
            <p>Umidade: {weather.humidity}%</p>
            <p>Precipitação: {weather.precipitation} mm</p>
            <p>Vento: {weather.windSpeed} km/h</p>
            <p>Rajadas: {weather.windGusts} km/h</p>

            <p className="mt-4 font-semibold">Próximas horas:</p>
            <ul>
              {weather.hourly.map((hour) => (
                <li key={hour.time}>
                  {hour.time.slice(11, 16)} — {hour.temperature}°C —{" "}
                  {hour.precipitationProbability}%
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
