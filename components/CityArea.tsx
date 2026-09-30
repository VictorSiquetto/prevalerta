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
  // "strong" destaca a cidade em foco; "soft" é para as demais paradas.
  emphasis?: "strong" | "soft";
  // Quando true, o mapa enquadra o município inteiro assim que o contorno
  // chega (ou a região em volta do centro, se não houver contorno).
  fitView?: boolean;
  onClick?: () => void;
};

// Só usado se o contorno do IBGE não puder ser carregado.
const FALLBACK_RADIUS_METERS = 8000;

// Mancha na cor do risco cobrindo o território do município, com o
// contorno oficial do IBGE. Uma borda larga e bem transparente por baixo
// dá o efeito de brilho suave em volta da cidade.
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

  // Enquadra de novo quando o contorno chega, quando a cidade é pesquisada
  // outra vez (objeto `location` novo) ou quando passa a ser a cidade em foco.
  useEffect(() => {
    if (!fitView || result?.city !== location.name) return;

    const center = L.latLng(location.latitude, location.longitude);
    const boundaryBounds = result.boundary
      ? L.geoJSON(result.boundary).getBounds()
      : null;
    // Um contorno sem pontos daria limites inválidos, e o Leaflet lança erro
    // ao enquadrá-los: nesse caso usa a região em volta do centro.
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

  // Ainda carregando (ou resposta de outra cidade): não desenha nada, para
  // não piscar um círculo antes do contorno chegar.
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

  // `key` com o nome da cidade: o GeoJSON do react-leaflet não troca os
  // dados depois de criado, então uma cidade nova precisa de camada nova.
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
