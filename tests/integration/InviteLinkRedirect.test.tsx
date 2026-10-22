import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InviteLinkRedirect from "@/components/InviteLinkRedirect";

import { renderWithProviders } from "../test-utils";

// O jsdom não navega: troca o `location` por um com `replace` observável.
const original = window.location;
let replace: ReturnType<typeof vi.fn>;

function openAt(hash: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hash, replace },
  });
}

describe("InviteLinkRedirect", () => {
  beforeEach(() => {
    replace = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: original,
    });
  });

  it("leva o link do convite para a tela de aceite, com o token no fragmento", () => {
    openAt("#token=abc_DEF-123/change-password");

    renderWithProviders(<InviteLinkRedirect />);

    expect(replace).toHaveBeenCalledWith(
      "/platform-invites/accept#token=abc_DEF-123",
    );
  });

  it("não faz nada na home sem token", () => {
    openAt("#ofertas");

    renderWithProviders(<InviteLinkRedirect />);

    expect(replace).not.toHaveBeenCalled();
  });
});
