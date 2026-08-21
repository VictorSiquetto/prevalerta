"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  GeoJSON,
  AttributionControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import type { RiskLevel } from "@/lib/riskClassification";
import type { Location } from "@/types/location";

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
};

function MapUpdater({ location }: { location: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], CITY_ZOOM);
    } else {
      map.flyTo(SAO_PAULO_STATE_CENTER, STATE_ZOOM);
    }
  }, [location, map]);

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
}: CityMapProps) {
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
      <MapUpdater location={location} />
      {location && riskLevel && (
        <Circle
          center={[location.latitude, location.longitude]}
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
        <Marker
          position={[location.latitude, location.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            {location.name}
            {typeof temperature === "number" &&
              ` — ${Math.round(temperature)}°C`}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
