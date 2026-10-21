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

const { POST } = await import("@/app/api/admin/sanctions/run/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/admin/sanctions/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("BFF POST /api/admin/sanctions/run", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          message: "",
          data: {
            organization_id: ORGANIZATION,
            screening_run_id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
            is_clean: true,
            checked_at: "2026-10-21T13:45:11Z",
          },
          errors: null,
          metadata: null,
        }),
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa só o organization_id para o Identity, com o Bearer da sessão", async () => {
    const response = await POST(
      request({ organization_id: ORGANIZATION, extra: "descartado" }),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://upstream.test/identity/api/v1/admin/sanctions/run",
    );
    expect(JSON.parse(init.body as string)).toEqual({
      organization_id: ORGANIZATION,
    });
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer admin-token",
    );
  });

  it("recusa organization_id que não é UUID sem chamar o upstream", async () => {
    const response = await POST(request({ organization_id: "../../x" }));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
