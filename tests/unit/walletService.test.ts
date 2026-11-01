import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { walletService } from "@/services/wallet.service";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const BALANCE = {
  organizationId: "22222222-2222-4222-8222-222222222222",
  currency: "BRL",
  availableMinor: 45000,
  reservedMinor: 30000,
};

describe("walletService com a sessão de perfil", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("token do perfil vencido (401): renova o perfil e repete a leitura", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ detail: "Token expired" }, 401))
      .mockResolvedValueOnce(
        json({
          data: {
            token_type: "bearer",
            expires_in: 900,
            profile: "buyer",
            context_version: 1,
          },
        }),
      )
      .mockResolvedValueOnce(json({ data: BALANCE }));

    await expect(walletService.getBalance()).resolves.toEqual(BALANCE);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/wallet/balance?currency=BRL",
      "/api/auth/context/refresh",
      "/api/wallet/balance?currency=BRL",
    ]);
  });

  it("sem wallet:read (403), não renova", async () => {
    fetchMock.mockResolvedValue(
      json({ detail: "wallet:read permission required" }, 403),
    );

    await expect(walletService.listTransactions()).rejects.toMatchObject({
      status: 403,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
