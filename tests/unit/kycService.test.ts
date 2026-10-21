import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "@/services/api.client";
import { kycService } from "@/services/kyc.service";

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

describe("kycService.uploadArtifact", () => {
  afterEach(() => vi.restoreAllMocks());

  it("manda o arquivo em multipart com exatamente os três campos", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({});
    const file = new File(["%PDF-1.4"], "cnpj.pdf", {
      type: "application/pdf",
    });

    await kycService.uploadArtifact(ORG_ID, {
      document_type: "cnpj_card",
      kyc_level_supported: "basic",
      file,
    });

    const [path, body] = post.mock.calls[0];
    expect(path).toBe(`/organizations/${ORG_ID}/kyc/artifacts`);
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect([...form.keys()]).toEqual([
      "document_type",
      "kyc_level_supported",
      "file",
    ]);
    expect(form.get("document_type")).toBe("cnpj_card");
    expect(form.get("kyc_level_supported")).toBe("basic");
    expect((form.get("file") as File).name).toBe("cnpj.pdf");
  });
});

describe("kycService.submit", () => {
  afterEach(() => vi.restoreAllMocks());

  it("manda os ids dos artefatos em `artifact_ids`", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({});

    await kycService.submit(ORG_ID, ["id-1", "id-2"]);

    expect(post).toHaveBeenCalledWith(`/organizations/${ORG_ID}/kyc/submit`, {
      artifact_ids: ["id-1", "id-2"],
    });
  });
});
