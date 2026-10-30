"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  Box,
  CloseButton,
  Dialog,
  Flex,
  Icon,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import type {
  GeoJSONSource,
  IControl,
  LngLatLike,
  Map as MapboxMap,
  MapboxGeoJSONFeature,
  Marker as MapboxMarker,
  PointLike,
  Popup as MapboxPopup,
} from "mapbox-gl";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuMap } from "react-icons/lu";

import { circlePolygon } from "@/functions/circlePolygon";
import { currencyLocale } from "@/functions/currencyLocale";
import { boundsOf, geometryAreaKm2, type LngLat } from "@/functions/geoShapes";
import { addKmzLayers, setKmzData } from "@/functions/kmzLayers";
import { changedLocationIndexes } from "@/functions/locationChanges";
import { mapInfoContent, type MapInfoRow } from "@/functions/mapInfoContent";
import RotatingMessage from "@/components/RotatingMessage";
import { formatCoordinates } from "@/functions/coverageNetworkPoints";

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

// Mensagens do carregamento do KMZ, trocadas a cada 3 s. Depois da última,
// volta para a de arquivos grandes (não repete "Carregando...").
const LOADING_MESSAGES = [
  "SellerOfferCreate.coverage.preview.loading",
  "CoverageMap.loading.download",
  "CoverageMap.loading.read",
  "CoverageMap.loading.draw",
  "CoverageMap.loading.large",
  "CoverageMap.loading.stillWorking",
];
const LOADING_LOOP_FROM = 4;

/**
 * Botão "Expandir mapa" no grupo de controles do Mapbox, com o ícone do
 * controle de tela cheia — mas abre o mapa num modal, não em tela cheia.
 */
function createExpandControl(label: string, onClick: () => void): IControl {
  const container = document.createElement("div");
  return {
    onAdd: () => {
      container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mapboxgl-ctrl-fullscreen";
      button.title = label;
      button.setAttribute("aria-label", label);
      const icon = document.createElement("span");
      icon.className = "mapboxgl-ctrl-icon";
      icon.setAttribute("aria-hidden", "true");
      button.append(icon);
      button.addEventListener("click", onClick);
      container.append(button);
      return container;
    },
    onRemove: () => container.remove(),
  };
}

const EMPTY_COLLECTION: CoverageGeoJson = {
  type: "FeatureCollection",
  features: [],
};

// Camadas que abrem a leitura ao clicar. O grupo de pontos do KMZ só
// aproxima (kmzLayers): entra aqui para não abrir a área que está por baixo.
const KMZ_CLUSTER_LAYER = `${SOURCE_ID}-cluster`;
const INFO_LAYERS = [
  `${PUBLIC_SOURCE_ID}-fill`,
  `${RADIUS_SOURCE_ID}-fill`,
  `${SOURCE_ID}-point`,
  KMZ_CLUSTER_LAYER,
  `${SOURCE_ID}-fill`,
];

/** Índice na lista original, para a leitura achar o item clicado. */
const INDEX_KEY = "__index";

/**
 * KMZ com o índice de cada feição nas propriedades: o Mapbox devolve a
 * geometria recortada pelos tiles, e a área é calculada sobre a original.
 */
function withFeatureIndex(
  geometry: CoverageGeoJson | null,
): CoverageGeoJson | null {
  if (geometry?.type !== "FeatureCollection") return geometry;
  const features =
    (geometry.features as { properties?: object | null }[] | undefined) ?? [];
  return {
    ...geometry,
    features: features.map((feature, index) => ({
      ...feature,
      properties: { ...feature.properties, [INDEX_KEY]: index },
    })),
  };
}

/** Polígonos do recorte público ("Cobertura editada"). */
function publicPolygons(
  publicGeometry: CoverageMapProps["publicGeometry"],
): LngLat[][][] {
  if (!publicGeometry) return [];
  return publicGeometry.type === "Polygon"
    ? [publicGeometry.coordinates]
    : publicGeometry.coordinates;
}

/** Cada polígono do recorte público vira uma feição, com o seu índice. */
function publicFeatures(publicGeometry: CoverageMapProps["publicGeometry"]) {
  return {
    type: "FeatureCollection",
    features: publicPolygons(publicGeometry).map((coordinates, index) => ({
      type: "Feature",
      properties: { [INDEX_KEY]: index },
      geometry: { type: "Polygon", coordinates },
    })),
  };
}

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
  isLoading = false,
  expandable = true,
}: CoverageMapProps) {
  const { t, i18n } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapboxMap | null>(null);
  const markersRef = React.useRef<MapboxMarker[]>([]);
  // Construtores do Marker e do Popup, guardados do import dinâmico.
  const markerClassRef = React.useRef<typeof MapboxMarker | null>(null);
  const popupClassRef = React.useRef<typeof MapboxPopup | null>(null);
  // Leitura aberta pelo clique numa área ou num raio (uma por vez).
  const popupRef = React.useRef<MapboxPopup | null>(null);
  // O que estava no mapa no último enquadramento: decide se vai até a
  // localidade que mudou ou enquadra tudo.
  const framedRef = React.useRef<{
    geometry: CoverageGeoJson | null;
    publicGeometry: CoverageMapProps["publicGeometry"];
    locations: CoverageMapLocation[];
  } | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const indexedGeometry = React.useMemo(
    () => withFeatureIndex(geometry),
    [geometry],
  );

  const formatNumber = (value: number, digits: number) =>
    new Intl.NumberFormat(currencyLocale(i18n.language), {
      maximumFractionDigits: digits,
    }).format(value);
  const km = (value: number) =>
    t("CoverageMap.info.km", { value: formatNumber(value, 1) });
  const km2 = (value: number) =>
    t("CoverageMap.info.km2", { value: formatNumber(value, 2) });

  // Leitura de uma localidade: endereço, coordenadas e raio.
  const describeLocation = React.useEffectEvent((index: number) => {
    const location = locations[index];
    if (!location) return null;
    const { longitude, latitude, radiusKm, label: address } = location;
    const coordinates = formatCoordinates(longitude, latitude);
    const rows: MapInfoRow[] = [];
    if (address && address !== coordinates) {
      rows.push([t("CoverageMap.info.address"), address]);
    }
    rows.push([t("CoverageMap.info.coordinates"), coordinates]);
    if (radiusKm && radiusKm > 0) {
      rows.push([t("CoverageMap.info.radius"), km(radiusKm)]);
      rows.push([
        t("CoverageMap.info.radiusArea"),
        km2(Math.PI * radiusKm * radiusKm),
      ]);
    }
    return mapInfoContent(
      t("CoverageMap.info.location", { number: index + 1 }),
      rows,
    );
  });

  // Leitura da feição clicada: área pública, raio, ponto ou área do KMZ.
  const describeFeature = React.useEffectEvent(
    (feature: MapboxGeoJSONFeature) => {
      // A feição do Mapbox é uma Feature GeoJSON com a camada de origem.
      const clicked = feature as unknown as {
        layer?: { id?: string };
        properties?: Record<string, unknown> | null;
        geometry?: { coordinates?: unknown };
      };
      const layer = clicked.layer?.id;
      const properties = clicked.properties ?? {};
      const index = Number(properties[INDEX_KEY] ?? -1);
      const name =
        typeof properties.name === "string" && properties.name
          ? properties.name
          : null;

      if (layer === `${RADIUS_SOURCE_ID}-fill`) return describeLocation(index);

      if (layer === `${PUBLIC_SOURCE_ID}-fill`) {
        const polygons = publicPolygons(publicGeometry);
        const polygon = polygons[index];
        if (!polygon) return null;
        return mapInfoContent(
          t("CoverageMap.info.publicArea", {
            number: index + 1,
            total: polygons.length,
          }),
          [
            [
              t("CoverageMap.info.area"),
              km2(geometryAreaKm2({ type: "Polygon", coordinates: polygon })),
            ],
            [
              t("CoverageMap.info.vertices"),
              formatNumber(Math.max(0, (polygon[0]?.length ?? 1) - 1), 0),
            ],
          ],
        );
      }

      if (layer === `${SOURCE_ID}-point`) {
        const [longitude, latitude] = clicked.geometry?.coordinates as LngLat;
        const rows: MapInfoRow[] = [];
        if (name) rows.push([t("CoverageMap.info.name"), name]);
        rows.push([
          t("CoverageMap.info.coordinates"),
          formatCoordinates(longitude, latitude),
        ]);
        return mapInfoContent(t("CoverageMap.info.kmzPoint"), rows);
      }

      if (layer === `${SOURCE_ID}-fill`) {
        const features =
          geometry?.type === "FeatureCollection"
            ? ((geometry.features as unknown[] | undefined) ?? [])
            : [];
        // Sem coleção (geometria solta), a área é a do KMZ inteiro.
        const original = features[index] ?? geometry;
        const rows: MapInfoRow[] = [];
        if (name) rows.push([t("CoverageMap.info.name"), name]);
        rows.push([t("CoverageMap.info.area"), km2(geometryAreaKm2(original))]);
        return mapInfoContent(t("CoverageMap.info.kmzArea"), rows);
      }
      return null;
    },
  );

  // Clique no mapa: abre a leitura da feição de cima, se houver.
  const showInfo = React.useEffectEvent(
    (map: MapboxMap, point: PointLike, lngLat: LngLatLike) => {
      const Popup = popupClassRef.current;
      const [feature] = map.queryRenderedFeatures(point, {
        layers: INFO_LAYERS.filter((id) => map.getLayer(id)),
      });
      if (!Popup || !feature || feature.layer?.id === KMZ_CLUSTER_LAYER) {
        return;
      }
      const content = describeFeature(feature);
      if (!content) return;
      popupRef.current?.remove();
      popupRef.current = new Popup({ maxWidth: "280px" })
        .setLngLat(lngLat)
        .setDOMContent(content)
        .addTo(map);
    },
  );

  // Mapa expandido: abre num modal com 70% da tela.
  const [isExpanded, setExpanded] = React.useState(false);
  // Rótulo do botão de expandir (null sem o botão), lido na criação do mapa.
  const expandLabel = React.useEffectEvent(() =>
    expandable ? t("CoverageMap.expand") : null,
  );
  const openExpanded = React.useEffectEvent(() => setExpanded(true));

  // Cria o mapa uma vez; o import dinâmico evita `window` no SSR.
  React.useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    let cancelled = false;

    import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      markerClassRef.current = mapboxgl.Marker;
      popupClassRef.current = mapboxgl.Popup;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
      // Expandir, abaixo do zoom: abre o mapa num modal (não em tela cheia).
      const expand = expandLabel();
      if (expand) {
        map.addControl(createExpandControl(expand, () => openExpanded()));
      }
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
        // Leitura: clicar numa área, ponto ou raio mostra as informações.
        map.on("click", (event) => showInfo(map, event.point, event.lngLat));
        map.on("mousemove", (event) => {
          const hovering = map.queryRenderedFeatures(event.point, {
            layers: INFO_LAYERS.filter((id) => map.getLayer(id)),
          }).length;
          map.getCanvas().style.cursor = hovering ? "pointer" : "";
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
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, []);

  // Círculos dos raios, com o índice da localidade (para a leitura).
  const circles = React.useMemo<CoverageGeoJson>(
    () => ({
      type: "FeatureCollection",
      features: locations.flatMap(({ longitude, latitude, radiusKm }, index) =>
        radiusKm && radiusKm > 0
          ? [
              {
                ...circlePolygon([longitude, latitude], radiusKm),
                properties: { [INDEX_KEY]: index },
              },
            ]
          : [],
      ),
    }),
    [locations],
  );

  // Cada camada atualiza só quando o seu dado muda: reenviar o KMZ ao Mapbox
  // serializa o GeoJSON inteiro para o worker — feito a cada tecla de um
  // endereço, trava a digitação.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    // A leitura aberta pode ser de algo que mudou.
    popupRef.current?.remove();
    popupRef.current = null;
    setKmzData(map, SOURCE_ID, indexedGeometry);
  }, [indexedGeometry, isReady]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    popupRef.current?.remove();
    popupRef.current = null;
    const publicSource = map.getSource(PUBLIC_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    publicSource?.setData(publicFeatures(publicGeometry) as never);
  }, [publicGeometry, isReady]);

  // Raios e pins das localidades. `locations` deve vir memorizado pelo
  // conteúdo: um array novo a cada render recriaria os pins.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;
    popupRef.current?.remove();
    popupRef.current = null;

    const radiusSource = map.getSource(RADIUS_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    radiusSource?.setData(circles as never);

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    const Marker = markerClassRef.current;
    const Popup = popupClassRef.current;
    if (Marker) {
      markersRef.current = locations.map(({ longitude, latitude }, index) => {
        const marker = new Marker({ color: "#8B5CF6" }).setLngLat([
          longitude,
          latitude,
        ]);
        // O pin abre a própria leitura; o clique não chega ao mapa (que
        // abriria a do raio por baixo).
        const element = marker.getElement();
        element.style.cursor = "pointer";
        element.addEventListener("click", (event) => event.stopPropagation());
        const content = describeLocation(index);
        if (Popup && content) {
          marker.setPopup(
            new Popup({ offset: 28, maxWidth: "280px" }).setDOMContent(content),
          );
        }
        return marker.addTo(map);
      });
    }
  }, [circles, locations, isReady]);

  // Enquadramento. Ao adicionar ou alterar uma localidade, o mapa vai até
  // ela (o círculo do raio inteiro, ou o pin). KMZ ou recorte novos, ou
  // várias localidades de uma vez (as salvas chegando), enquadram tudo.
  // Remover a última mantém a vista.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const previous = framedRef.current;
    framedRef.current = { geometry, publicGeometry, locations };
    const sameAreas =
      !!previous &&
      previous.geometry === geometry &&
      previous.publicGeometry === publicGeometry;

    if (sameAreas) {
      const changed = changedLocationIndexes(previous.locations, locations);
      if (changed.length === 0) return;
      if (changed.length === 1) {
        const index = changed[0];
        const target = locations[index];
        const circle = (
          circles.features as { properties?: Record<string, unknown> }[]
        ).find((feature) => feature.properties?.[INDEX_KEY] === index);
        const circleBounds = circle ? boundsOf(circle) : null;
        if (circleBounds) {
          map.fitBounds(circleBounds, {
            padding: 40,
            maxZoom: 15,
            duration: 600,
          });
        } else {
          map.easeTo({
            center: [target.longitude, target.latitude],
            zoom: LOCATION_ZOOM,
            duration: 600,
          });
        }
        return;
      }
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
  }, [geometry, publicGeometry, circles, locations, isReady]);

  // Sobre o mapa enquanto o KMZ carrega: spinner e mensagens que mudam,
  // para a espera não parecer travada.
  const loadingOverlay = isLoading && (
    <Stack
      role="status"
      aria-live="polite"
      position="absolute"
      inset={0}
      zIndex={2}
      align="center"
      justify="center"
      gap="12px"
      px="24px"
      bg="rgba(15,23,41,0.72)"
      backdropFilter="blur(2px)"
      textAlign="center"
    >
      <Spinner color="#8BA8FF" size="md" borderWidth="2.5px" />
      <RotatingMessage
        messages={LOADING_MESSAGES.map((key) => t(key))}
        loopFrom={LOADING_LOOP_FROM}
        color="#E5E8EE"
        fontSize="12px"
        fontWeight={500}
        lineHeight="18px"
        maxW="280px"
      />
    </Stack>
  );

  if (!MAPBOX_TOKEN) {
    return (
      <Box position="relative" h={height} rounded="4px" overflow="hidden">
        <Flex
          h="full"
          align="center"
          justify="center"
          direction="column"
          gap="8px"
          bg="#1F2430"
          textAlign="center"
          px="24px"
        >
          <Icon as={LuMap} boxSize="20px" color="#8A9AB5" />
          <Text color="#C4CDD8" fontSize="12px" lineHeight="18px">
            {t("CoverageMap.missingToken")}
          </Text>
        </Flex>
        {loadingOverlay}
      </Box>
    );
  }

  // O Mapbox controla os filhos do contêiner do mapa: a sobreposição fica ao
  // lado dele, num invólucro.
  return (
    <Box position="relative" h={height} w="full">
      <Box
        ref={containerRef}
        role="region"
        aria-label={label}
        aria-busy={isLoading || undefined}
        h="full"
        w="full"
        bg="#1F2430"
        overflow="hidden"
      />
      {loadingOverlay}

      {/* Mapa expandido: o mesmo conteúdo num modal centralizado, com 70% da
          largura e da altura da tela (quase toda no celular). */}
      {expandable && (
        <Dialog.Root
          open={isExpanded}
          onOpenChange={(details) => setExpanded(details.open)}
          placement="center"
          lazyMount
          unmountOnExit
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content
                w={{ base: "calc(100vw - 32px)", md: "70vw" }}
                h={{ base: "80dvh", md: "70vh" }}
                maxW="none"
                maxH="none"
                my={0}
                display="flex"
                flexDirection="column"
                bg="white"
                rounded="16px"
                overflow="hidden"
                boxShadow="0px 25px 50px -12px rgba(0,0,0,0.25)"
              >
                <Dialog.Header
                  px="20px"
                  py="14px"
                  pe="56px"
                  borderBottomWidth="1px"
                  borderColor="#E5E8EE"
                >
                  <Dialog.Title
                    color="#0F1729"
                    fontSize="15px"
                    fontWeight={700}
                    lineHeight="22.5px"
                  >
                    {label}
                  </Dialog.Title>
                </Dialog.Header>
                <Dialog.Body p={0} flex="1" minH={0}>
                  <CoverageMap
                    geometry={geometry}
                    locations={locations}
                    publicGeometry={publicGeometry}
                    label={label}
                    isLoading={isLoading}
                    height="100%"
                    expandable={false}
                  />
                </Dialog.Body>
                <Dialog.CloseTrigger asChild top="12px" insetEnd="12px">
                  <CloseButton
                    size="sm"
                    aria-label={t("CoverageMap.collapse")}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Box>
  );
}
