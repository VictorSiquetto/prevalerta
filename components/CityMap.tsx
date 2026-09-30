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

// Ícones servidos pelo próprio app (cópias de leaflet/dist/images em
// public/leaflet), em vez de depender de uma CDN externa que pode cair.
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
// Contorno do Estado de SP (IBGE), embutido no código do mapa.
const STATE_BOUNDARY = spBoundary as GeoJsonObject;
const STATE_BOUNDARY_STYLE = {
  color: "#000000",
  weight: 3,
  fillOpacity: 0,
  opacity: 0.75,
};

type CityMapProps = {
  // Cidade da busca principal e o clima dela (null enquanto carrega).
  location: Location | null;
  weather: Weather | null;
  // Paradas da rota (vazio fora do modo rota) e os dados de cada uma.
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

  // Uma cidade sozinha (pesquisada ou única parada) é enquadrada pelo
  // próprio CityArea, que conhece o contorno do município. Aqui ficam só a
  // rota inteira e a volta para a visão do Estado.
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
      {/* prefix={false} remove só o crédito da biblioteca Leaflet; o aviso do OpenStreetMap continua, pois é obrigatório */}
      <AttributionControl position="bottomright" prefix={false} />
      <GeoJSON
        data={STATE_BOUNDARY}
        interactive={false}
        style={STATE_BOUNDARY_STYLE}
      />
      <MapUpdater location={location} routeStops={routeStops} />

      {routeStops.length > 0 ? (
        <>
          {/* Manchas de risco primeiro, para a linha da rota ficar por cima.
              A da parada selecionada fica mais forte que as demais. */}
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
              // Rota real, seguindo as estradas (OSRM). O contorno branco por
              // baixo ("casing") garante contraste em cima de qualquer fundo
              // do mapa — sem ele, uma linha fina se camufla facilmente.
              // As `key` diferentes das linhas provisórias obrigam o Leaflet a
              // criar linhas novas; reaproveitando, o tracejado ficava grudado.
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
              // Enquanto a rota real não chega (ou se falhar), uma linha reta
              // tracejada entre as paradas serve de indicação provisória.
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
