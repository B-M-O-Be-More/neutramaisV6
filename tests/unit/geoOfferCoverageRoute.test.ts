import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "seller-token" } : undefined,
  }),
}));

// A env é lida na carga do geoProxy: precisa existir antes do import.
process.env.GEO_API_URL = "https://upstream.test/geo/api/v2";

const { GET } = await import("@/app/api/geo/offerCoverage/[offeringId]/route");

const OFFERING = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";

const call = (offeringId: string) =>
  GET({} as NextRequest, { params: Promise.resolve({ offeringId }) });

describe("BFF GET /api/geo/offerCoverage/{offeringId}", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        `{"message":"","data":{"offeringId":"${OFFERING}","coverageVersionId":"v","publicGeometry":null}}`,
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa a leitura da cobertura da oferta com o Bearer", async () => {
    const response = await call(OFFERING);

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/geo/api/v2/geo/offerCoverage/${OFFERING}`,
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("recusa id que não é UUID sem chamar a geo-api", async () => {
    const response = await call("../coverageArea");

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve o 404 da geo-api (oferta sem vínculo) como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '{"detail":"Offer coverage not found"}',
      headers: { get: () => "application/json" },
    });

    expect((await call(OFFERING)).status).toBe(404);
  });
});
