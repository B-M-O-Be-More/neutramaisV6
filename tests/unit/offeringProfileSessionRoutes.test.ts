import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      ({
        access_token: { value: "login-token" },
        profile_access_token: { value: "seller-profile-token" },
      })[name],
  }),
}));

process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const offeringRoute =
  await import("@/app/api/productCatalog/productOffering/route");
const specificationRoute =
  await import("@/app/api/productCatalog/productSpecification/route");
const catalogRoute = await import("@/app/api/productCatalog/catalog/route");

const jsonRequest = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

// Publicar a oferta (plano → oferta → publicação) vai com o token da sessão
// de perfil Seller, não com o do login.
describe("BFF da publicação de oferta com a sessão de perfil", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"message":"","data":{}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const bearer = () => fetchMock.mock.calls[0][1].headers.Authorization;

  it("cria a oferta com o token do perfil", async () => {
    await offeringRoute.POST(
      jsonRequest("/api/productCatalog/productOffering", {
        name: "Link",
        specificationId: "spec-1",
        monthlyPrice: "100.00",
      }),
    );
    expect(bearer()).toBe("Bearer seller-profile-token");
  });

  it("lê e cria planos com o token do perfil", async () => {
    await specificationRoute.GET();
    expect(bearer()).toBe("Bearer seller-profile-token");

    fetchMock.mockClear();
    await specificationRoute.POST(
      jsonRequest("/api/productCatalog/productSpecification", {
        name: "Conectividade",
      }),
    );
    expect(bearer()).toBe("Bearer seller-profile-token");
  });

  it("lê o catálogo com o token do perfil", async () => {
    await catalogRoute.GET();
    expect(bearer()).toBe("Bearer seller-profile-token");
  });
});
