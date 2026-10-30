import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NetworkError } from "@/services/errors";
import { objectStorageService } from "@/services/objectStorage.service";

const UPLOAD = {
  url: "https://storage.test/offering-images",
  fields: {
    key: "offering-images/org/image",
    "Content-Type": "image/png",
    policy: "signed-policy",
  },
  expiresAt: "2026-10-29T12:15:00Z",
  maxBytes: 3,
  contentType: "image/png" as const,
};

describe("objectStorageService.uploadToSignedForm", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("envia os campos assinados e o arquivo por último, sem cookies da aplicação", async () => {
    const file = new File(["png"], "capa.png", { type: "image/png" });

    await objectStorageService.uploadToSignedForm(UPLOAD, file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(UPLOAD.url);
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(init.headers).toBeUndefined();
    const form = init.body as FormData;
    expect([...form.keys()]).toEqual(["key", "Content-Type", "policy", "file"]);
    expect(form.get("policy")).toBe("signed-policy");
    expect((form.get("file") as File).name).toBe("capa.png");
  });

  it("status de erro do storage vira erro tipado", async () => {
    fetchMock.mockResolvedValue(
      new Response("<Error><Code>AccessDenied</Code></Error>", { status: 403 }),
    );

    await expect(
      objectStorageService.uploadToSignedForm(
        UPLOAD,
        new File(["png"], "a.png", { type: "image/png" }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("falha de rede (ex.: CORS do bucket) vira NetworkError", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      objectStorageService.uploadToSignedForm(
        UPLOAD,
        new File(["png"], "a.png", { type: "image/png" }),
      ),
    ).rejects.toBeInstanceOf(NetworkError);
  });
});
