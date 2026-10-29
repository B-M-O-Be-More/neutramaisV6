import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// O token é lido na carga do módulo: cada teste reimporta com o ambiente certo.
async function loadService(token: string | undefined) {
  vi.resetModules();
  if (token === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  else process.env.NEXT_PUBLIC_MAPBOX_TOKEN = token;
  return import("@/services/mapboxGeocoding.service");
}

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

describe("mapboxGeocodingService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "feature-1",
            geometry: { coordinates: [-38.5, -3.7] },
            properties: {
              mapbox_id: "addr-1",
              full_address: "Av. Dom Luís, 300, Fortaleza - CE",
              coordinates: { longitude: -38.4931, latitude: -3.7375 },
            },
          },
          {
            id: "place-1",
            geometry: { coordinates: [-38.54, -3.72] },
            properties: { name: "Fortaleza", place_formatted: "Ceará, Brasil" },
          },
          // Sem coordenadas: descartado.
          { id: "broken", properties: { full_address: "Sem ponto" } },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    } else {
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ORIGINAL_TOKEN;
    }
  });

  it("busca no Brasil, em português, e converte as sugestões", async () => {
    const { mapboxGeocodingService } = await loadService("pk.test");

    const results = await mapboxGeocodingService.search("Av Dom Luis");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      "https://api.mapbox.com/search/geocode/v6/forward",
    );
    expect(url.searchParams.get("q")).toBe("Av Dom Luis");
    expect(url.searchParams.get("access_token")).toBe("pk.test");
    expect(url.searchParams.get("country")).toBe("br");
    expect(url.searchParams.get("language")).toBe("pt");
    expect(url.searchParams.get("autocomplete")).toBe("true");

    expect(results).toEqual([
      {
        id: "addr-1",
        label: "Av. Dom Luís, 300, Fortaleza - CE",
        longitude: -38.4931,
        latitude: -3.7375,
      },
      {
        id: "place-1",
        label: "Fortaleza, Ceará, Brasil",
        longitude: -38.54,
        latitude: -3.72,
      },
    ]);
  });

  it("falha quando o Mapbox responde erro", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    const { mapboxGeocodingService } = await loadService("pk.test");

    await expect(mapboxGeocodingService.search("Fortaleza")).rejects.toThrow(
      "401",
    );
  });

  it("sem token, fica indisponível e não chama o Mapbox", async () => {
    const { mapboxGeocodingService, GeocodingUnavailableError } =
      await loadService(undefined);

    expect(mapboxGeocodingService.isAvailable()).toBe(false);
    await expect(mapboxGeocodingService.search("Fortaleza")).rejects.toThrow(
      GeocodingUnavailableError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
