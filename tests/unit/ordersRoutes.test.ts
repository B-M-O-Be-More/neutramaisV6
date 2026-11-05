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
const { GET: listBuyer } = await import("@/app/api/orders/buyer/route");
const { GET: getOrder } = await import("@/app/api/orders/[orderId]/route");
const { GET: getInvoice, POST: attachInvoice } =
  await import("@/app/api/orders/[orderId]/shipping/invoice/route");
const { POST: acceptShipping } =
  await import("@/app/api/orders/[orderId]/shipping/accept/route");
const { POST: informTracking } =
  await import("@/app/api/orders/[orderId]/shipping/tracking/route");
const { GET: getLabel } =
  await import("@/app/api/orders/[orderId]/shipping/labels/[labelId]/route");

const ORDER_ID = "e2b7d4a9-6c1f-4a3e-9d8b-5f0c2e7a4b16";
const LABEL_ID = "05f2facd-ab1e-5974-83da-f1924f0324d0";
const routeParams = (orderId: string) => ({
  params: Promise.resolve({ orderId }),
});

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const INVOICE = {
  pdfBase64: "JVBERi0xLjcKJSVFT0YK",
  accessKey: "23261012345678000195550010000045121482139073",
  valueMinor: 77980,
  sender: {
    name: "Conecta Distribuidora de Equipamentos Ltda",
    company_document: "12345678000195",
    state_register: "069876543",
    postal_code: "60160230",
    address: "Avenida Dom Luís",
    number: "500",
    district: "Meireles",
    city: "Fortaleza",
    state_abbr: "CE",
    phone: "8532241100",
    email: "expedicao@conectadistribuidora.com.br",
  },
  recipientDocument: "11222333000181",
  recipientEmail: "compras@clinicaaldeota.com.br",
  recipientPhone: "85988776655",
};

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

describe("BFF dos pedidos do Buyer e das ações de envio (orders-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '{"data":{"orderId":"x"}}',
      headers: { get: () => null },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lista os pedidos do Buyer com a paginação", async () => {
    const response = await listBuyer(
      request("/api/orders/buyer?offset=0&limit=200"),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://upstream.test/orders/api/v2/productOrder/buyer?offset=0&limit=200",
    );
  });

  it("recusa paginação fora do limite na lista do Buyer", async () => {
    const response = await listBuyer(request("/api/orders/buyer?limit=500"));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("anexa a NF em JSON, só com os campos do contrato", async () => {
    const response = await attachInvoice(
      post(`/api/orders/${ORDER_ID}/shipping/invoice`, {
        ...INVOICE,
        sender: { ...INVOICE.sender, role: "admin" },
        organization_id: "outra",
      }),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}/shipping/invoice`,
    );
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
    // Campos fora do contrato não passam (a orders-api responderia 422).
    expect(JSON.parse(init.body)).toEqual(INVOICE);
  });

  it.each([
    ["sem o PDF", { ...INVOICE, pdfBase64: undefined }],
    ["valor em texto", { ...INVOICE, valueMinor: "779,80" }],
    ["sem remetente", { ...INVOICE, sender: null }],
  ])("não envia a NF %s", async (_case, body) => {
    const response = await attachInvoice(
      post(`/api/orders/${ORDER_ID}/shipping/invoice`, body),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("não envia a NF com corpo que não é JSON", async () => {
    const response = await attachInvoice(
      post(`/api/orders/${ORDER_ID}/shipping/invoice`, "não é json"),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa o 422 da orders-api com o motivo", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => '{"detail":"Invoice value does not match the order"}',
      headers: { get: () => null },
    });

    const response = await attachInvoice(
      post(`/api/orders/${ORDER_ID}/shipping/invoice`, INVOICE),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      detail: "Invoice value does not match the order",
    });
  });

  it("informa o rastreio só com o código", async () => {
    const response = await informTracking(
      post(`/api/orders/${ORDER_ID}/shipping/tracking`, {
        code: "AD284719305BR",
        status: "delivered",
      }),
      routeParams(ORDER_ID),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}/shipping/tracking`,
    );
    expect(JSON.parse(init.body)).toEqual({ code: "AD284719305BR" });
  });

  it.each(["AB1", "com espaço", "AD2847#19305", ""])(
    "recusa o código de rastreio %j",
    async (code) => {
      const response = await informTracking(
        post(`/api/orders/${ORDER_ID}/shipping/tracking`, { code }),
        routeParams(ORDER_ID),
      );

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("repassa o PDF da etiqueta sem cache", async () => {
    fetchMock.mockResolvedValue(
      new Response("%PDF-1.4", {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    const response = await getLabel(
      request(`/api/orders/${ORDER_ID}/shipping/labels/${LABEL_ID}`),
      { params: Promise.resolve({ orderId: ORDER_ID, labelId: LABEL_ID }) },
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://upstream.test/orders/api/v2/productOrder/${ORDER_ID}/shipping/labels/${LABEL_ID}.pdf`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("recusa uma etiqueta que não é UUID", async () => {
    const response = await getLabel(
      request(`/api/orders/${ORDER_ID}/shipping/labels/etiqueta`),
      { params: Promise.resolve({ orderId: ORDER_ID, labelId: "etiqueta" }) },
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
