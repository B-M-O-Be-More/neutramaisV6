import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ProfileSessionProvider,
  useProfileSession,
} from "@/contexts/ProfileSessionContext";
import { SellerSessionProvider } from "@/contexts/SellerSessionContext";
import { ForbiddenError } from "@/services/errors";
import {
  profileSessionService,
  type ProfileContext,
  type ProfileSession,
} from "@/services/profileSession.service";

import { renderWithProviders, screen } from "../test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/wallet",
}));

const CONTEXT: ProfileContext = {
  organization_id: "22222222-2222-4222-8222-222222222222",
  user_id: "11111111-1111-4111-8111-111111111111",
  profile: "buyer",
  roles: ["buyer_owner"],
  permissions: ["wallet:read"],
  kyc_level: "basic",
  kyc_state: "verified",
  transaction_eligible: true,
  profile_version: 1,
  grant_version: 1,
  context_version: 1,
};

const SESSION: ProfileSession = {
  token_type: "bearer",
  expires_in: 900,
  profile: "buyer",
  context_version: 1,
};

function Probe() {
  const { organizationId, context } = useProfileSession();
  return (
    <span>
      {context?.profile}:{organizationId}
    </span>
  );
}

describe("ProfileSessionProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("na carteira do buyer, troca a sessão Seller pela Buyer", async () => {
    vi.spyOn(profileSessionService, "current")
      .mockResolvedValueOnce({ ...CONTEXT, profile: "seller" })
      .mockResolvedValueOnce(CONTEXT);
    const end = vi.spyOn(profileSessionService, "end").mockResolvedValue();
    const select = vi
      .spyOn(profileSessionService, "select")
      .mockResolvedValue(SESSION);

    renderWithProviders(
      <ProfileSessionProvider profile="buyer">
        <Probe />
      </ProfileSessionProvider>,
    );

    expect(
      await screen.findByText(`buyer:${CONTEXT.organization_id}`),
    ).toBeInTheDocument();
    expect(end).toHaveBeenCalledTimes(1);
    // Só o perfil vai na seleção.
    expect(select).toHaveBeenCalledWith("buyer");
  });

  it("sem permissão exigida, libera pelo perfil (a API responde 403 ao resto)", async () => {
    vi.spyOn(profileSessionService, "current").mockResolvedValue({
      ...CONTEXT,
      permissions: [],
    });

    renderWithProviders(
      <ProfileSessionProvider profile="buyer">
        <Probe />
      </ProfileSessionProvider>,
    );

    expect(
      await screen.findByText(`buyer:${CONTEXT.organization_id}`),
    ).toBeInTheDocument();
  });

  it("perfil Buyer negado mostra o aviso do Buyer", async () => {
    vi.spyOn(profileSessionService, "current").mockResolvedValue({
      ...CONTEXT,
      profile: "seller",
    });
    vi.spyOn(profileSessionService, "end").mockResolvedValue();
    vi.spyOn(profileSessionService, "select").mockRejectedValue(
      new ForbiddenError(403),
    );

    renderWithProviders(
      <ProfileSessionProvider profile="buyer">
        <Probe />
      </ProfileSessionProvider>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "BuyerSession.forbidden",
    );
  });

  it("carteira do seller abre sem geo:coverage:read", async () => {
    vi.spyOn(profileSessionService, "current").mockResolvedValue({
      ...CONTEXT,
      profile: "seller",
      permissions: ["wallet:read"],
    });

    renderWithProviders(
      <SellerSessionProvider requiredPermission={null}>
        <Probe />
      </SellerSessionProvider>,
    );

    expect(
      await screen.findByText(`seller:${CONTEXT.organization_id}`),
    ).toBeInTheDocument();
  });
});
