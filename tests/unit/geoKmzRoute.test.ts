import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "seller-token" } : undefined,
  }),
}));

// A env é lida na carga do geoProxy: precisa existir antes do import.
process.env.GEO_API_URL = "https://upstream.test/geo/api/v2";

const { POST } = await import("@/app/api/geo/coverageVersion/kmz/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const PREDECESSOR = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";

// No jsdom o `File` não é compatível com o parser de multipart do Node — o
// `NextRequest.formData()` nunca resolve. A rota só usa `formData()`, então o
// teste entrega o FormData pronto.
function request(fields: Record<string, string | File>): NextRequest {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return { formData: async () => form } as unknown as NextRequest;
}

const kmzFile = () =>
  new File([new Uint8Array([80, 75, 3, 4])], "cobertura.kmz");

describe("BFF POST /api/geo/coverageVersion/kmz", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => '{"message":"","data":{"id":"v1"}}',
      headers: { get: () => "application/json" },
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("repassa só os campos do contrato, em multipart, com o Bearer", async () => {
    const response = await POST(
      request({
        organization_id: ORGANIZATION,
        file: kmzFile(),
        predecessor_id: PREDECESSOR,
        // Fora do contrato do upload: não seguem para a geo-api.
        name: "Cobertura Russas Norte",
        description: "Área de Russas",
        notes: "CE · Russas",
      }),
    );

    expect(response.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/geo/api/v2/geo/coverageVersion/kmz",
    );
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer seller-token");
    // Com FormData quem define o boundary é o fetch.
    expect(init.headers["Content-Type"]).toBeUndefined();
    // A importação leva minutos: o agente espera mais que os 300 s do Node.
    expect(init.dispatcher).toBeDefined();

    const body = init.body as FormData;
    expect([...body.keys()].sort()).toEqual([
      "file",
      "organization_id",
      "predecessor_id",
    ]);
    expect(body.get("organization_id")).toBe(ORGANIZATION);
    expect((body.get("file") as File).name).toBe("cobertura.kmz");
  });

  it.each([409, 429])(
    "devolve o %i da geo-api como veio (cota ou importação em curso)",
    async (status) => {
      fetchMock.mockResolvedValue({
        ok: false,
        status,
        text: async () => '{"detail":"conflict"}',
        headers: { get: () => "application/json" },
      });

      const response = await POST(
        request({ organization_id: ORGANIZATION, file: kmzFile() }),
      );

      expect(response.status).toBe(status);
    },
  );

  it("recusa organization_id que não é UUID sem chamar a geo-api", async () => {
    const response = await POST(
      request({ organization_id: "abc", file: kmzFile() }),
    );

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa a requisição sem arquivo", async () => {
    const response = await POST(request({ organization_id: ORGANIZATION }));

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devolve o erro de validação da geo-api como veio", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => '{"detail":"KMZ must contain exactly one KML"}',
      headers: { get: () => "application/json" },
    });

    const response = await POST(
      request({ organization_id: ORGANIZATION, file: kmzFile() }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      detail: "KMZ must contain exactly one KML",
    });
  });
});
