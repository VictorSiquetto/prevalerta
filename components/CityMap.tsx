"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  GeoJSON,
  AttributionControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import type { RiskLevel } from "@/lib/riskClassification";
import type { Location } from "@/types/location";
import type { RouteInfo } from "@/types/route";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SAO_PAULO_STATE_CENTER: [number, number] = [-22.19, -48.79];
const STATE_ZOOM = 7;
const CITY_ZOOM = 12;
const RISK_CIRCLE_RADIUS_METERS = 15000;

const RISK_COLORS: Record<RiskLevel, string> = {
  normal: "#10b981",
  atencao: "#eab308",
  risco_elevado: "#f97316",
  critico: "#ef4444",
};

type CityMapProps = {
  location: Location | null;
  temperature?: number;
  riskLevel?: RiskLevel;
  routeStops?: Location[];
  routeInfo?: RouteInfo | null;
};

function toLatLng(stop: Location): [number, number] {
  return [stop.latitude, stop.longitude];
}

function MapUpdater({
  location,
  routeStops,
}: {
  location: Location | null;
  routeStops: Location[];
}) {
  const map = useMap();

  useEffect(() => {
    if (routeStops.length >= 2) {
      map.fitBounds(L.latLngBounds(routeStops.map(toLatLng)), {
        padding: [48, 48],
      });
    } else if (routeStops.length === 1) {
      map.flyTo(toLatLng(routeStops[0]), CITY_ZOOM);
    } else if (location) {
      map.flyTo(toLatLng(location), CITY_ZOOM);
    } else {
      map.flyTo(SAO_PAULO_STATE_CENTER, STATE_ZOOM);
    }
  }, [location, routeStops, map]);

  return null;
}

function StateBoundary() {
  const [boundary, setBoundary] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch("/data/sp-boundary.geojson")
      .then((response) => response.json())
      .then(setBoundary)
      .catch((error) =>
        console.error("Falha ao carregar contorno do Estado de SP:", error)
      );
  }, []);

  if (!boundary) return null;

  return (
    <GeoJSON
      data={boundary}
      interactive={false}
      style={{ color: "#000000", weight: 3, fillOpacity: 0, opacity: 0.75 }}
    />
  );
}

export default function CityMap({
  location,
  temperature,
  riskLevel,
  routeStops = [],
  routeInfo,
}: CityMapProps) {
  const hasRoute = routeStops.length > 0;

  return (
    <MapContainer
      center={SAO_PAULO_STATE_CENTER}
      zoom={STATE_ZOOM}
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* prefix={false} remove só o crédito da biblioteca Leaflet; o aviso do OpenStreetMap continua, pois é obrigatório */}
      <AttributionControl position="bottomright" prefix={false} />
      <StateBoundary />
      <MapUpdater location={location} routeStops={routeStops} />

      {hasRoute ? (
        <>
          {routeStops.length >= 2 &&
            (routeInfo ? (
              // Rota real, seguindo as estradas (OSRM). O contorno branco por
              // baixo ("casing") garante contraste em cima de qualquer fundo
              // do mapa — sem ele, uma linha fina se camufla facilmente.
              <>
                <Polyline
                  positions={routeInfo.coordinates}
                  pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.9 }}
                />
                <Polyline
                  positions={routeInfo.coordinates}
                  pathOptions={{ color: "#1e3a8a", weight: 4 }}
                />
              </>
            ) : (
              // Enquanto a rota real não chega (ou se falhar), uma linha reta
              // tracejada entre as paradas serve de indicação provisória.
              <>
                <Polyline
                  positions={routeStops.map(toLatLng)}
                  pathOptions={{ color: "#ffffff", weight: 6, opacity: 0.7 }}
                />
                <Polyline
                  positions={routeStops.map(toLatLng)}
                  pathOptions={{
                    color: "#1e3a8a",
                    weight: 3,
                    opacity: 0.9,
                    dashArray: "8 8",
                  }}
                />
              </>
            ))}
          {routeStops.map((stop, index) => (
            <Marker key={`${stop.name}-${index}`} position={toLatLng(stop)} icon={defaultIcon}>
              <Popup>
                {index + 1}. {stop.name} - {stop.state}
              </Popup>
            </Marker>
          ))}
        </>
      ) : (
        <>
          {location && riskLevel && (
            <Circle
              center={toLatLng(location)}
              radius={RISK_CIRCLE_RADIUS_METERS}
              pathOptions={{
                color: RISK_COLORS[riskLevel],
                fillColor: RISK_COLORS[riskLevel],
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
          )}
          {location && (
            <Marker position={toLatLng(location)} icon={defaultIcon}>
              <Popup>
                {location.name}
                {typeof temperature === "number" &&
                  ` — ${Math.round(temperature)}°C`}
              </Popup>
            </Marker>
          )}
        </>
      )}
    </MapContainer>
  );
}
