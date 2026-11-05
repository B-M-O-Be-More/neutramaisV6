"use client";

import { Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { MeshPhongMaterial } from "three";

import { COVERAGE_ARCS, COVERAGE_CITIES } from "./cities";

const COUNTRIES_URL = "/assets/countries.geojson";

/**
 * Globo 3D (Globe.gl + Three.js): continentes pontilhados, hubs e arcos
 * tracejados entre as cidades. A biblioteca só é carregada no navegador.
 */
export function CoverageGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Globe }, countries] = await Promise.all([
        import("globe.gl"),
        fetch(COUNTRIES_URL).then((response) => response.json()),
      ]);
      if (disposed) return;

      const globeMaterial = new MeshPhongMaterial({
        color: "#ffffff",
        emissive: "#f5f7fa",
        emissiveIntensity: 0.6,
        shininess: 12,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      const globe = new Globe(container)
        .width(container.clientWidth)
        .height(container.clientHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .globeMaterial(globeMaterial)
        .showAtmosphere(true)
        .atmosphereColor("#4287f5")
        .atmosphereAltitude(0.18)
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.3)
        .hexPolygonCurvatureResolution(10)
        .hexPolygonUseDots(true)
        .hexPolygonColor(() => "#1a2233")
        .pointsData([...COVERAGE_CITIES])
        .pointLat("lat")
        .pointLng("lng")
        .pointColor(() => "#111827")
        .pointAltitude(0.012)
        .pointRadius(0.45)
        .arcsData(COVERAGE_ARCS)
        .arcColor(() => ["#0055ff", "#4287f5"])
        .arcStroke(0.45)
        .arcAltitudeAutoScale(0.45)
        .arcDashLength(0.06)
        .arcDashGap(0.04)
        .arcDashAnimateTime(2000);

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.enablePan = false;

      // Começa sobre as Américas, como na referência.
      globe.pointOfView({ lat: 5, lng: -60, altitude: 4 });

      const resizeObserver = new ResizeObserver(() => {
        globe.width(container.clientWidth).height(container.clientHeight);
      });
      resizeObserver.observe(container);

      cleanup = () => {
        resizeObserver.disconnect();
        globe.pauseAnimation();
        globe._destructor();
        container.replaceChildren();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      role="img"
      aria-label="Globo com continentes pontilhados e rotas de cobertura entre provedores"
      w="full"
      maxW="660px"
      aspectRatio={1.4}
    />
  );
}
