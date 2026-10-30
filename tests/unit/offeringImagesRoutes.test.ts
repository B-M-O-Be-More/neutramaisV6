import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Cookies da requisição — cada teste monta os que precisa.
let jar: Record<string, string> = {};
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name in jar ? { name, value: jar[name] } : undefined,
  }),
}));

process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const imagesRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/images/route");
const orderRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/images/order/route");
const imageRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/images/[imageId]/route");
const confirmRoute =
  await import("@/app/api/productCatalog/productOffering/[offeringId]/images/[imageId]/confirm/route");

const UPSTREAM =
  "https://upstream.test/marketplace/api/v2/productCatalog/productOffering";
const OFFERING = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";
const IMAGE = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5d";
const OTHER_IMAGE = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5e";

const request = (path: string, method: string, body?: unknown) =>
  new NextRequest(
    `http://localhost/api/productCatalog/productOffering${path}`,
    {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );

const offeringParams = (offeringId = OFFERING) => ({
  params: Promise.resolve({ offeringId }),
});
const imageParams = (imageId = IMAGE) => ({
  params: Promise.resolve({ offeringId: OFFERING, imageId }),
});

describe("BFF das imagens da oferta", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jar = {
      access_token: "login-token",
      profile_access_token: "seller-access",
    };
    fetchMock = vi.fn().mockResolvedValue(
      new Response('{"message":"","data":{}}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  const sent = () => {
    const [url, init] = fetchMock.mock.calls[0];
    return { url, init, body: init.body ? JSON.parse(init.body) : undefined };
  };

  it("POST images autoriza o envio com a sessão de perfil e só os campos do contrato", async () => {
    await imagesRoute.POST(
      request(`/${OFFERING}/images`, "POST", {
        contentType: "image/webp",
        sizeBytes: 1024,
        organizationId: "outra-org",
      }),
      offeringParams(),
    );

    const { url, init, body } = sent();
    expect(url).toBe(`${UPSTREAM}/${OFFERING}/images`);
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer seller-access");
    expect(body).toEqual({ contentType: "image/webp", sizeBytes: 1024 });
  });

  it.each([
    { contentType: "image/gif", sizeBytes: 1024 },
    { contentType: "image/png", sizeBytes: 0 },
    { contentType: "image/png", sizeBytes: 5 * 1024 * 1024 + 1 },
    { contentType: "image/png", sizeBytes: 10.5 },
    { contentType: "image/png" },
  ])("POST images recusa %o sem chamar a API", async (body) => {
    const response = await imagesRoute.POST(
      request(`/${OFFERING}/images`, "POST", body),
      offeringParams(),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GET images lista com a sessão de perfil (e o login como reserva)", async () => {
    delete jar.profile_access_token;

    await imagesRoute.GET(
      request(`/${OFFERING}/images`, "GET"),
      offeringParams(),
    );

    const { url, init } = sent();
    expect(url).toBe(`${UPSTREAM}/${OFFERING}/images`);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer login-token");
  });

  it("POST confirm repassa sem corpo", async () => {
    await confirmRoute.POST(
      request(`/${OFFERING}/images/${IMAGE}/confirm`, "POST"),
      imageParams(),
    );

    const { url, init } = sent();
    expect(url).toBe(`${UPSTREAM}/${OFFERING}/images/${IMAGE}/confirm`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(init.headers.Authorization).toBe("Bearer seller-access");
  });

  it("PUT order repassa a lista de ids", async () => {
    await orderRoute.PUT(
      request(`/${OFFERING}/images/order`, "PUT", {
        imageIds: [OTHER_IMAGE, IMAGE],
      }),
      offeringParams(),
    );

    const { url, init, body } = sent();
    expect(url).toBe(`${UPSTREAM}/${OFFERING}/images/order`);
    expect(init.method).toBe("PUT");
    expect(body).toEqual({ imageIds: [OTHER_IMAGE, IMAGE] });
  });

  it.each([{ imageIds: [] }, { imageIds: ["../x"] }, {}])(
    "PUT order recusa %o",
    async (body) => {
      const response = await orderRoute.PUT(
        request(`/${OFFERING}/images/order`, "PUT", body),
        offeringParams(),
      );

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("DELETE remove a imagem e devolve o 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const response = await imageRoute.DELETE(
      request(`/${OFFERING}/images/${IMAGE}`, "DELETE"),
      imageParams(),
    );

    const { url, init } = sent();
    expect(url).toBe(`${UPSTREAM}/${OFFERING}/images/${IMAGE}`);
    expect(init.method).toBe("DELETE");
    expect(response.status).toBe(204);
  });

  it("ids fora do formato UUID não chegam à API", async () => {
    const responses = await Promise.all([
      imagesRoute.GET(request("/x/images", "GET"), offeringParams("x")),
      imageRoute.DELETE(
        request(`/${OFFERING}/images/x`, "DELETE"),
        imageParams("x"),
      ),
      confirmRoute.POST(
        request(`/${OFFERING}/images/x/confirm`, "POST"),
        imageParams("x"),
      ),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      422, 422, 422,
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
