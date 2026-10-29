"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { Box, Flex, Icon, Text } from "@chakra-ui/react";
import type {
  GeoJSONSource,
  Map as MapboxMap,
  Marker as MapboxMarker,
} from "mapbox-gl";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMap } from "react-icons/lu";

import { circlePolygon } from "@/functions/circlePolygon";
import { boundsOf } from "@/functions/geoShapes";
import { addKmzLayers, setKmzData } from "@/functions/kmzLayers";

import {
  CoverageGeoJson,
  CoverageMapLocation,
  CoverageMapProps,
} from "./interface";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Mapa base escuro do design ("Basemap").
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const SOURCE_ID = "coverage";
const RADIUS_SOURCE_ID = "location-radius";
const PUBLIC_SOURCE_ID = "public-area";
// Sem cobertura: Brasil inteiro.
const DEFAULT_CENTER: [number, number] = [-51.9, -14.2];
const DEFAULT_ZOOM = 3;
// Só o pin, sem raio: aproxima no endereço.
const LOCATION_ZOOM = 13;
const NO_LOCATIONS: CoverageMapLocation[] = [];

const EMPTY_COLLECTION: CoverageGeoJson = {
  type: "FeatureCollection",
  features: [],
};

/**
 * Mapa da cobertura (Mapbox GL): mapa base escuro com a área do KMZ, os pins
 * dos endereços de atendimento e os círculos dos raios, enquadrados juntos. O
 * `mapbox-gl` só carrega no navegador. Sem `NEXT_PUBLIC_MAPBOX_TOKEN`,
 * mostra um aviso no lugar do mapa.
 */
export function CoverageMap({
  geometry,
  locations = NO_LOCATIONS,
  publicGeometry = null,
  height = "220px",
  label,
}: CoverageMapProps) {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapboxMap | null>(null);
  const markersRef = React.useRef<MapboxMarker[]>([]);
  // Construtor do Marker, guardado do import dinâmico do mapbox-gl.
  const markerClassRef = React.useRef<typeof MapboxMarker | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  // Cria o mapa uma vez; o import dinâmico evita `window` no SSR.
  React.useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      markerClassRef.current = mapboxgl.Marker;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.on("load", () => {
        addKmzLayers(map, SOURCE_ID, { expandOnClick: true });

        // Raio de atendimento em volta do pin.
        map.addSource(RADIUS_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_COLLECTION as never,
        });
        map.addLayer({
          id: `${RADIUS_SOURCE_ID}-fill`,
          type: "fill",
          source: RADIUS_SOURCE_ID,
          paint: { "fill-color": "#8B5CF6", "fill-opacity": 0.18 },
        });
        map.addLayer({
          id: `${RADIUS_SOURCE_ID}-line`,
          type: "line",
          source: RADIUS_SOURCE_ID,
          paint: {
            "line-color": "#A78BFA",
            "line-width": 1.5,
            "line-dasharray": [2, 2],
          },
        });
        // Recorte público da cobertura ("Cobertura editada").
        map.addSource(PUBLIC_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_COLLECTION as never,
        });
        map.addLayer({
          id: `${PUBLIC_SOURCE_ID}-fill`,
          type: "fill",
          source: PUBLIC_SOURCE_ID,
          paint: { "fill-color": "#1F5AFF", "fill-opacity": 0.3 },
        });
        map.addLayer({
          id: `${PUBLIC_SOURCE_ID}-line`,
          type: "line",
          source: PUBLIC_SOURCE_ID,
          paint: { "line-color": "#1F5AFF", "line-width": 2 },
        });
        setIsReady(true);
      });

      mapRef.current = map;
    });

    // O mapa pode nascer ou voltar de um contêiner escondido (etapas do
    // assistente): redimensiona sempre que o contêiner muda de tamanho.
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Atualiza cobertura, pins e raios, e enquadra tudo junto. `locations`
  // deve vir memorizado: um array novo a cada render reenquadraria o mapa.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    setKmzData(map, SOURCE_ID, geometry);
    const publicSource = map.getSource(PUBLIC_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    publicSource?.setData((publicGeometry ?? EMPTY_COLLECTION) as never);

    const circles: CoverageGeoJson = {
      type: "FeatureCollection",
      features: locations
        .filter(({ radiusKm }) => radiusKm && radiusKm > 0)
        .map(({ longitude, latitude, radiusKm }) =>
          circlePolygon([longitude, latitude], radiusKm!),
        ),
    };
    const radiusSource = map.getSource(RADIUS_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    radiusSource?.setData(circles as never);

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const Marker = markerClassRef.current;
    if (Marker) {
      markersRef.current = locations.map(({ longitude, latitude }) =>
        new Marker({ color: "#8B5CF6" })
          .setLngLat([longitude, latitude])
          .addTo(map),
      );
    }

    const pins: CoverageGeoJson = {
      type: "MultiPoint",
      coordinates: locations.map(({ longitude, latitude }) => [
        longitude,
        latitude,
      ]),
    };
    const hasCircles = (circles.features as unknown[]).length > 0;
    const bounds = boundsOf(geometry, circles, pins, publicGeometry);

    if (!bounds) {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 0 });
    } else if (locations.length === 1 && !geometry && !hasCircles) {
      map.easeTo({
        center: [locations[0].longitude, locations[0].latitude],
        zoom: LOCATION_ZOOM,
        duration: 600,
      });
    } else {
      map.fitBounds(bounds, { padding: 24, maxZoom: 13, duration: 600 });
    }
  }, [geometry, publicGeometry, locations, isReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <Flex
        h={height}
        align="center"
        justify="center"
        direction="column"
        gap="8px"
        bg="#1F2430"
        rounded="4px"
        textAlign="center"
        px="24px"
      >
        <Icon as={LuMap} boxSize="20px" color="#8A9AB5" />
        <Text color="#C4CDD8" fontSize="12px" lineHeight="18px">
          {t("CoverageMap.missingToken")}
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={containerRef}
      role="region"
      aria-label={label}
      h={height}
      w="full"
      bg="#1F2430"
      overflow="hidden"
    />
  );
}
