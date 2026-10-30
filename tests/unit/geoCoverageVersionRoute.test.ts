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

const { GET } = await import("@/app/api/geo/coverageVersion/[versionId]/route");

const VERSION = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";

const call = (versionId: string) =>
  GET({} as NextRequest, { params: Promise.resolve({ versionId }) });

describe("BFF GET /api/geo/coverageVersion/{versionId}", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `{"message":"","data":{"id":"${VERSION}"}}`,
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa a leitura da versão com o Bearer", async () => {
    const response = await call(VERSION);

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/geo/api/v2/geo/coverageVersion/${VERSION}`,
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("recusa id que não é UUID sem chamar a geo-api", async () => {
    const response = await call("../kmz");

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve o 403 da geo-api como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"detail":"Organization access denied"}',
      headers: { get: () => "application/json" },
    });

    expect((await call(VERSION)).status).toBe(403);
  });
});
