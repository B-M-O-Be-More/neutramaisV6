import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "admin-token" } : undefined,
  }),
}));

process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const { GET } =
  await import("@/app/api/admin/sanctions/matches/[organizationId]/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

function call(organizationId: string) {
  return GET(
    new NextRequest(
      `http://localhost/api/admin/sanctions/matches/${organizationId}`,
    ),
    { params: Promise.resolve({ organizationId }) },
  );
}

describe("BFF GET /api/admin/sanctions/matches/{organizationId}", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          message: "",
          data: {
            matches: [
              {
                check_log_id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
                source: "ofac",
                matched: true,
                match_score: 100,
                stale: false,
                disposition: "pending_review",
                checked_at: "2026-10-21T13:45:11Z",
              },
            ],
          },
          metadata: null,
        }),
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("consulta a identity-api com o Bearer e devolve as ocorrências", async () => {
    const response = await call(ORGANIZATION);

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/identity/api/v1/admin/sanctions/matches/${ORGANIZATION}`,
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer admin-token");
    expect((await response.json()).data.matches[0].source).toBe("ofac");
  });

  it("recusa id que não é UUID sem chamar a identity-api", async () => {
    const response = await call("../../users");

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
