"use client";

import { useEffect, useState } from "react";
import { Circle, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import { getOverlayPadding, MAX_FIT_ZOOM } from "@/lib/mapView";
import { getCityBoundary } from "@/services/boundary";
import type { Location } from "@/types/location";

type CityAreaProps = {
  location: Location;
  color: string;
  emphasis?: "strong" | "soft";
  fitView?: boolean;
  onClick?: () => void;
};

const FALLBACK_RADIUS_METERS = 8000;

export default function CityArea({
  location,
  color,
  emphasis = "strong",
  fitView = false,
  onClick,
}: CityAreaProps) {
  const map = useMap();
  const [result, setResult] = useState<{
    city: string;
    boundary: GeoJsonObject | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCityBoundary(location.name).then((boundary) => {
      if (!cancelled) setResult({ city: location.name, boundary });
    });
    return () => {
      cancelled = true;
    };
  }, [location.name]);

  useEffect(() => {
    if (!fitView || result?.city !== location.name) return;

    const center = L.latLng(location.latitude, location.longitude);
    const boundaryBounds = result.boundary
      ? L.geoJSON(result.boundary).getBounds()
      : null;
    const bounds = boundaryBounds?.isValid()
      ? boundaryBounds
      : center.toBounds(FALLBACK_RADIUS_METERS * 2);
    map.flyToBounds(bounds, {
      ...getOverlayPadding(map),
      maxZoom: MAX_FIT_ZOOM,
    });
  }, [fitView, result, location, map]);

  const isStrong = emphasis === "strong";
  const eventHandlers = onClick ? { click: onClick } : undefined;

  if (result?.city !== location.name) return null;

  if (!result.boundary) {
    return (
      <Circle
        center={[location.latitude, location.longitude]}
        radius={FALLBACK_RADIUS_METERS}
        interactive={Boolean(onClick)}
        eventHandlers={eventHandlers}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: isStrong ? 0.25 : 0.12,
          weight: isStrong ? 2 : 1.5,
        }}
      />
    );
  }

  return (
    <>
      <GeoJSON
        key={`${location.name}-glow`}
        data={result.boundary}
        interactive={false}
        style={{
          color,
          weight: isStrong ? 10 : 6,
          opacity: isStrong ? 0.18 : 0.1,
          fill: false,
          lineJoin: "round",
        }}
      />
      <GeoJSON
        key={`${location.name}-area`}
        data={result.boundary}
        interactive={Boolean(onClick)}
        eventHandlers={eventHandlers}
        style={{
          color,
          weight: isStrong ? 2 : 1.5,
          opacity: isStrong ? 0.9 : 0.6,
          fillColor: color,
          fillOpacity: isStrong ? 0.28 : 0.14,
          lineJoin: "round",
        }}
      />
    </>
  );
}
