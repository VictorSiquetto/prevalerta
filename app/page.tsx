"use client";

import { useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  async function handleSearch() {
    if (isFetchingRef.current) return;

    if (!city.trim()) {
      setError("Digite o nome de uma cidade.");
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const found = await searchCity(city);

      if (!found) {
        setLocation(null);
        setWeather(null);
        setError(
          "Não conseguimos encontrar essa cidade. Verifique o nome e tente novamente."
        );
        return;
      }

      if (found.state !== "São Paulo") {
        setLocation(null);
        setWeather(null);
        setError(
          "No momento, este aplicativo cobre apenas cidades do Estado de São Paulo."
        );
        return;
      }

      setLocation(found);

      const weatherData = await getWeather(found.latitude, found.longitude);
      setWeather(weatherData);
    } catch (caughtError) {
      console.error("Falha ao buscar dados meteorológicos:", caughtError);
      setLocation(null);
      setWeather(null);
      setError(
        "Não foi possível obter os dados meteorológicos. Tente novamente."
      );
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
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
            disabled={isLoading}
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isLoading ? "Buscando..." : "Pesquisar"}
          </button>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Buscando condições meteorológicas...
          </p>
        )}

        {!isLoading && error && (
          <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {!isLoading && !error && location && weather && (
          <>
            <WeatherCard location={location} weather={weather} />
            <HourlyForecastList hourly={weather.hourly} />
          </>
        )}
      </main>
    </div>
  );
}
