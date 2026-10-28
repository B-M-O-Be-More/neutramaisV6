export const COVERAGE_CITIES = [
  { name: "Nova York", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Bogotá", lat: 4.711, lng: -74.0721 },
  { name: "Londres", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Moscou", lat: 55.7558, lng: 37.6173 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Cidade do Cabo", lat: -33.9249, lng: 18.4241 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Tóquio", lat: 35.6762, lng: 139.6503 },
  { name: "Pequim", lat: 39.9042, lng: 116.4074 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
] as const;

// Pares fixos (índices de COVERAGE_CITIES) para o desenho ser estável entre renderizações.
const ARC_PAIRS: [number, number][] = [
  [2, 0],
  [2, 3],
  [2, 4],
  [2, 9],
  [2, 8],
  [0, 4],
  [0, 1],
  [0, 5],
  [3, 1],
  [4, 6],
  [5, 7],
  [7, 12],
  [12, 11],
  [11, 10],
  [10, 13],
  [9, 8],
  [4, 9],
  [6, 11],
];

export const COVERAGE_ARCS = ARC_PAIRS.map(([from, to]) => ({
  startLat: COVERAGE_CITIES[from].lat,
  startLng: COVERAGE_CITIES[from].lng,
  endLat: COVERAGE_CITIES[to].lat,
  endLng: COVERAGE_CITIES[to].lng,
}));
