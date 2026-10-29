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

const { GET: getOrganization } =
  await import("@/app/api/admin/organizations/[organizationId]/route");
const { GET: getMembers } =
  await import("@/app/api/organizations/[orgId]/members/route");

const ORGANIZATION = "018f5d13-c1a7-7f35-84de-92b6c4017a5d";

describe("BFF da página da organização (identity-api)", () => {
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

  it("GET da organização repassa com o Bearer", async () => {
    const response = await getOrganization(
      new NextRequest("http://localhost/api/admin/organizations/x"),
      { params: Promise.resolve({ organizationId: ORGANIZATION }) },
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      `https://upstream.test/identity/api/v1/admin/organizations/${ORGANIZATION}`,
    );
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer admin-token",
    );
  });

  it("GET dos membros repassa com o Bearer", async () => {
    await getMembers(new NextRequest("http://localhost/api/x"), {
      params: Promise.resolve({ orgId: ORGANIZATION }),
    });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `https://upstream.test/identity/api/v1/organizations/${ORGANIZATION}/members`,
    );
  });

  it("recusa id que não é UUID sem chamar a identity-api", async () => {
    const organization = await getOrganization(
      new NextRequest("http://localhost/api/x"),
      { params: Promise.resolve({ organizationId: "../me" }) },
    );
    const members = await getMembers(
      new NextRequest("http://localhost/api/x"),
      {
        params: Promise.resolve({ orgId: "abc" }),
      },
    );

    expect(organization.status).toBe(422);
    expect(members.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve o 403 dos membros de outra organização como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"detail":"Cross-organization access denied"}',
      headers: { get: () => "application/json" },
    });

    const response = await getMembers(new NextRequest("http://localhost/x"), {
      params: Promise.resolve({ orgId: ORGANIZATION }),
    });

    expect(response.status).toBe(403);
  });
});
