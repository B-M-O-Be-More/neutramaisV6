import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "@/services/api.client";
import { kycService } from "@/services/kyc.service";

const ORG_ID = "018f4c2a-b7d2-7a19-8c43-6e0a9f2b5c71";

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
