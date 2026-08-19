"use client";

import { useState } from "react";
import { searchCity } from "@/services/geocoding";
import { getWeather } from "@/services/weather";
import type { Location } from "@/types/location";
import type { Weather } from "@/types/weather";
import WeatherCard from "@/components/WeatherCard";
import HourlyForecastList from "@/components/HourlyForecastList";

export default function Home() {
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);

  async function handleSearch() {
    if (!city.trim()) return;

    const found = await searchCity(city);

    if (!found) {
      console.log("Cidade não encontrada");
      setLocation(null);
      setWeather(null);
      return;
    }

    setLocation(found);

    const weatherData = await getWeather(found.latitude, found.longitude);
    setWeather(weatherData);
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

        {location && weather && (
          <>
            <WeatherCard location={location} weather={weather} />
            <HourlyForecastList hourly={weather.hourly} />
          </>
        )}
      </main>
    </div>
  );
}
