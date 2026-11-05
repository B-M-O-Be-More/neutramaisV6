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

  it("repassa a moeda dos preços (exigida em serviço) e descarta isPublic", async () => {
    await offeringRoute.POST(
      jsonRequest("/api/productCatalog/productOffering", {
        name: "Link",
        specificationId: "spec-1",
        monthlyPrice: "100.00",
        currency: "BRL",
        isPublic: true,
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.currency).toBe("BRL");
    expect(body).not.toHaveProperty("isPublic");
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

  it("token vencido (403 'Invalid access token' sem code) vira 401 para renovar", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () =>
        '{"message":"Invalid access token","data":null,"metadata":{"correlationId":"c-1"}}',
      headers: { get: () => "application/json" },
    });
    const expired = await specificationRoute.GET();
    expect(expired.status).toBe(401);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () =>
        '{"message":"Missing permission","data":null,"metadata":{"code":"MKT_PERMISSION_REQUIRED"}}',
      headers: { get: () => "application/json" },
    });
    const forbidden = await specificationRoute.GET();
    expect(forbidden.status).toBe(403);
  });

  it("repassa categoryId e characteristics ao criar a especificação", async () => {
    await specificationRoute.POST(
      jsonRequest("/api/productCatalog/productSpecification", {
        name: "Infra Física",
        categoryId: "0193a000-0000-7000-8000-000000000c02",
        characteristics: { soldUnit: "port" },
        catalogId: "descartado",
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: "Infra Física",
      categoryId: "0193a000-0000-7000-8000-000000000c02",
      characteristics: { soldUnit: "port" },
    });
  });

  it("lê o catálogo com o token do perfil", async () => {
    await catalogRoute.GET();
    expect(bearer()).toBe("Bearer seller-profile-token");
  });
});
