import { NextRequest } from "next/server";
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

// Nada do identityProxy é mockado de propósito: o objetivo é justamente provar
// o header que sai na ponta, atravessando rota → forwardToIdentity → fetch.
const { POST } =
  await import("@/app/api/organizations/[orgId]/kyc/submit/route");

const ORG_ID = "019ff71b-a3c3-71e0-89af-a613b08f3ddf";
const CONFIRM_TOKEN = "OhDmalA75QBiUyCdpxPuhtkEgzTCsyyLr4XYBHEdGAA.2580fc67";
const ACCESS_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz";

const ARTIFACTS = [
  {
    document_type: "bank_proof",
    kyc_level_supported: "verified",
    s3_reference: "kyc/org/bank_proof/abc",
    content_hash: "0".repeat(64),
    mime_type: "application/pdf",
  },
];

const params = Promise.resolve({ orgId: ORG_ID });

function request(body?: unknown): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/organizations/${ORG_ID}/kyc/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
}

describe("POST /api/organizations/{orgId}/kyc/submit — Authorization de saída", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = {};
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "{}",
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  function outgoing() {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return { url, headers: init.headers as Record<string, string>, init };
  }

  it("manda o Bearer do token de confirmação quando não há sessão", async () => {
    jar.email_confirm_token = CONFIRM_TOKEN;

    await POST(request({ artifacts: ARTIFACTS }), { params });

    const { url, headers, init } = outgoing();
    expect(url).toBe(
      `https://upstream.test/identity/api/v1/organizations/${ORG_ID}/kyc/submit`,
    );
    expect(headers.Authorization).toBe(`Bearer ${CONFIRM_TOKEN}`);
    // E o lote sobe inteiro no corpo, no formato de artefato.
    expect(JSON.parse(init.body as string)).toEqual({ artifacts: ARTIFACTS });
  });

  it("manda o Bearer da sessão quando ela existe", async () => {
    jar.access_token = ACCESS_TOKEN;
    jar.email_confirm_token = CONFIRM_TOKEN;

    await POST(request({ artifacts: ARTIFACTS }), { params });

    expect(outgoing().headers.Authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it("OMITE o header quando não há sessão nem token de confirmação", async () => {
    await POST(request({ artifacts: ARTIFACTS }), { params });

    expect(outgoing().headers).not.toHaveProperty("Authorization");
  });
});
