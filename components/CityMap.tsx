"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  GeoJSON,
  AttributionControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import spBoundary from "@/data/sp-boundary.json";
import CityArea from "@/components/CityArea";
import { classifyRisk } from "@/lib/riskClassification";
import { getOverlayPadding, ROUTE_MAX_ZOOM } from "@/lib/mapView";
import type { Location } from "@/types/location";
import type { RouteInfo, StopDataState } from "@/types/route";
import type { Weather } from "@/types/weather";

const defaultIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SAO_PAULO_STATE_CENTER: [number, number] = [-22.19, -48.79];
const STATE_ZOOM = 7;
const STATE_BOUNDARY = spBoundary as GeoJsonObject;
const STATE_BOUNDARY_STYLE = {
  color: "#000000",
  weight: 3,
  fillOpacity: 0,
  opacity: 0.75,
};

type CityMapProps = {
  location: Location | null;
  weather: Weather | null;
  routeStops: Location[];
  routeInfo: RouteInfo | null;
  stopData: Record<string, StopDataState>;
  selectedStopName: string | null;
  onSelectStop: (name: string) => void;
};

function toLatLng(stop: Location): [number, number] {
  return [stop.latitude, stop.longitude];
}

function readyWeather(state: StopDataState | undefined): Weather | null {
  return state?.status === "ready" ? state.data.weather : null;
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
      map.flyToBounds(L.latLngBounds(routeStops.map(toLatLng)), {
        ...getOverlayPadding(map),
        maxZoom: ROUTE_MAX_ZOOM,
      });
    } else if (routeStops.length === 0 && !location) {
      map.flyTo(SAO_PAULO_STATE_CENTER, STATE_ZOOM);
    }
  }, [location, routeStops, map]);

  return null;
}

export default function CityMap({
  location,
  weather,
  routeStops,
  routeInfo,
  stopData,
  selectedStopName,
  onSelectStop,
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
      <AttributionControl position="bottomright" prefix={false} />
      <GeoJSON
        data={STATE_BOUNDARY}
        interactive={false}
        style={STATE_BOUNDARY_STYLE}
      />
      <MapUpdater location={location} routeStops={routeStops} />

      {routeStops.length > 0 ? (
        <>
          {routeStops.map((stop) => {
            const stopWeather = readyWeather(stopData[stop.name]);
            if (!stopWeather) return null;
            return (
              <CityArea
                key={stop.name}
                location={stop}
                color={classifyRisk(stopWeather).color}
                emphasis={stop.name === selectedStopName ? "strong" : "soft"}
                fitView={routeStops.length === 1}
                onClick={() => onSelectStop(stop.name)}
              />
            );
          })}
          {routeStops.length >= 2 &&
            (routeInfo ? (
              <>
                <Polyline
                  key="road-casing"
                  positions={routeInfo.coordinates}
                  pathOptions={{ color: "#ffffff", weight: 7, opacity: 0.9 }}
                />
                <Polyline
                  key="road-line"
                  positions={routeInfo.coordinates}
                  pathOptions={{ color: "#1e3a8a", weight: 4 }}
                />
              </>
            ) : (
              <>
                <Polyline
                  key="straight-casing"
                  positions={routeStops.map(toLatLng)}
                  pathOptions={{ color: "#ffffff", weight: 6, opacity: 0.7 }}
                />
                <Polyline
                  key="straight-line"
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
          {routeStops.map((stop, index) => {
            const stopWeather = readyWeather(stopData[stop.name]);
            return (
              <Marker
                key={stop.name}
                position={toLatLng(stop)}
                icon={defaultIcon}
                eventHandlers={{ click: () => onSelectStop(stop.name) }}
              >
                <Popup>
                  {index + 1}. {stop.name} - {stop.state}
                  {stopWeather &&
                    ` — ${Math.round(stopWeather.temperature)}°C`}
                </Popup>
              </Marker>
            );
          })}
        </>
      ) : (
        location && (
          <>
            {weather && (
              <CityArea
                key={location.name}
                location={location}
                color={classifyRisk(weather).color}
                fitView
              />
            )}
            <Marker position={toLatLng(location)} icon={defaultIcon}>
              <Popup>
                {location.name}
                {weather && ` — ${Math.round(weather.temperature)}°C`}
              </Popup>
            </Marker>
          </>
        )
      )}
    </MapContainer>
  );
}
