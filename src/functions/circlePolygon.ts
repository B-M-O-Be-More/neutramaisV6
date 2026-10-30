/** Raio médio da Terra em km (WGS84 esférico — suficiente para exibição). */
const EARTH_RADIUS_KM = 6371.0088;

export interface CirclePolygon {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Polígono GeoJSON aproximando o círculo de `radiusKm` em volta do ponto
 * [longitude, latitude] — para desenhar o raio de atendimento no mapa.
 * Usa o ponto de destino por rumo e distância na esfera, então o círculo
 * continua redondo no chão (no Mercator ele se alonga perto dos polos).
 */
export function circlePolygon(
  [longitude, latitude]: [number, number],
  radiusKm: number,
  steps = 64,
): CirclePolygon {
  const angular = radiusKm / EARTH_RADIUS_KM;
  const lat1 = toRadians(latitude);
  const lng1 = toRadians(longitude);

  const ring: [number, number][] = [];
  for (let index = 0; index < steps; index += 1) {
    const bearing = (2 * Math.PI * index) / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
        Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
        Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
      );
    ring.push([toDegrees(lng2), toDegrees(lat2)]);
  }
  // GeoJSON exige o anel fechado: o último ponto repete o primeiro.
  ring.push(ring[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}
