import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      ({
        access_token: { value: "login-token" },
        profile_access_token: { value: "buyer-token" },
      })[name],
  }),
}));

// A env é lida na carga do marketplaceProxy: precisa existir antes do import.
process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const { GET } =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/checkoutSnapshot/route");

const OFFERING_ID = "1d8f3b6a-4e2c-4f9a-a7d5-3c6e9b1f8a42";
const routeParams = (offeringId: string) => ({
  params: Promise.resolve({ offeringId }),
});

describe("BFF do snapshot de checkout", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response('{"message":"","data":{"schemaVersion":3}}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lê a versão 3 com o token do perfil Buyer", async () => {
    const response = await GET(
      new Request("http://localhost/x"),
      routeParams(OFFERING_ID),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/marketplace/api/v2/productCatalog/productOffering/${OFFERING_ID}/checkoutSnapshot?schemaVersion=3`,
    );
    expect(init.headers.Authorization).toBe("Bearer buyer-token");
  });

  it("recusa um offeringId que não é UUID", async () => {
    const response = await GET(
      new Request("http://localhost/x"),
      routeParams("abc"),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
