import { afterEach, describe, expect, it, vi } from "vitest";

import RequirePermission from "@/components/RequirePermission";
import { rolesToPersonas } from "@/functions/rolesToPersonas";

import { renderWithProviders, screen } from "../test-utils";

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
const session = vi.hoisted(() => ({ roles: [] as string[] }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

vi.mock("@/contexts/SessionContext", () => ({
  useSession: () => ({
    status: "authenticated",
    profile: { roles: session.roles },
    personas: rolesToPersonas(session.roles),
  }),
}));

// Simula uma página do admin: a chamada da fila só sai se o conteúdo montar.
const loadQueue = vi.fn();
function AdminContent() {
  loadQueue();
  return <p>Painel administrativo</p>;
}

describe("RequirePermission role=admin", () => {
  afterEach(() => {
    router.replace.mockReset();
    loadQueue.mockReset();
  });

  it.each([["admin_neutra"], ["super_admin"]])(
    "%s abre a área de admin",
    (role) => {
      session.roles = [role];

      renderWithProviders(
        <RequirePermission role="admin">
          <AdminContent />
        </RequirePermission>,
      );

      expect(screen.getByText("Painel administrativo")).toBeInTheDocument();
      expect(router.replace).not.toHaveBeenCalled();
    },
  );

  it.each([["buyer_owner"], ["seller_admin"], ["compliance"], ["support"]])(
    "%s é levado para /403 sem montar a página",
    (role) => {
      session.roles = [role];

      renderWithProviders(
        <RequirePermission role="admin">
          <AdminContent />
        </RequirePermission>,
      );

      expect(
        screen.queryByText("Painel administrativo"),
      ).not.toBeInTheDocument();
      expect(loadQueue).not.toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith("/403");
    },
  );

  it("usuário sem papel também é bloqueado", () => {
    session.roles = [];

    renderWithProviders(
      <RequirePermission role="admin">
        <AdminContent />
      </RequirePermission>,
    );

    expect(router.replace).toHaveBeenCalledWith("/403");
  });
});
