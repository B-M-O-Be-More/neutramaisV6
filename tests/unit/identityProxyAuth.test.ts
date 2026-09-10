import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Cookie jar controlado por teste — é dele que o proxy tira o Bearer.
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar[name] === undefined ? undefined : { value: jar[name] },
  }),
}));

// O módulo lê IDENTITY_API_URL na carga, então a env precisa existir ANTES do
// import — do contrário ele curto-circuita em erro de infra e nem chama o fetch.
process.env.IDENTITY_API_URL = "https://upstream.test/identity/api/v1";

const { callIdentity } = await import("@/server/identityProxy");

const ARTIFACTS_PATH =
  "/organizations/019ff71b-a3c3-71e0-89af-a613b08f3ddf/kyc/artifacts";

function headersOfLastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return init.headers as Record<string, string>;
}

describe("identityProxy — Authorization em /kyc/artifacts", () => {
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

  it("anexa o Bearer quando existe o cookie access_token", async () => {
    jar.access_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz";

    await callIdentity({
      method: "POST",
      path: ARTIFACTS_PATH,
      body: { document_type: "bank_proof" },
    });

    expect(headersOfLastCall(fetchMock).Authorization).toBe(
      "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.YWNjZXNz",
    );
  });

  it("um authToken explícito vira o Bearer, sem depender de cookie", async () => {
    // Elo final da cadeia usada no cadastro: /kyc/artifacts lê o token da
    // confirmação de e-mail e o passa aqui como authToken.
    await callIdentity({
      method: "POST",
      path: ARTIFACTS_PATH,
      body: { document_type: "bank_proof" },
      authToken: "OhDmalA75QBiUyCdpxPuhtkEgzTCsyyLr4XYBHEdGAA.2580fc67",
    });

    expect(headersOfLastCall(fetchMock).Authorization).toBe(
      "Bearer OhDmalA75QBiUyCdpxPuhtkEgzTCsyyLr4XYBHEdGAA.2580fc67",
    );
  });

  it("OMITE o header quando não há sessão nem token de confirmação", async () => {
    await callIdentity({
      method: "POST",
      path: ARTIFACTS_PATH,
      body: { document_type: "bank_proof" },
    });

    expect(headersOfLastCall(fetchMock)).not.toHaveProperty("Authorization");
  });
});
