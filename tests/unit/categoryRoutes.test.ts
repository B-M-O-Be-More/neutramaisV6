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

// A env é lida na carga do marketplaceProxy: precisa existir antes do import.
process.env.MARKETPLACE_API_URL = "https://upstream.test/marketplace/api/v2";

const { GET: listCategories } =
  await import("@/app/api/productCatalog/category/route");
const { GET: getCategory } =
  await import("@/app/api/productCatalog/category/[categoryId]/route");

const CATEGORY_ID = "0193a000-0000-7000-8000-000000000c01";

describe("BFF das categorias da plataforma", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response('{"message":"","data":[]}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("lista a árvore com o token do perfil e não repassa includeInactive", async () => {
    const response = await listCategories(
      new NextRequest(
        "http://localhost/api/productCatalog/category?includeInactive=true",
      ),
    );

    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://upstream.test/marketplace/api/v2/productCatalog/category?tree=true",
    );
    expect(init.headers.Authorization).toBe("Bearer seller-token");
  });

  it("lê a categoria com o template", async () => {
    await getCategory(new Request("http://localhost/x"), {
      params: Promise.resolve({ categoryId: CATEGORY_ID }),
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://upstream.test/marketplace/api/v2/productCatalog/category/${CATEGORY_ID}`,
    );
  });

  it("recusa um categoryId que não é UUID", async () => {
    const response = await getCategory(new Request("http://localhost/x"), {
      params: Promise.resolve({ categoryId: "abc" }),
    });

    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
