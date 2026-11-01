import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "profile_access_token"
        ? { value: "seller-profile-token" }
        : name === "access_token"
          ? { value: "login-token" }
          : undefined,
  }),
}));

// A env é lida na carga do proxy: precisa existir antes do import.
process.env.PAYMENT_API_URL = "https://upstream.test/payment/api/v2";

const { GET: RECEIVABLES } =
  await import("@/app/api/payment/seller/receivables/route");
const { GET: DEBTS } =
  await import("@/app/api/payment/seller/shippingCostDebts/route");

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost"));

describe("BFF dos recebimentos do seller (payment-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response('{"data":[]}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  it.each([
    [
      "recebíveis",
      RECEIVABLES,
      "/api/payment/seller/receivables",
      "receivables",
    ],
    [
      "dívidas de frete",
      DEBTS,
      "/api/payment/seller/shippingCostDebts",
      "shippingCostDebts",
    ],
  ])(
    "%s: repassa com o token do perfil Seller",
    async (_case, handler, path, upstream) => {
      const response = await handler(request(`${path}?limit=1000`));

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: [] });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `https://upstream.test/payment/api/v2/payment/seller/${upstream}?limit=1000`,
      );
      expect(init.headers.Authorization).toBe("Bearer seller-profile-token");
    },
  );

  it.each(["0", "1001", "dez"])(
    "recusa limit %s sem chamar a API",
    async (limit) => {
      const response = await RECEIVABLES(
        request(`/api/payment/seller/receivables?limit=${limit}`),
      );

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("preserva o 403 da payment-api", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"detail":"Permission denied"}', {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await DEBTS(
      request("/api/payment/seller/shippingCostDebts"),
    );

    expect(response.status).toBe(403);
  });
});
