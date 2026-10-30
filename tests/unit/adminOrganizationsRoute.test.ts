import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "admin-token" } : undefined,
  }),
}));

// A env é lida na carga do identityProxy: precisa existir antes do import.
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const { GET } = await import("@/app/api/admin/organizations/route");

const call = (query: string) =>
  GET(new NextRequest(`http://localhost/api/admin/organizations${query}`));

describe("BFF GET /api/admin/organizations", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '{"message":"","data":{"items":[],"total":0,"limit":200,"offset":0}}',
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa status, limit e offset com o Bearer, sem outros parâmetros", async () => {
    const response = await call(
      "?status=active&limit=200&offset=400&search=acme",
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://upstream.test/identity/api/v1/admin/organizations?status=active&limit=200&offset=400",
    );
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer admin-token",
    );
  });

  it.each([
    ["status desconhecido", "?status=all"],
    ["limit não numérico", "?limit=abc"],
    ["offset negativo", "?offset=-1"],
  ])("recusa %s sem chamar a identity-api", async (_case, query) => {
    const response = await call(query);

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
