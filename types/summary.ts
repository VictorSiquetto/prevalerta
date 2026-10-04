import type { CityReport } from "@/types/weather";

export type SummaryRequest = {
  stops: CityReport[];
};

export const MAX_SUMMARY_STOPS = 10;
