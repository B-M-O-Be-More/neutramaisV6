import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "login-token" } : undefined,
  }),
}));

// A env é lida na carga do walletProxy: precisa existir antes do import.
process.env.WALLET_API_URL = "https://upstream.test/wallet/api/v2";

const { GET: getBalance } = await import("@/app/api/wallet/balance/route");
const { GET: getTransactions } =
  await import("@/app/api/wallet/transactions/route");

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost"));

function upstream(status: number, body: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    headers: { get: () => null },
  };
}

describe("BFF da carteira (wallet-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockResolvedValue(
        upstream(
          200,
          '{"organizationId":"org-1","currency":"BRL","availableMinor":2474403,"reservedMinor":0}',
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lê o saldo com o Bearer e devolve no envelope", async () => {
    const response = await getBalance(request("/api/wallet/balance"));

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/wallet/api/v2/wallet/balance?currency=BRL",
    );
    expect(init.headers.Authorization).toBe("Bearer login-token");
    await expect(response.json()).resolves.toEqual({
      message: "",
      data: {
        organizationId: "org-1",
        currency: "BRL",
        availableMinor: 2474403,
        reservedMinor: 0,
      },
      errors: null,
      metadata: null,
    });
  });

  it("recusa moeda fora da lista sem chamar a wallet-api", async () => {
    const response = await getBalance(
      request("/api/wallet/balance?currency=BTC"),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa o erro da wallet-api com o status", async () => {
    fetchMock.mockResolvedValue(
      upstream(403, '{"detail":"wallet:read permission required"}'),
    );

    const response = await getBalance(request("/api/wallet/balance"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      detail: "wallet:read permission required",
    });
  });

  it("lista o extrato com limite e cursor", async () => {
    fetchMock.mockResolvedValue(
      upstream(200, '{"items":[],"nextCursor":null}'),
    );

    const response = await getTransactions(
      request("/api/wallet/transactions?limit=50&cursor=120"),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://upstream.test/wallet/api/v2/wallet/transactions?currency=BRL&limit=50&cursor=120",
    );
    await expect(response.json()).resolves.toMatchObject({
      data: { items: [], nextCursor: null },
    });
  });

  it.each([["limit=0"], ["limit=101"], ["cursor=abc"], ["currency=GBP"]])(
    "recusa %s no extrato",
    async (query) => {
      const response = await getTransactions(
        request(`/api/wallet/transactions?${query}`),
      );

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("responde 502 quando a wallet-api não responde", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    const response = await getTransactions(request("/api/wallet/transactions"));

    expect(response.status).toBe(502);
  });
});
