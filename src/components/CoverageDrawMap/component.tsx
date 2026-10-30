"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import type { GeoJSONSource, Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMap, LuMinus, LuPlus } from "react-icons/lu";

import { boundsOf, closedPolygon, type LngLat } from "@/functions/geoShapes";
import { addKmzLayers, setKmzData } from "@/functions/kmzLayers";

import { CoverageDrawMapProps } from "./interface";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const DEFAULT_CENTER: LngLat = [-51.9, -14.2];
const DEFAULT_ZOOM = 3;
const FOCUS_ZOOM = 13;
/** Distância (px) do primeiro ponto para o clique fechar o polígono. */
const CLOSE_TOLERANCE_PX = 12;

/** Polígonos desenhados à mão. */
const SHAPE_COLOR = "#1F5AFF";

const KMZ = "draw-kmz";
const SHAPES = "draw-shapes";
const DRAFT = "draw-draft";
const VERTICES = "draw-vertices";

const EMPTY = { type: "FeatureCollection", features: [] } as const;

/** Polígonos fechados, cada um com o índice para o clique o identificar. */
function shapesCollection(shapes: LngLat[][], selected: number | null) {
  return {
    type: "FeatureCollection",
    features: shapes.map((shape, index) => ({
      type: "Feature",
      properties: { index, selected: index === selected },
      geometry: closedPolygon(shape),
    })),
  } as const;
}

/** Linha do polígono em desenho. */
function draftLine(points: LngLat[]) {
  return points.length >= 2
    ? ({ type: "LineString", coordinates: points } as const)
    : EMPTY;
}

function verticesOf(points: LngLat[]) {
  return {
    type: "FeatureCollection",
    features: points.map((point, index) => ({
      type: "Feature",
      // O primeiro ponto ganha destaque quando já dá para fechar no clique.
      properties: { first: index === 0 && points.length >= 3 },
      geometry: { type: "Point", coordinates: point },
    })),
  } as const;
}

const controlButton = {
  boxSize: "39px",
  minW: "39px",
  p: 0,
  rounded: "12px",
  bg: "#F4F6F9",
  color: "#5A6478",
  _hover: { bg: "white" },
} as const;

/**
 * Mapa do modal "Escolher cobertura": mostra o KMZ (manchas em vermelho,
 * linhas em laranja, pontos em verde) e, no
 * modo editado, os polígonos públicos (azul). Cada clique adiciona um ponto;
 * clicar no primeiro (com 3 ou mais) fecha o polígono. Fora de um desenho,
 * clicar num polígono o seleciona.
 */
export function CoverageDrawMap({
  coverage,
  mode,
  shapes,
  draft,
  selected,
  onAddPoint,
  onCloseShape,
  onSelect,
  onCancelDraft,
  onClear,
  focus = null,
  label,
}: CoverageDrawMapProps) {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapboxMap | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  // Os handlers do mapa são registrados uma vez: leem o estado atual por ref.
  const latest = React.useRef({
    mode,
    draft,
    selected,
    onAddPoint,
    onCloseShape,
    onSelect,
  });
  React.useEffect(() => {
    latest.current = {
      mode,
      draft,
      selected,
      onAddPoint,
      onCloseShape,
      onSelect,
    };
  });

  const drawing = draft.length > 0;

  React.useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
        doubleClickZoom: false,
      });
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      map.on("load", () => {
        // Sem expandir grupos no clique: o clique desenha.
        addKmzLayers(map, KMZ);

        map.addSource(SHAPES, { type: "geojson", data: EMPTY as never });
        map.addLayer({
          id: `${SHAPES}-fill`,
          type: "fill",
          source: SHAPES,
          paint: {
            "fill-color": SHAPE_COLOR,
            "fill-opacity": ["case", ["get", "selected"], 0.5, 0.3],
          },
        });
        map.addLayer({
          id: `${SHAPES}-line`,
          type: "line",
          source: SHAPES,
          paint: {
            "line-color": ["case", ["get", "selected"], "#FFFFFF", SHAPE_COLOR],
            "line-width": ["case", ["get", "selected"], 3, 2],
          },
        });

        map.addSource(DRAFT, { type: "geojson", data: EMPTY as never });
        map.addLayer({
          id: DRAFT,
          type: "line",
          source: DRAFT,
          paint: {
            "line-color": SHAPE_COLOR,
            "line-width": 2,
            "line-dasharray": [2, 1],
          },
        });

        map.addSource(VERTICES, { type: "geojson", data: EMPTY as never });
        map.addLayer({
          id: VERTICES,
          type: "circle",
          source: VERTICES,
          paint: {
            "circle-radius": ["case", ["get", "first"], 7, 5],
            "circle-color": "#FFFFFF",
            "circle-stroke-color": SHAPE_COLOR,
            "circle-stroke-width": 2,
          },
        });
        setIsReady(true);
      });

      map.on("click", (event: MapMouseEvent) => {
        const state = latest.current;
        if (state.mode !== "custom") return;

        if (!state.draft.length) {
          const [hit] = map.queryRenderedFeatures(event.point, {
            layers: [`${SHAPES}-fill`],
          });
          if (hit) {
            const { properties } = hit as {
              properties?: Record<string, unknown>;
            };
            state.onSelect(Number(properties?.index));
            return;
          }
          // Com um polígono aberto, o clique fora só fecha os detalhes.
          if (state.selected !== null) {
            state.onSelect(null);
            return;
          }
        }

        const [first] = state.draft;
        if (first && state.draft.length >= 3) {
          const pixel = map.project(first);
          const distance = Math.hypot(
            pixel.x - event.point.x,
            pixel.y - event.point.y,
          );
          if (distance <= CLOSE_TOLERANCE_PX) {
            state.onCloseShape();
            return;
          }
        }
        state.onAddPoint([event.lngLat.lng, event.lngLat.lat]);
      });

      // Mãozinha sobre os polígonos quando o clique os seleciona.
      map.on("mousemove", (event: MapMouseEvent) => {
        const state = latest.current;
        if (state.mode !== "custom" || state.draft.length) return;
        const over = map.queryRenderedFeatures(event.point, {
          layers: [`${SHAPES}-fill`],
        }).length;
        map.getCanvas().style.cursor = over ? "pointer" : "crosshair";
      });

      mapRef.current = map;
    });

    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Área do KMZ: desenha e enquadra quando muda.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    setKmzData(map, KMZ, coverage);
    const bounds = boundsOf(coverage);
    if (bounds)
      map.fitBounds(bounds, { padding: 32, maxZoom: 14, duration: 0 });
  }, [coverage, isReady]);

  // Desenho: polígonos fechados, linha em andamento e vértices.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    const custom = mode === "custom";
    (map.getSource(SHAPES) as GeoJSONSource | undefined)?.setData(
      shapesCollection(custom ? shapes : [], selected) as never,
    );
    (map.getSource(DRAFT) as GeoJSONSource | undefined)?.setData(
      draftLine(custom ? draft : []) as never,
    );
    (map.getSource(VERTICES) as GeoJSONSource | undefined)?.setData(
      verticesOf(custom ? draft : []) as never,
    );
    map.getCanvas().style.cursor = custom ? "crosshair" : "";
  }, [mode, shapes, draft, selected, isReady]);

  // Localização buscada.
  const focusLng = focus?.longitude ?? null;
  const focusLat = focus?.latitude ?? null;
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || focusLng === null || focusLat === null) return;
    map.flyTo({
      center: [focusLng, focusLat],
      zoom: FOCUS_ZOOM,
      duration: 800,
    });
  }, [focusLng, focusLat, isReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <Flex
        h="470px"
        align="center"
        justify="center"
        direction="column"
        gap="8px"
        bg="#1F2430"
        rounded="12px"
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
    <Box position="relative" h="470px" rounded="12px" overflow="hidden">
      <Box
        ref={containerRef}
        role="region"
        aria-label={label}
        h="full"
        w="full"
        bg="#1F2430"
      />

      <Flex
        position="absolute"
        top="16px"
        left="16px"
        align="center"
        gap="8px"
        px="12px"
        py="8px"
        bg="white"
        rounded="8px"
        pointerEvents="none"
      >
        <Box boxSize="6px" rounded="full" bg="#1F5AFF" />
        <Text color="#0F1729" fontSize="12px" fontWeight={600}>
          {t(`SellerOfferCreate.coverageScope.mapMode.${mode}`)}
        </Text>
      </Flex>

      <Flex
        position="absolute"
        top="16px"
        right="16px"
        direction="column"
        gap="6px"
      >
        <Button
          {...controlButton}
          aria-label={t("SellerOfferCreate.coverageScope.zoomIn")}
          onClick={() => mapRef.current?.zoomIn()}
        >
          <Icon as={LuPlus} boxSize="16px" />
        </Button>
        <Button
          {...controlButton}
          aria-label={t("SellerOfferCreate.coverageScope.zoomOut")}
          onClick={() => mapRef.current?.zoomOut()}
        >
          <Icon as={LuMinus} boxSize="16px" />
        </Button>
      </Flex>

      {mode === "custom" && (drawing || shapes.length > 0) && (
        <Button
          position="absolute"
          bottom="16px"
          left="16px"
          h="38px"
          px="14px"
          rounded="18px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          color="#5A6478"
          fontSize="15px"
          fontWeight={600}
          _hover={{ bg: "#F4F6F9" }}
          onClick={drawing ? onCancelDraft : onClear}
        >
          {t(
            drawing
              ? "SellerOfferCreate.coverageScope.cancelDraft"
              : "SellerOfferCreate.coverageScope.redo",
          )}
        </Button>
      )}
    </Box>
  );
}
