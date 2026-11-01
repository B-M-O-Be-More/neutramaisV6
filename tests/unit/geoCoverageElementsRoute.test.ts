import { NextRequest } from "next/server";
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

const { GET } =
  await import("@/app/api/geo/coverageVersion/[versionId]/elements/route");

const VERSION = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";

const call = (versionId: string, query = "") =>
  GET(
    new NextRequest(
      `http://localhost/api/geo/coverageVersion/${versionId}/elements${query}`,
    ),
    { params: Promise.resolve({ versionId }) },
  );

describe("BFF GET /api/geo/coverageVersion/{versionId}/elements", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        '{"message":"","data":{"items":[],"hasMore":false,"nextCursor":null}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa a página com cursor, limite e simplificação", async () => {
    const response = await call(
      VERSION,
      "?after_index=499&limit=500&tolerance=0.0002&bbox=1,2,3,4",
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    // Só os parâmetros que a tela usa seguem.
    expect(url).toBe(
      `https://upstream.test/geo/api/v2/geo/coverageVersion/${VERSION}/elements?after_index=499&limit=500&tolerance=0.0002`,
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("recusa id e parâmetros inválidos sem chamar a geo-api", async () => {
    for (const [id, query] of [
      ["../kmz", ""],
      [VERSION, "?after_index=-2"],
      [VERSION, "?limit=0"],
      [VERSION, "?limit=501"],
      [VERSION, "?tolerance=2"],
      [VERSION, "?tolerance=abc"],
    ]) {
      expect((await call(id, query)).status).toBe(422);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
