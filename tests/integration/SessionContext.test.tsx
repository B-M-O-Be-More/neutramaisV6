import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionProvider, useSession } from "@/contexts/SessionContext";
import { authService, type MeProfile } from "@/services/auth.service";
import { AuthError, NetworkError } from "@/services/errors";

import { renderWithProviders, screen } from "../test-utils";

// Router compartilhado para conferir o redirecionamento ao login.
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

const PROFILE: MeProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "22222222-2222-4222-8222-222222222222",
  display_name: "Usuário Exemplo",
  email: "usuario@example.com",
  phone: "+5511999999999",
  email_confirmed: true,
  phone_confirmed: false,
  status: "active",
  created_at: "2026-09-28T12:00:00Z",
  last_login_at: "2026-09-28T12:05:00Z",
  roles: ["buyer_owner"],
  permissions: [],
  mfa: false,
};

function Probe() {
  const { status, profile, personas, reload } = useSession();
  return (
    <div>
      <span>status:{status}</span>
      <span>name:{profile?.display_name}</span>
      <span>personas:{personas.join(",")}</span>
      <button onClick={reload}>reload</button>
    </div>
  );
}

const unauthorized = () => new AuthError(401, [], "Unauthorized");

describe("SessionProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
  });

  it("carrega o perfil do /me e deriva os grupos dos papéis", async () => {
    vi.spyOn(authService, "me").mockResolvedValue(PROFILE);

    renderWithProviders(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(await screen.findByText("status:authenticated")).toBeInTheDocument();
    expect(screen.getByText("name:Usuário Exemplo")).toBeInTheDocument();
    expect(screen.getByText("personas:buyer")).toBeInTheDocument();
  });

  it("com token vencido, renova e repete o /me", async () => {
    const me = vi
      .spyOn(authService, "me")
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce(PROFILE);
    const refresh = vi.spyOn(authService, "refresh").mockResolvedValue(null);

    renderWithProviders(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(await screen.findByText("status:authenticated")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(me).toHaveBeenCalledTimes(2);
    expect(replace).not.toHaveBeenCalled();
  });

  it("manda para o login quando a sessão não pode ser renovada", async () => {
    vi.spyOn(authService, "me").mockRejectedValue(unauthorized());
    vi.spyOn(authService, "refresh").mockRejectedValue(unauthorized());

    renderWithProviders(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.getByText("status:loading")).toBeInTheDocument();
  });

  it("falha de rede não derruba a sessão: mostra erro e permite recarregar", async () => {
    const me = vi
      .spyOn(authService, "me")
      .mockRejectedValueOnce(new NetworkError("offline"))
      .mockResolvedValueOnce(PROFILE);
    const refresh = vi.spyOn(authService, "refresh");

    const { user } = renderWithProviders(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );

    expect(await screen.findByText("status:error")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "reload" }));

    expect(await screen.findByText("status:authenticated")).toBeInTheDocument();
    expect(me).toHaveBeenCalledTimes(2);
  });
});
