import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "admin-token" } : undefined,
  }),
}));

// A env é lida na carga do geoProxy: precisa existir antes do import.
process.env.GEO_API_URL = "https://upstream.test/geo/api/v2";

const { GET } =
  await import("@/app/api/geo/organizations/[organizationId]/storage/route");
const { PATCH } =
  await import("@/app/api/geo/organizations/[organizationId]/storage/quota/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

const context = (organizationId: string) => ({
  params: Promise.resolve({ organizationId }),
});

const patchRequest = (body: unknown) =>
  ({ json: async () => body }) as unknown as NextRequest;

describe("BFF da cota de armazenamento (geo-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `{"data":{"organizationId":"${ORGANIZATION}"}}`,
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("GET repassa a leitura com o Bearer", async () => {
    const response = await GET({} as NextRequest, context(ORGANIZATION));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/geo/api/v2/geo/organizations/${ORGANIZATION}/storage`,
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer admin-token");
  });

  it("GET recusa id que não é UUID sem chamar a geo-api", async () => {
    const response = await GET({} as NextRequest, context("../storage"));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PATCH repassa só a cota e o motivo aparado", async () => {
    const response = await PATCH(
      patchRequest({ quotaMb: 512.5, reason: "  Ampliação  ", extra: true }),
      context(ORGANIZATION),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/geo/api/v2/geo/organizations/${ORGANIZATION}/storage/quota`,
    );
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      quotaMb: 512.5,
      reason: "Ampliação",
    });
  });

  it.each([
    ["sem corpo", null],
    ["cota em texto", { quotaMb: "500", reason: "x" }],
    ["sem motivo", { quotaMb: 500 }],
  ])("PATCH recusa %s sem chamar a geo-api", async (_case, body) => {
    const response = await PATCH(patchRequest(body), context(ORGANIZATION));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("PATCH devolve o 403 da geo-api como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"detail":"Neutra administrator required"}',
      headers: { get: () => "application/json" },
    });

    const response = await PATCH(
      patchRequest({ quotaMb: 500, reason: "x" }),
      context(ORGANIZATION),
    );

    expect(response.status).toBe(403);
  });
});
