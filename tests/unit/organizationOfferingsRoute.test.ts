import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Cookie jar controlado por teste — é dele que o BFF tira o Bearer.
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar[name] === undefined ? undefined : { value: jar[name] },
  }),
}));

// A env é lida na carga do marketplaceProxy: precisa existir antes do import.
process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const { GET } = await import("@/app/api/productCatalog/productOffering/route");

const ACCESS_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz";

function request(query = ""): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/productCatalog/productOffering${query}`,
  );
}

describe("GET /api/productCatalog/productOffering", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = {};
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"message":"Offerings retrieved","data":[]}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa só offset e limit e anexa o Bearer do cookie", async () => {
    jar = { access_token: ACCESS_TOKEN };

    const response = await GET(request("?offset=20&limit=10&foo=bar"));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/marketplace/api/v2/productCatalog/productOffering?offset=20&limit=10",
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("sem sessão não envia Authorization e devolve o status do upstream", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"message":"Forbidden","data":null}',
      headers: { get: () => "application/json" },
    });

    const response = await GET(request());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/marketplace/api/v2/productCatalog/productOffering",
    );
    expect(init.headers.Authorization).toBeUndefined();
    expect(response.status).toBe(403);
  });
});
