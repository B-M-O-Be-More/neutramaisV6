import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "profile_access_token"
        ? { value: "buyer-profile-token" }
        : name === "access_token"
          ? { value: "login-token" }
          : undefined,
  }),
}));

// A env é lida na carga do proxy: precisa existir antes do import.
process.env.CONTRACTS_API_URL = "https://upstream.test/contracts/api/v2";

const { GET: LIST } = await import("@/app/api/contracts/route");
const { GET: READ } = await import("@/app/api/contracts/[contractId]/route");
const { GET: DOCUMENT } =
  await import("@/app/api/contracts/[contractId]/document/route");
const { POST: SIGN } =
  await import("@/app/api/contracts/[contractId]/sign/route");

const CONTRACT_ID = "dedd879c-5f6c-4d03-9e52-9eedf797ace6";
const ORDER_ID = "bf382907-ac5c-4f4b-8879-3d1fbfa7b905";
const UPSTREAM = "https://upstream.test/contracts/api/v2/order-contracts";

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost"));
const params = (contractId: string) => ({
  params: Promise.resolve({ contractId }),
});
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("BFF dos contratos de pedido (contracts-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(json({ items: [], total: 0, page: 1, size: 20 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("lista com o token do perfil e embrulha a resposta sem envelope", async () => {
    const response = await LIST(
      request(`/api/contracts?orderId=${ORDER_ID}&page=2&size=100`),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "ok",
      data: { items: [], total: 0, page: 1, size: 20 },
      metadata: {},
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${UPSTREAM}?orderId=${ORDER_ID}&page=2&size=100`);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer buyer-profile-token");
  });

  it.each(["orderId=123", "page=0", "size=101", "size=dez"])(
    "recusa %s sem chamar a API",
    async (query) => {
      const response = await LIST(request(`/api/contracts?${query}`));

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("lê um contrato e recusa ID que não é UUID", async () => {
    fetchMock.mockResolvedValue(json({ contractId: CONTRACT_ID }));

    const ok = await READ(request("/"), params(CONTRACT_ID));
    expect((await ok.json()).data).toEqual({ contractId: CONTRACT_ID });
    expect(fetchMock.mock.calls[0][0]).toBe(`${UPSTREAM}/${CONTRACT_ID}`);

    const invalid = await READ(request("/"), params("CTR-2026-001"));
    expect(invalid.status).toBe(422);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("assina com POST e sem corpo", async () => {
    fetchMock.mockResolvedValue(
      json({
        status: "awaiting_signatures",
        signingUrl: "https://assina.ae/Xk7pQ2mR",
        documentHash: "abc",
      }),
    );

    const response = await SIGN(request("/"), params(CONTRACT_ID));

    expect((await response.json()).data.signingUrl).toBe(
      "https://assina.ae/Xk7pQ2mR",
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${UPSTREAM}/${CONTRACT_ID}/sign`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
  });

  it("repassa o PDF com o ETag e sem cache", async () => {
    fetchMock.mockResolvedValue(
      new Response("%PDF-1.4", {
        status: 200,
        headers: { "Content-Type": "application/pdf", ETag: '"abc"' },
      }),
    );

    const response = await DOCUMENT(request("/"), params(CONTRACT_ID));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("%PDF-1.4");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("ETag")).toBe('"abc"');
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${UPSTREAM}/${CONTRACT_ID}/document`,
    );
  });

  it("preserva o erro da API com o detail", async () => {
    fetchMock.mockResolvedValue(
      json({ detail: "Signer identity already bound" }, 409),
    );

    const response = await SIGN(request("/"), params(CONTRACT_ID));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      detail: "Signer identity already bound",
    });
  });

  it("troca o 403 em HTML do gateway por indisponível", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>403 Forbidden</html>", {
        status: 403,
        headers: { "Content-Type": "text/html" },
      }),
    );

    const response = await LIST(request("/api/contracts"));

    expect(response.status).toBe(503);
    expect((await response.json()).errors[0].code).toBe(
      "CONTRACTS_API_UNAVAILABLE",
    );
  });

  it("500 em texto da API vira falha da API, não do gateway", async () => {
    fetchMock.mockResolvedValue(
      new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );

    const response = await LIST(request("/api/contracts"));

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.errors[0].code).toBe("CONTRACTS_API_ERROR");
    expect(body.message).toBe(
      "A contracts-api falhou ao responder (HTTP 500).",
    );
  });
});
