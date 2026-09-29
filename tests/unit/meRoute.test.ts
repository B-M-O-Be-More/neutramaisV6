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

// A env é lida na carga do identityProxy: precisa existir antes do import.
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const { GET } = await import("@/app/api/me/route");

const ACCESS_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz";

describe("GET /api/me", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = {};
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"message":"","data":{"id":"u1"}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("consulta /me com o Bearer do cookie", async () => {
    jar = { access_token: ACCESS_TOKEN };

    const response = await GET();

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://upstream.test/identity/api/v1/me");
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("devolve o 401 do upstream sem sessão", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"message":"Unauthorized","data":null}',
      headers: { get: () => "application/json" },
    });

    const response = await GET();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(response.status).toBe(401);
  });
});
