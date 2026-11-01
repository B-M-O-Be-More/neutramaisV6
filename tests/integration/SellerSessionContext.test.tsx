import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SellerSessionProvider,
  useSellerSession,
} from "@/contexts/SellerSessionContext";
import { AuthError, ForbiddenError, ServerError } from "@/services/errors";
import {
  profileSessionService,
  type ProfileContext,
  type ProfileSession,
} from "@/services/profileSession.service";

import { renderWithProviders, screen } from "../test-utils";

// Router compartilhado para conferir o redirecionamento ao login.
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/seller/offers",
}));

const SELLER: ProfileContext = {
  organization_id: "22222222-2222-4222-8222-222222222222",
  user_id: "11111111-1111-4111-8111-111111111111",
  profile: "seller",
  roles: ["seller_owner"],
  permissions: ["geo:coverage:read"],
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
  profile: "seller",
  context_version: 1,
};

function Probe() {
  const { organizationId } = useSellerSession();
  return <span>org:{organizationId}</span>;
}

const renderProvider = () =>
  renderWithProviders(
    <SellerSessionProvider>
      <Probe />
    </SellerSessionProvider>,
  );

describe("SellerSessionProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
  });

  it("reaproveita a sessão Seller aberta e usa a organização do contexto", async () => {
    vi.spyOn(profileSessionService, "current").mockResolvedValue(SELLER);
    const select = vi.spyOn(profileSessionService, "select");

    renderProvider();

    expect(
      await screen.findByText(`org:${SELLER.organization_id}`),
    ).toBeInTheDocument();
    expect(select).not.toHaveBeenCalled();
  });

  it("sem sessão de perfil, tenta renovar e então seleciona o Seller", async () => {
    vi.spyOn(profileSessionService, "current")
      .mockRejectedValueOnce(new AuthError(401))
      .mockResolvedValueOnce(SELLER);
    const refresh = vi
      .spyOn(profileSessionService, "refresh")
      .mockRejectedValue(new AuthError(401));
    const select = vi
      .spyOn(profileSessionService, "select")
      .mockResolvedValue(SESSION);

    renderProvider();

    expect(
      await screen.findByText(`org:${SELLER.organization_id}`),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("seller");
    expect(replace).not.toHaveBeenCalled();
  });

  it("sessão de outro perfil é encerrada antes de selecionar o Seller", async () => {
    vi.spyOn(profileSessionService, "current")
      .mockResolvedValueOnce({ ...SELLER, profile: "buyer" })
      .mockResolvedValueOnce(SELLER);
    const end = vi
      .spyOn(profileSessionService, "end")
      .mockResolvedValue(undefined);
    const select = vi
      .spyOn(profileSessionService, "select")
      .mockResolvedValue(SESSION);

    renderProvider();

    expect(
      await screen.findByText(`org:${SELLER.organization_id}`),
    ).toBeInTheDocument();
    expect(end).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("seller");
  });

  it("sem geo:coverage:read, não libera a página", async () => {
    vi.spyOn(profileSessionService, "current").mockResolvedValue({
      ...SELLER,
      permissions: [],
    });

    renderProvider();

    expect(
      await screen.findByText("SellerSession.forbidden"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^org:/)).not.toBeInTheDocument();
  });

  it("perfil Seller negado pela identity-api (403) mostra o aviso sem repetir", async () => {
    vi.spyOn(profileSessionService, "current").mockRejectedValue(
      new AuthError(401),
    );
    vi.spyOn(profileSessionService, "refresh").mockRejectedValue(
      new AuthError(401),
    );
    vi.spyOn(profileSessionService, "select").mockRejectedValue(
      new ForbiddenError(403),
    );

    renderProvider();

    expect(
      await screen.findByText("SellerSession.forbidden"),
    ).toBeInTheDocument();
    expect(screen.queryByText("SellerSession.retry")).not.toBeInTheDocument();
  });

  it("503 da identity-api avisa indisponibilidade com nova tentativa", async () => {
    vi.spyOn(profileSessionService, "current").mockRejectedValue(
      new ServerError(503),
    );

    renderProvider();

    expect(
      await screen.findByText("SellerSession.unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("SellerSession.retry")).toBeInTheDocument();
  });

  it("login vencido na seleção manda para o login", async () => {
    vi.spyOn(profileSessionService, "current").mockRejectedValue(
      new AuthError(401),
    );
    vi.spyOn(profileSessionService, "refresh").mockRejectedValue(
      new AuthError(401),
    );
    vi.spyOn(profileSessionService, "select").mockRejectedValue(
      new AuthError(401),
    );

    renderProvider();

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
