import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKycDocuments } from "@/hooks/useKycDocuments";
import { api } from "@/services/api.client";

const file = () =>
  new File(["%PDF-1.4"], "private.pdf", { type: "application/pdf" });
const ticket = {
  upload_id: "upload-1",
  upload: {
    url: "https://storage.test/bucket",
    fields: { key: "staging/key", policy: "signed" },
    expires_at: "2099-01-01T00:00:00Z",
    max_bytes: 10485760,
    content_type: "application/pdf",
  },
};
const artifact = (id = "artifact-1") => ({ id });

describe("confirmed KYC upload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function setup() {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValueOnce(ticket)
      .mockResolvedValueOnce(artifact());
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    return { post, fetch, ...renderHook(() => useKycDocuments("org-1")) };
  }
  it("authorizes, uploads actual bytes without credentials, then confirms", async () => {
    const { post, fetch, result } = setup();
    const document = file();
    await act(() => result.current.upload("bank_proof", "verified", document));
    expect(post.mock.calls).toEqual([
      [
        "/organizations/org-1/kyc/uploads",
        {
          document_type: "bank_proof",
          kyc_level_supported: "verified",
          mime_type: "application/pdf",
          size_bytes: document.size,
        },
      ],
      ["/organizations/org-1/kyc/uploads/upload-1/confirm", {}],
    ]);
    expect(fetch).toHaveBeenCalledWith(ticket.upload.url, {
      method: "POST",
      credentials: "omit",
      body: expect.any(FormData),
    });
    const body = fetch.mock.calls[0][1].body as FormData;
    expect([...body.keys()]).toEqual(["key", "policy", "file"]);
    expect(body.get("file")).toBe(document);
    expect(post.mock.invocationCallOrder[0]).toBeLessThan(
      fetch.mock.invocationCallOrder[0],
    );
    expect(fetch.mock.invocationCallOrder[0]).toBeLessThan(
      post.mock.invocationCallOrder[1],
    );
    expect(result.current.artifactIds).toEqual(["artifact-1"]);
  });
  it("does not confirm after a rejected storage upload", async () => {
    const { post, fetch, result } = setup();
    fetch.mockResolvedValue({ ok: false, status: 403 });
    await act(() => result.current.upload("bank_proof", "verified", file()));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(result.current.artifactIds).toEqual([]);
    expect(result.current.documents.bank_proof?.status).toBe("idle");
  });
  it("does not upload or confirm an expired authorization", async () => {
    const { post, fetch, result } = setup();
    post
      .mockReset()
      .mockResolvedValue({
        ...ticket,
        upload: { ...ticket.upload, expires_at: "2020-01-01T00:00:00Z" },
      });
    await act(() => result.current.upload("bank_proof", "verified", file()));
    expect(fetch).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
    expect(result.current.artifactIds).toEqual([]);
  });
  it("does not create an artifact after a network error", async () => {
    const { post, fetch, result } = setup();
    fetch.mockRejectedValue(new TypeError("network"));
    await act(() => result.current.upload("bank_proof", "verified", file()));
    expect(post).toHaveBeenCalledTimes(1);
    expect(result.current.artifactIds).toEqual([]);
    expect(result.current.uploading).toBe(false);
  });
  it("keeps the valid previous version when confirmation expires", async () => {
    const { post, result } = setup();
    await act(() => result.current.upload("bank_proof", "verified", file()));
    post
      .mockResolvedValueOnce(ticket)
      .mockRejectedValueOnce(new Error("expired"));
    await act(() => result.current.upload("bank_proof", "verified", file()));
    expect(result.current.artifactIds).toEqual(["artifact-1"]);
    expect(result.current.documents.bank_proof?.error).toBe(
      "Register.flow.kyc.errors.upload",
    );
  });
  it.each([
    new File(["x"], "bad.exe", { type: "application/octet-stream" }),
    new File([new Uint8Array(10485761)], "large.pdf", {
      type: "application/pdf",
    }),
    new File([], "empty.pdf", { type: "application/pdf" }),
  ])("rejects invalid local file before authorization", async (document) => {
    const { post, result } = setup();
    await act(() => result.current.upload("bank_proof", "verified", document));
    expect(post).not.toHaveBeenCalled();
    expect(result.current.artifactIds).toEqual([]);
  });
  it("ignores an old completion and blocks submit until all uploads settle", async () => {
    const { post, fetch, result } = setup();
    post
      .mockReset()
      .mockImplementation(async (path: string) =>
        path.endsWith("/confirm")
          ? artifact(path.includes("new") ? "new" : "old")
          : ticket,
      );
    let resolveOld!: (response: { ok: boolean }) => void;
    fetch
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValue({ ok: true });
    let old!: Promise<void>;
    act(() => {
      old = result.current.upload("bank_proof", "verified", file());
    });
    await act(async () => {
      await Promise.resolve();
    });
    post.mockResolvedValueOnce({ ...ticket, upload_id: "new" });
    await act(() => result.current.upload("bank_proof", "verified", file()));
    expect(result.current.artifactIds).toEqual(["new"]);
    expect(result.current.uploading).toBe(true);
    expect(await result.current.submit()).toBe(false);
    await act(async () => {
      resolveOld({ ok: true });
      await old;
    });
    expect(result.current.artifactIds).toEqual(["new"]);
    expect(result.current.uploading).toBe(false);
  });
});
