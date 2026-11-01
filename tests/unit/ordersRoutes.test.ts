import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      ({
        access_token: { value: "login-token" },
        profile_access_token: { value: "seller-token" },
      })[name],
  }),
}));

// A env é lida na carga do ordersProxy: precisa existir antes do import.
process.env.ORDERS_API_URL = "https://upstream.test/orders/api/v2";

const { GET } = await import("@/app/api/orders/seller/route");
const { GET: getOrder } = await import("@/app/api/orders/[orderId]/route");
const { GET: getInvoice } =
  await import("@/app/api/orders/[orderId]/shipping/invoice/route");
const { POST: acceptShipping } =
  await import("@/app/api/orders/[orderId]/shipping/accept/route");

const ORDER_ID = "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16";
const routeParams = (orderId: string) => ({
  params: Promise.resolve({ orderId }),
});

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost"));

const ENVELOPE =
  '{"message":"Orders retrieved","data":[],"errors":null,"metadata":{"page":1,"pageSize":50,"totalCount":0,"totalPages":0}}';

describe("BFF dos pedidos do Seller (orders-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => ENVELOPE,
      headers: { get: () => null },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lista com o token do perfil Seller e repassa o envelope", async () => {
    const response = await GET(
      request("/api/orders/seller?offset=200&limit=200"),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/orders/api/v2/productOrder/seller?offset=200&limit=200",
    );
    expect(init.headers.Authorization).toBe("Bearer seller-token");
    await expect(response.json()).resolves.toEqual(JSON.parse(ENVELOPE));
  });

  it("repassa o 403 sem order:read", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"detail":"Exact permission required: order:read"}',
      headers: { get: () => null },
    });

    const response = await GET(request("/api/orders/seller"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      detail: "Exact permission required: order:read",
    });
  });

  it.each(["offset=-1", "offset=10001", "limit=0", "limit=201", "limit=abc"])(
    "recusa %s sem chamar a orders-api",
    async (query) => {
      const response = await GET(request(`/api/orders/seller?${query}`));

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("lê um pedido com o token do perfil", async () => {
    const response = await getOrder(
      request(`/api/orders/${ORDER_ID}`),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}`,
    );
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("recusa um orderId que não é UUID", async () => {
    const response = await getOrder(
      request("/api/orders/abc"),
      routeParams("abc"),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa o PDF da nota fiscal sem cache", async () => {
    fetchMock.mockResolvedValue(
      new Response("%PDF-1.7", {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="nf.pdf"',
        },
      }),
    );

    const response = await getInvoice(
      request(`/api/orders/${ORDER_ID}/shipping/invoice`),
      routeParams(ORDER_ID),
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}/shipping/invoice.pdf`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="nf.pdf"',
    );
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    await expect(response.text()).resolves.toBe("%PDF-1.7");
  });

  it("aceita o pedido físico com POST e o token do perfil Seller", async () => {
    const response = await acceptShipping(
      new Request(`http://localhost/api/orders/${ORDER_ID}/shipping/accept`, {
        method: "POST",
      }),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}/shipping/accept`,
    );
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("não aceita um orderId que não é UUID", async () => {
    const response = await acceptShipping(
      new Request("http://localhost/api/orders/abc/shipping/accept", {
        method: "POST",
      }),
      routeParams("abc"),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
