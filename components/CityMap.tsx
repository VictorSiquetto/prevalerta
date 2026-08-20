"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  AttributionControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

export type MapLocation = {
  latitude: number;
  longitude: number;
  name: string;
};

type CityMapProps = {
  location: MapLocation | null;
  temperature?: number;
};

function MapUpdater({ location }: { location: MapLocation | null }) {
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

export default function CityMap({ location, temperature }: CityMapProps) {
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
      <MapUpdater location={location} />
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
