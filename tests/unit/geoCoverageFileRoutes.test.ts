import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "access_token" ? { value: "seller-token" } : undefined,
  }),
}));

// A env é lida na carga do geoProxy: precisa existir antes do import.
process.env.GEO_API_URL = "https://upstream.test/geo/api/v2";

const { GET: LIST } = await import("@/app/api/geo/coverageFile/route");
const { GET: DOWNLOAD } =
  await import("@/app/api/geo/coverageFile/[fileId]/download/route");

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const FILE = "0193f1e2-0000-7c8d-9e0f-1a2b3c4d5e6f";
const VERSION = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost"));

const download = (fileId: string, query: string) =>
  DOWNLOAD(request(`/api/geo/coverageFile/${fileId}/download?${query}`), {
    params: Promise.resolve({ fileId }),
  });

describe("BFF dos arquivos de cobertura (geo-api)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { items: [], total: 0, offset: 0, limit: 200 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("GET /api/geo/coverageFile", () => {
    it("repassa só os parâmetros do contrato, com o Bearer da sessão", async () => {
      const response = await LIST(
        request(
          `/api/geo/coverageFile?organization_id=${ORGANIZATION}&offset=0&limit=200&active_only=true&extra=1`,
        ),
      );

      expect(response.status).toBe(200);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `https://upstream.test/geo/api/v2/geo/coverageFile?organization_id=${ORGANIZATION}&offset=0&limit=200&active_only=true`,
      );
      expect(init.method).toBe("GET");
      expect(init.headers.Authorization).toBe("Bearer seller-token");
    });

    it.each([
      ["sem organization_id", ""],
      ["organization_id inválido", "organization_id=abc"],
      ["limit não numérico", `organization_id=${ORGANIZATION}&limit=dez`],
      ["active_only inválido", `organization_id=${ORGANIZATION}&active_only=1`],
      [
        "exclude_file_id inválido",
        `organization_id=${ORGANIZATION}&exclude_file_id=x`,
      ],
    ])("recusa %s sem chamar a geo-api", async (_case, query) => {
      const response = await LIST(request(`/api/geo/coverageFile?${query}`));

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("preserva o status de erro da geo-api", async () => {
      fetchMock.mockResolvedValue(
        new Response('{"detail":"Organization access denied"}', {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const response = await LIST(
        request(`/api/geo/coverageFile?organization_id=${ORGANIZATION}`),
      );

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/geo/coverageFile/{fileId}/download", () => {
    it("repassa os bytes do KMZ original sem alterar", async () => {
      const bytes = new Uint8Array([80, 75, 3, 4, 0, 255, 128, 7]);
      fetchMock.mockResolvedValue(
        new Response(bytes, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.google-earth.kmz",
            "Content-Disposition": `attachment; filename="coverage-${VERSION}.kmz"`,
          },
        }),
      );

      const response = await download(
        FILE,
        `organization_id=${ORGANIZATION}&version_id=${VERSION}`,
      );

      expect(response.status).toBe(200);
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
      expect(response.headers.get("Content-Type")).toBe(
        "application/vnd.google-earth.kmz",
      );
      expect(response.headers.get("Content-Disposition")).toContain(
        `coverage-${VERSION}.kmz`,
      );
      expect(response.headers.get("Cache-Control")).toContain("no-store");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `https://upstream.test/geo/api/v2/geo/coverageFile/${FILE}/download?organization_id=${ORGANIZATION}&version_id=${VERSION}`,
      );
      // Original grande: sem o corte de 300 s do fetch do Node.
      expect(init.dispatcher).toBeDefined();
    });

    it("erro da geo-api volta como JSON com o mesmo status", async () => {
      fetchMock.mockResolvedValue(
        new Response('{"detail":"Original upload unavailable"}', {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const response = await download(FILE, `organization_id=${ORGANIZATION}`);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        detail: "Original upload unavailable",
      });
    });

    it.each([
      ["fileId inválido", "abc", `organization_id=${ORGANIZATION}`],
      ["sem organization_id", FILE, ""],
      [
        "version_id inválido",
        FILE,
        `organization_id=${ORGANIZATION}&version_id=x`,
      ],
    ])("recusa %s sem chamar a geo-api", async (_case, fileId, query) => {
      const response = await download(fileId, query);

      expect(response.status).toBe(422);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
