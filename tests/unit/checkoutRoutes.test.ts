import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      ({
        access_token: { value: "login-token" },
        profile_access_token: { value: "buyer-token" },
      })[name],
  }),
}));

// As envs são lidas na carga dos proxies: precisam existir antes do import.
process.env.ORDERS_API_URL = "https://upstream.test/orders/api/v2";
process.env.PAYMENT_API_URL = "https://upstream.test/payment/api/v2";
process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const { POST: createCheckout } =
  await import("@/app/api/orders/checkout/route");
const { POST: authorizeFunding } =
  await import("@/app/api/orders/checkout/[checkoutId]/fundingAuthorization/route");
const { GET: checkoutProgress } =
  await import("@/app/api/orders/checkout/[checkoutId]/progress/route");
const { GET: progressByKey } =
  await import("@/app/api/orders/operations/checkout/route");
const { POST: pay } = await import("@/app/api/payment/route");
const { GET: paymentProgress } =
  await import("@/app/api/payment/checkout/[checkoutId]/progress/route");
const { POST: quoteShipping } =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/shippingQuote/route");

const CHECKOUT_ID = "7a1c9e3b-5d2f-4e8a-b4c6-0d9f2a7e1b53";
const OFFERING_ID = "b4f7a2d9-3c8e-4e1b-9a6d-5f2c8b1e7a54";
const KEY = "chk-20261106-7f3a9c21";

const post = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

const checkoutParams = { params: Promise.resolve({ checkoutId: CHECKOUT_ID }) };

describe("BFF do checkout e do pagamento", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response('{"message":"ok","data":{}}', {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("cria o checkout com a Idempotency-Key e só os campos do contrato", async () => {
    const response = await createCheckout(
      post(
        "/api/orders/checkout",
        { items: [{ offeringId: OFFERING_ID }], walletMinor: 0, extra: true },
        { "Idempotency-Key": KEY },
      ),
    );

    expect(response.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/orders/api/v2/productOrder/checkout",
    );
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe(KEY);
    expect(init.headers.Authorization).toBe("Bearer buyer-token");
    expect(JSON.parse(init.body)).toEqual({
      items: [{ offeringId: OFFERING_ID }],
      walletMinor: 0,
    });
  });

  it("recusa o checkout sem Idempotency-Key ou fora do formato", async () => {
    const missing = await createCheckout(
      post("/api/orders/checkout", { items: [] }),
    );
    const invalid = await createCheckout(
      post(
        "/api/orders/checkout",
        { items: [] },
        { "Idempotency-Key": "chave com espaço" },
      ),
    );

    expect(missing.status).toBe(422);
    expect(invalid.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("leva o X-Error-Code da orders-api para o corpo (MFA_REQUIRED)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"detail":"MFA required"}', {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Error-Code": "MFA_REQUIRED",
        },
      }),
    );

    const response = await createCheckout(
      post("/api/orders/checkout", { items: [] }, { "Idempotency-Key": KEY }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      detail: "MFA required",
      code: "MFA_REQUIRED",
    });
  });

  it("mantém o code que a orders-api já mandou no corpo", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        '{"detail":"Only 3 units available","code":"ORD_OFFER_OUT_OF_STOCK"}',
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "X-Error-Code": "OTHER",
          },
        },
      ),
    );

    const response = await createCheckout(
      post("/api/orders/checkout", { items: [] }, { "Idempotency-Key": KEY }),
    );

    expect((await response.json()).code).toBe("ORD_OFFER_OUT_OF_STOCK");
  });

  it("autoriza o pagamento e lê o progresso do checkout", async () => {
    await authorizeFunding(
      new Request("http://localhost", { method: "POST" }),
      checkoutParams,
    );
    await checkoutProgress(new Request("http://localhost"), checkoutParams);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://upstream.test/orders/api/v2/productOrder/checkout/${CHECKOUT_ID}/fundingAuthorization`,
    );
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://upstream.test/orders/api/v2/productOrder/checkout/${CHECKOUT_ID}/progress`,
    );
  });

  it("recusa checkoutId que não é UUID", async () => {
    const response = await authorizeFunding(
      new Request("http://localhost", { method: "POST" }),
      { params: Promise.resolve({ checkoutId: "abc" }) },
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lê o progresso pela chave do POST", async () => {
    await progressByKey(
      new Request("http://localhost/api/orders/operations/checkout", {
        headers: { "Idempotency-Key": KEY },
      }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/orders/api/v2/productOrder/operations/checkout",
    );
    expect(init.headers["Idempotency-Key"]).toBe(KEY);
  });

  it("paga com a Idempotency-Key e só checkoutId e authorization", async () => {
    await pay(
      post(
        "/api/payment",
        { checkoutId: CHECKOUT_ID, authorization: "jwt", amount: 1 },
        { "Idempotency-Key": `pay-${CHECKOUT_ID}` },
      ),
    );
    await paymentProgress(new Request("http://localhost"), checkoutParams);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://upstream.test/payment/api/v2/payment");
    expect(init.headers["Idempotency-Key"]).toBe(`pay-${CHECKOUT_ID}`);
    expect(JSON.parse(init.body)).toEqual({
      checkoutId: CHECKOUT_ID,
      authorization: "jwt",
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://upstream.test/payment/api/v2/payment/checkout/${CHECKOUT_ID}/progress`,
    );
  });

  it("cota o frete com o CEP e a quantidade", async () => {
    await quoteShipping(
      post(`/api/productCatalog/productOffering/${OFFERING_ID}/shippingQuote`, {
        destinationPostalCode: "01310-100",
        quantity: 2,
        extra: "x",
      }),
      { params: Promise.resolve({ offeringId: OFFERING_ID }) },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://upstream.test/marketplace/api/v2/productCatalog/productOffering/${OFFERING_ID}/shippingQuote`,
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      destinationPostalCode: "01310-100",
      quantity: 2,
    });
  });
});
