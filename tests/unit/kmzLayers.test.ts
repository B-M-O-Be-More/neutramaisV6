import type { Map as MapboxMap } from "mapbox-gl";
import { describe, expect, it, vi } from "vitest";

import {
  addKmzLayers,
  KMZ_CLUSTER_MAX_ZOOM,
  KMZ_COLORS,
  kmzGeometryKinds,
  setKmzData,
  splitKmzPoints,
} from "@/functions/kmzLayers";

const feature = (geometry: unknown) => ({
  type: "Feature",
  properties: {},
  geometry,
});

function fakeMap() {
  const sources: Record<string, { setData: ReturnType<typeof vi.fn> }> = {};
  const map = {
    addSource: vi.fn((id: string) => {
      sources[id] = { setData: vi.fn() };
    }),
    addLayer: vi.fn(),
    on: vi.fn(),
    getSource: (id: string) => sources[id],
  };
  return { map, sources, mapbox: map as unknown as MapboxMap };
}

describe("kmzLayers", () => {
  it("pinta manchas de vermelho, linhas de laranja e pontos de verde", () => {
    const { map, mapbox } = fakeMap();
    addKmzLayers(mapbox, "kmz");

    const layers = map.addLayer.mock.calls.map(([layer]) => layer);
    const byId = Object.fromEntries(layers.map((layer) => [layer.id, layer]));

    expect(byId["kmz-fill"].paint["fill-color"]).toBe("#CC0000");
    expect(byId["kmz-outline"].paint["line-color"]).toBe("#CC0000");
    expect(byId["kmz-line"].paint["line-color"]).toBe(KMZ_COLORS.line);
    expect(byId["kmz-point"].paint["circle-color"]).toBe(KMZ_COLORS.point);
    // Cada camada só pega o seu tipo de geometria.
    expect(byId["kmz-fill"].filter[2]).toEqual(["Polygon", "MultiPolygon"]);
    expect(byId["kmz-line"].filter[2]).toEqual([
      "LineString",
      "MultiLineString",
    ]);
  });

  it("agrupa os pontos conforme o zoom, numa fonte própria", () => {
    const { map, mapbox } = fakeMap();
    addKmzLayers(mapbox, "kmz");

    expect(map.addSource).toHaveBeenCalledWith(
      "kmz-points",
      expect.objectContaining({
        cluster: true,
        clusterMaxZoom: KMZ_CLUSTER_MAX_ZOOM,
      }),
    );
    // A fonte de linhas e manchas não tem cluster (sumiriam).
    expect(map.addSource.mock.calls[0]).toEqual([
      "kmz",
      expect.not.objectContaining({ cluster: true }),
    ]);

    const byId = Object.fromEntries(
      map.addLayer.mock.calls.map(([layer]) => [layer.id, layer]),
    );
    expect(byId["kmz-cluster"].source).toBe("kmz-points");
    expect(byId["kmz-cluster"].filter).toEqual(["has", "point_count"]);
    expect(byId["kmz-cluster-count"].layout["text-field"]).toEqual([
      "get",
      "point_count_abbreviated",
    ]);
    expect(byId["kmz-point"].filter).toEqual(["!", ["has", "point_count"]]);
    // Sem `expandOnClick` (mapa de desenho), o clique fica livre.
    expect(map.on).not.toHaveBeenCalled();
  });

  it("clicar num grupo aproxima até ele se abrir", () => {
    const { map, mapbox, sources } = fakeMap();
    const easeTo = vi.fn();
    Object.assign(map, { easeTo });
    addKmzLayers(mapbox, "kmz", { expandOnClick: true });
    const getClusterExpansionZoom = vi.fn(
      (_id: number, callback: (error: null, zoom: number) => void) =>
        callback(null, 9),
    );
    Object.assign(sources["kmz-points"], { getClusterExpansionZoom });

    const [, , onClick] = map.on.mock.calls.find(
      ([event, layer]) => event === "click" && layer === "kmz-cluster",
    )!;
    onClick({
      features: [
        {
          properties: { cluster_id: 7 },
          geometry: { type: "Point", coordinates: [-38, -4] },
        },
      ],
    });

    expect(getClusterExpansionZoom).toHaveBeenCalledWith(
      7,
      expect.any(Function),
    );
    expect(easeTo).toHaveBeenCalledWith({ center: [-38, -4], zoom: 9 });
  });

  it("separa os pontos (inclusive de MultiPoint e GeometryCollection) do resto", () => {
    const line = {
      type: "LineString",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    };
    const { shapes, points } = splitKmzPoints({
      type: "FeatureCollection",
      features: [
        {
          ...feature({ type: "Point", coordinates: [1, 2] }),
          properties: { name: "POP" },
        },
        feature(line),
        feature({
          type: "MultiPoint",
          coordinates: [
            [3, 4],
            [5, 6],
          ],
        }),
        feature({
          type: "GeometryCollection",
          geometries: [{ type: "Point", coordinates: [7, 8] }, line],
        }),
      ],
    });

    expect(points.features.map((item) => item.geometry)).toEqual([
      { type: "Point", coordinates: [1, 2] },
      { type: "Point", coordinates: [3, 4] },
      { type: "Point", coordinates: [5, 6] },
      { type: "Point", coordinates: [7, 8] },
    ]);
    expect(points.features[0].properties).toEqual({ name: "POP" });
    expect(shapes.features.map((item) => item.geometry)).toEqual([line, line]);
  });

  it("setKmzData manda linhas e manchas para uma fonte e pontos para a outra", () => {
    const { mapbox, sources } = fakeMap();
    addKmzLayers(mapbox, "kmz");

    setKmzData(mapbox, "kmz", {
      type: "FeatureCollection",
      features: [feature({ type: "Point", coordinates: [1, 2] })],
    });
    expect(sources.kmz.setData.mock.calls[0][0].features).toHaveLength(0);
    expect(
      sources["kmz-points"].setData.mock.calls[0][0].features,
    ).toHaveLength(1);

    setKmzData(mapbox, "kmz", null);
    expect(
      sources["kmz-points"].setData.mock.calls[1][0].features,
    ).toHaveLength(0);
  });

  it("identifica os tipos de geometria do KMZ", () => {
    expect(kmzGeometryKinds(null).size).toBe(0);
    expect([
      ...kmzGeometryKinds({
        type: "FeatureCollection",
        features: [
          feature({ type: "Point", coordinates: [0, 0] }),
          feature({
            type: "GeometryCollection",
            geometries: [
              {
                type: "MultiLineString",
                coordinates: [
                  [
                    [0, 0],
                    [1, 1],
                  ],
                ],
              },
            ],
          }),
        ],
      }),
    ]).toEqual(["point", "line"]);
  });
});
