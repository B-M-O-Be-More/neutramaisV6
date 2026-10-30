import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "seller-token" } : undefined,
  }),
}));

process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const offeringRoute =
  await import("@/app/api/productCatalog/productOffering/route");
const coverageRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/coverageVersion/route");
const promotionRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/promotion/route");
const detailRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/route");
const specificationRoute =
  await import("@/app/api/productCatalog/productSpecification/route");

const UPSTREAM = "https://upstream.test/marketplace/api/v2/productCatalog";
const OFFERING = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";
const VERSION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
  });
}

const params = (offeringId: string) => ({
  params: Promise.resolve({ offeringId }),
});

describe("BFF da publicação de oferta", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => '{"message":"","data":{}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const sent = () => {
    const [url, init] = fetchMock.mock.calls[0];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
  };

  it("POST productOffering repassa só os campos do contrato (sem isPublic)", async () => {
    await offeringRoute.POST(
      jsonRequest("/api/productCatalog/productOffering", "POST", {
        name: "Link",
        specificationId: "spec-1",
        monthlyPrice: "100.00",
        metadata: { description: "x" },
        isPublic: true,
        organizationId: "outra-org",
      }),
    );

    const { url, init, body } = sent();
    expect(url).toBe(`${UPSTREAM}/productOffering`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
    expect(body).toEqual({
      name: "Link",
      specificationId: "spec-1",
      monthlyPrice: "100.00",
      metadata: { description: "x" },
    });
  });

  it("POST productOffering repassa o tipo e o pacote de envio do produto físico", async () => {
    const shipping = {
      weightKg: 1.25,
      heightCm: 10,
      widthCm: 25.5,
      lengthCm: 30,
      originPostalCode: "01310100",
    };
    await offeringRoute.POST(
      jsonRequest("/api/productCatalog/productOffering", "POST", {
        name: "Roteador CPE",
        specificationId: "spec-1",
        monthlyPrice: "100.00",
        productType: "physical",
        shipping,
      }),
    );

    expect(sent().body).toMatchObject({ productType: "physical", shipping });
  });

  it("PATCH productOffering repassa o pacote de envio, mas não o tipo", async () => {
    await detailRoute.PATCH(
      jsonRequest(`/api/productCatalog/productOffering/${OFFERING}`, "PATCH", {
        shipping: { weightKg: 2 },
        productType: "service",
      }),
      params(OFFERING),
    );

    expect(sent().body).toEqual({ shipping: { weightKg: 2 } });
  });

  it("POST productSpecification repassa nome e descrição", async () => {
    await specificationRoute.POST(
      jsonRequest("/api/productCatalog/productSpecification", "POST", {
        name: "Conectividade",
        catalogId: "ignorado",
      }),
    );

    const { url, body } = sent();
    expect(url).toBe(`${UPSTREAM}/productSpecification`);
    expect(body).toEqual({ name: "Conectividade" });
  });

  it("PUT coverageVersion vincula a versão e recusa ids que não são UUID", async () => {
    await coverageRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
        "PUT",
        { coverageVersionId: VERSION, extra: 1 },
      ),
      params(OFFERING),
    );

    const { url, init, body } = sent();
    expect(url).toBe(`${UPSTREAM}/productOffering/${OFFERING}/coverageVersion`);
    expect(init.method).toBe("PUT");
    expect(body).toEqual({ coverageVersionId: VERSION });

    fetchMock.mockClear();
    const invalid = await coverageRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
        "PUT",
        { coverageVersionId: "abc" },
      ),
      params(OFFERING),
    );
    expect(invalid.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PUT coverageVersion com publicGeometry null vale o KMZ inteiro (vai sem o campo)", async () => {
    await coverageRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
        "PUT",
        { coverageVersionId: VERSION, publicGeometry: null },
      ),
      params(OFFERING),
    );
    expect(sent().body).toEqual({ coverageVersionId: VERSION });
  });

  it("PUT coverageVersion repassa as localidades (coverageNetworkPoints) e recusa as inválidas", async () => {
    const coverageNetworkPoints = [
      { longitude: -46.655, latitude: -23.56, radiusMeters: 800 },
      { longitude: -46.635, latitude: -23.54, radiusMeters: 1500 },
    ];
    const put = (body: unknown) =>
      coverageRoute.PUT(
        jsonRequest(
          `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
          "PUT",
          body,
        ),
        params(OFFERING),
      );

    await put({ coverageVersionId: VERSION, coverageNetworkPoints });
    expect(sent().body).toEqual({
      coverageVersionId: VERSION,
      coverageNetworkPoints,
    });

    // Lista vazia apaga as localidades: vai como veio.
    fetchMock.mockClear();
    await put({ coverageVersionId: VERSION, coverageNetworkPoints: [] });
    expect(sent().body).toEqual({
      coverageVersionId: VERSION,
      coverageNetworkPoints: [],
    });

    fetchMock.mockClear();
    for (const invalid of [
      "pontos",
      [{ longitude: -46.6, latitude: -23.5 }],
      [{ longitude: -46.6, latitude: -91, radiusMeters: 800 }],
      [{ longitude: -46.6, latitude: -23.5, radiusMeters: 80_001 }],
      Array.from({ length: 11 }, () => coverageNetworkPoints[0]),
    ]) {
      const response = await put({
        coverageVersionId: VERSION,
        coverageNetworkPoints: invalid,
      });
      expect(response.status).toBe(422);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PUT coverageVersion repassa várias áreas num MultiPolygon", async () => {
    const square = (x: number, y: number) => [
      [
        [x, y],
        [x + 0.01, y],
        [x + 0.01, y + 0.01],
        [x, y + 0.01],
        [x, y],
      ],
    ];
    const multi = {
      type: "MultiPolygon",
      coordinates: [square(-46.66, -23.565), square(-46.64, -23.545)],
    };
    await coverageRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
        "PUT",
        { coverageVersionId: VERSION, publicGeometry: multi },
      ),
      params(OFFERING),
    );
    expect(sent().body).toEqual({
      coverageVersionId: VERSION,
      publicGeometry: multi,
    });
  });

  it("PUT coverageVersion repassa o publicGeometry válido e recusa o inválido", async () => {
    const polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-38.5, -3.7],
          [-38.4, -3.7],
          [-38.4, -3.8],
          [-38.5, -3.7],
        ],
      ],
    };
    await coverageRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
        "PUT",
        { coverageVersionId: VERSION, publicGeometry: polygon },
      ),
      params(OFFERING),
    );
    expect(sent().body).toEqual({
      coverageVersionId: VERSION,
      publicGeometry: polygon,
    });

    fetchMock.mockClear();
    for (const publicGeometry of [
      { type: "Polygon" },
      { type: "Point", coordinates: [0, 0] },
      {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      },
      // Anel aberto: o último ponto não repete o primeiro.
      {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        ],
      },
    ]) {
      const invalid = await coverageRoute.PUT(
        jsonRequest(
          `/api/productCatalog/productOffering/${OFFERING}/coverageVersion`,
          "PUT",
          { coverageVersionId: VERSION, publicGeometry },
        ),
        params(OFFERING),
      );
      expect(invalid.status).toBe(422);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PUT promotion só aceita isPromoted booleano", async () => {
    await promotionRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/promotion`,
        "PUT",
        { isPromoted: true, extra: 1 },
      ),
      params(OFFERING),
    );
    expect(sent().body).toEqual({ isPromoted: true });

    fetchMock.mockClear();
    const invalid = await promotionRoute.PUT(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}/promotion`,
        "PUT",
        { isPromoted: "sim" },
      ),
      params(OFFERING),
    );
    expect(invalid.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET e PATCH do detalhe: repassa só os campos editáveis e valida o id", async () => {
    await detailRoute.GET(
      jsonRequest(
        `/api/productCatalog/productOffering/${OFFERING}`,
        "GET",
        undefined,
      ),
      params(OFFERING),
    );
    expect(sent().url).toBe(`${UPSTREAM}/productOffering/${OFFERING}`);
    expect(sent().init.method).toBe("GET");

    fetchMock.mockClear();
    await detailRoute.PATCH(
      jsonRequest(`/api/productCatalog/productOffering/${OFFERING}`, "PATCH", {
        name: "Link 1G",
        monthlyPrice: "1890.00",
        metadata: { description: "x" },
        isPublic: true,
        organizationId: "outra-org",
      }),
      params(OFFERING),
    );
    expect(sent().init.method).toBe("PATCH");
    expect(sent().body).toEqual({
      name: "Link 1G",
      monthlyPrice: "1890.00",
      metadata: { description: "x" },
    });

    fetchMock.mockClear();
    const invalid = await detailRoute.PATCH(
      jsonRequest("/api/productCatalog/productOffering/abc", "PATCH", {
        name: "x",
      }),
      params("abc"),
    );
    expect(invalid.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
