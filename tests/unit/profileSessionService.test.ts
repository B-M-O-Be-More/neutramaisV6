import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthError, ForbiddenError } from "@/services/errors";
import {
  profileSessionService,
  withProfileSession,
} from "@/services/profileSession.service";

const json = (body: unknown, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const SESSION = {
  token_type: "bearer",
  expires_in: 900,
  profile: "seller",
  context_version: 1,
};

describe("withProfileSession", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("em 401, renova uma vez e repete a chamada", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(new AuthError(401))
      .mockResolvedValueOnce("ok");
    fetchMock.mockResolvedValue(json({ data: SESSION }));

    await expect(withProfileSession(call)).resolves.toBe("ok");

    expect(call).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/context/refresh");
  });

  it("chamadas simultâneas com 401 compartilham uma única renovação", async () => {
    let resolveRefresh: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const failingOnce = () =>
      vi.fn().mockRejectedValueOnce(new AuthError(401)).mockResolvedValue(1);

    const pending = Promise.all([
      withProfileSession(failingOnce()),
      withProfileSession(failingOnce()),
      withProfileSession(failingOnce()),
    ]);
    // Deixa as três chegarem à renovação antes de respondê-la.
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveRefresh(json({ data: SESSION }));

    await expect(pending).resolves.toEqual([1, 1, 1]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("403 não renova", async () => {
    const call = vi.fn().mockRejectedValue(new ForbiddenError(403));

    await expect(withProfileSession(call)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renovação recusada avisa a perda da sessão e não repete a chamada", async () => {
    const call = vi.fn().mockRejectedValue(new AuthError(401));
    const expired = vi.fn();
    const unsubscribe = profileSessionService.onExpired(expired);
    fetchMock.mockResolvedValue(
      json({ detail: "Invalid" }, 401, { "X-Correlation-ID": "corr-1" }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const error = await withProfileSession(call).catch((e) => e);

    expect(error).toBeInstanceOf(AuthError);
    expect((error as AuthError).correlationId).toBe("corr-1");
    expect(expired).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledTimes(1);
    unsubscribe();
    warn.mockRestore();
  });
});
