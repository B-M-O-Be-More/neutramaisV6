import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SellerPaymentAccountCard from "@/components/SellerPaymentAccountCard";
import { ForbiddenError, NotFoundError } from "@/services/errors";
import { myMfaService } from "@/services/myMfa.service";
import { paymentAccountService } from "@/services/paymentAccount.service";

import { renderWithProviders, screen, waitFor } from "../test-utils";

vi.mock("@/services/paymentAccount.service", () => ({
  paymentAccountService: {
    getAccess: vi.fn(),
    startOnboarding: vi.fn(),
    refreshOnboarding: vi.fn(),
  },
}));

vi.mock("@/services/myMfa.service", () => ({
  myMfaService: { stepUp: vi.fn() },
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const NO_ACCOUNT = {
  hasAccount: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  isOnboarded: false,
};
const ONBOARDING = {
  organizationId: ORGANIZATION,
  stripeAccountId: "acct_1",
  onboardingUrl: "https://connect.stripe.com/setup/e/acct_1/x",
  isOnboarded: false,
  chargesEnabled: false,
  payoutsEnabled: false,
};

// O 403 da payment-api traz o código na raiz do corpo.
const refusal = (code: string) =>
  new ForbiddenError(403, [], code, { message: code, data: null, code });

function renderCard(isOwner = true) {
  return renderWithProviders(
    <SellerPaymentAccountCard
      organizationId={ORGANIZATION}
      isOwner={isOwner}
      defaultEmail="dono@fibra.com.br"
    />,
  );
}

const startButton = () =>
  screen.findByRole("button", { name: /SellerPaymentAccount.start/ });

describe("SellerPaymentAccountCard (conta Stripe do Seller)", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.mocked(paymentAccountService.getAccess).mockResolvedValue(NO_ACCOUNT);
    vi.mocked(paymentAccountService.startOnboarding).mockResolvedValue(
      ONBOARDING,
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("sem conta, o Dono ativa no Stripe com o e-mail sugerido", async () => {
    const { user } = renderCard();

    expect(
      await screen.findByText("SellerPaymentAccount.state.none.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("SellerPaymentAccount.emailLabel"),
    ).toHaveValue("dono@fibra.com.br");

    await user.click(await startButton());

    expect(paymentAccountService.startOnboarding).toHaveBeenCalledWith(
      "dono@fibra.com.br",
    );
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(ONBOARDING.onboardingUrl),
    );
  });

  it("pede o código do autenticador e repete a ação quando falta MFA", async () => {
    vi.mocked(paymentAccountService.startOnboarding)
      .mockRejectedValueOnce(refusal("mfa_required"))
      .mockResolvedValueOnce(ONBOARDING);
    vi.mocked(myMfaService.stepUp).mockResolvedValue({
      mfa: true,
      profile: "seller",
    });
    const { user } = renderCard();

    await user.click(await startButton());
    expect(await screen.findByText("MfaStepUp.title")).toBeInTheDocument();

    await user.type(screen.getByLabelText("MfaStepUp.codeLabel"), "48a2915");
    // Só dígitos, até 6.
    expect(screen.getByLabelText("MfaStepUp.codeLabel")).toHaveValue("482915");
    await user.click(screen.getByRole("button", { name: "MfaStepUp.confirm" }));

    expect(myMfaService.stepUp).toHaveBeenCalledWith("482915");
    await waitFor(() =>
      expect(paymentAccountService.startOnboarding).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith(ONBOARDING.onboardingUrl),
    );
  });

  it("cadastro pendente: atualiza sozinho ao voltar do Stripe", async () => {
    vi.mocked(paymentAccountService.getAccess).mockResolvedValue({
      hasAccount: true,
      chargesEnabled: true,
      payoutsEnabled: false,
      isOnboarded: false,
    });
    vi.mocked(paymentAccountService.refreshOnboarding).mockResolvedValue({
      ...ONBOARDING,
      isOnboarded: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    });
    renderCard();

    expect(
      await screen.findByText("SellerPaymentAccount.state.active.title"),
    ).toBeInTheDocument();
    expect(paymentAccountService.refreshOnboarding).toHaveBeenCalledTimes(1);
  });

  it("cadastro pendente sem MFA na sessão mostra as pendências e os botões", async () => {
    vi.mocked(paymentAccountService.getAccess).mockResolvedValue({
      hasAccount: true,
      chargesEnabled: true,
      payoutsEnabled: false,
      isOnboarded: false,
    });
    // A atualização automática não abre o step-up.
    vi.mocked(paymentAccountService.refreshOnboarding).mockRejectedValue(
      refusal("mfa_required"),
    );
    renderCard();

    expect(
      await screen.findByText("SellerPaymentAccount.state.pending.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerPaymentAccount.flags.charges.on"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerPaymentAccount.flags.payouts.off"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /SellerPaymentAccount.continue/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /SellerPaymentAccount.refresh/ }),
    ).toBeEnabled();
    expect(screen.queryByText("MfaStepUp.title")).not.toBeInTheDocument();
  });

  it("atualizar sem onboarding iniciado (404) explica o que fazer", async () => {
    vi.mocked(paymentAccountService.getAccess).mockResolvedValue({
      hasAccount: true,
      chargesEnabled: false,
      payoutsEnabled: false,
      isOnboarded: false,
    });
    vi.mocked(paymentAccountService.refreshOnboarding).mockRejectedValue(
      new NotFoundError(404),
    );
    const { user } = renderCard();

    await user.click(
      await screen.findByRole("button", {
        name: /SellerPaymentAccount.refresh/,
      }),
    );

    expect(
      await screen.findByText("SellerPaymentAccount.errors.notStarted"),
    ).toBeInTheDocument();
  });

  it("conta ativa não oferece ações", async () => {
    vi.mocked(paymentAccountService.getAccess).mockResolvedValue({
      hasAccount: true,
      chargesEnabled: true,
      payoutsEnabled: true,
      isOnboarded: true,
    });
    renderCard();

    expect(
      await screen.findByText("SellerPaymentAccount.state.active.title"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("quem não é Dono vê a situação, sem ações", async () => {
    renderCard(false);

    expect(
      await screen.findByText("SellerPaymentAccount.ownerOnly"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /SellerPaymentAccount.start/ }),
    ).not.toBeInTheDocument();
  });

  it("falha ao ler a situação permite tentar de novo", async () => {
    vi.mocked(paymentAccountService.getAccess)
      .mockRejectedValueOnce(new Error("rede"))
      .mockResolvedValueOnce(NO_ACCOUNT);
    const { user } = renderCard();

    await user.click(
      await screen.findByRole("button", {
        name: "SellerPaymentAccount.retry",
      }),
    );

    expect(
      await screen.findByText("SellerPaymentAccount.state.none.title"),
    ).toBeInTheDocument();
  });
});
