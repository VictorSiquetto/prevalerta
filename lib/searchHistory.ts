import type { Location } from "@/types/location";

const STORAGE_KEY = "prevalerta:search-history";
const MAX_ITEMS = 8;

export function getSearchHistory(): Location[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Location[]) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: Location[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage indisponível (modo privado, cota cheia, etc.) — ignora
  }
}

export function addToSearchHistory(location: Location): Location[] {
  const withoutDuplicate = getSearchHistory().filter(
    (item) => item.name !== location.name
  );
  const updated = [location, ...withoutDuplicate].slice(0, MAX_ITEMS);
  saveSearchHistory(updated);
  return updated;
}

export function removeFromSearchHistory(name: string): Location[] {
  const updated = getSearchHistory().filter((item) => item.name !== name);
  saveSearchHistory(updated);
  return updated;
}

export function clearSearchHistory(): Location[] {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
  return [];
}
