import type { PublicGeometry } from "@/functions/geoShapes";

/**
 * GeoJSON da cobertura (FeatureCollection, Feature ou geometria). Tipado de
 * forma aberta: a geo-api devolve o objeto pronto e o mapa só o repassa ao
 * Mapbox.
 */
export type CoverageGeoJson = { type: string } & Record<string, unknown>;

/** Ponto de atendimento (endereço escolhido) e o raio em volta dele. */
export interface CoverageMapLocation {
  longitude: number;
  latitude: number;
  /** Raio em km; desenha um círculo em volta do pin. */
  radiusKm?: number | null;
}

export interface CoverageMapProps {
  /** Área coberta; null mostra só o mapa base. */
  geometry: CoverageGeoJson | null;
  /** Pins dos endereços de atendimento, cada um com seu raio. */
  locations?: CoverageMapLocation[];
  /** Recorte público da cobertura ("Cobertura editada"), em azul. */
  publicGeometry?: PublicGeometry | null;
  /** Altura do mapa. Padrão: 220px. */
  height?: string;
  /** Rótulo acessível do mapa. */
  label: string;
}
