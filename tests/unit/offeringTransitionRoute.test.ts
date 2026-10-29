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

const { POST } =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/[action]/route");

const OFFERING = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";

function call(action: string) {
  return POST(
    new NextRequest(
      `http://localhost/api/productCatalog/productOffering/${OFFERING}/${action}`,
      { method: "POST" },
    ),
    { params: Promise.resolve({ offeringId: OFFERING, action }) },
  );
}

describe("BFF POST /api/productCatalog/productOffering/{id}/{action}", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"message":"Offering published","data":{}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each(["publish", "pause", "unpublish", "archive"])(
    "repassa %s sem body e com o Bearer",
    async (action) => {
      const response = await call(action);

      expect(response.status).toBe(200);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `https://upstream.test/marketplace/api/v2/productCatalog/productOffering/${OFFERING}/${action}`,
      );
      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
      expect(init.headers.Authorization).toBe("Bearer seller-token");
    },
  );

  it("recusa ação desconhecida sem chamar a marketplace-api", async () => {
    const response = await call("delete");

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve o conflito do upstream (ex.: falta cobertura) como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        '{"message":"Coverage required","data":null,"metadata":{"code":"MKT_OFFER_COVERAGE_REQUIRED"}}',
      headers: { get: () => "application/json" },
    });

    const response = await call("publish");

    expect(response.status).toBe(409);
    expect((await response.json()).metadata.code).toBe(
      "MKT_OFFER_COVERAGE_REQUIRED",
    );
  });
});
