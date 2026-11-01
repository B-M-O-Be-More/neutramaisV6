import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerWithdraw from "@/components/SellerWithdraw";
import { AuthError } from "@/services/errors";
import { walletService } from "@/services/wallet.service";
import type { PayoutAccount } from "@/services/withdrawal.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/wallet.service", () => ({
  walletService: { getBalance: vi.fn(), listTransactions: vi.fn() },
}));

const PIX: PayoutAccount = {
  id: "acc-pix",
  method: "pix",
  title: "PIX · Chave CNPJ",
  detail: "14.523.777/0001-88",
  isDefault: true,
  status: "active",
};

const BANK: PayoutAccount = {
  id: "acc-bank",
  method: "bank",
  title: "TED · Itaú 341",
  detail: "Ag. 0001 · CC 98765-4",
  isDefault: false,
  status: "pending",
};

// O Intl separa "R$" do número com espaço não separável.
const quick = (label: string) => (name: string) =>
  name.replace(/\s/g, " ") === label;

const next = () =>
  screen.getByRole("button", { name: "Wallet.withdraw.nav.next" });

function renderFlow(
  props: Partial<React.ComponentProps<typeof SellerWithdraw>> = {},
) {
  return renderWithProviders(
    <SellerWithdraw
      accounts={[PIX, BANK]}
      walletHref="/seller/wallet"
      addAccountHref="/seller/wallet/payment-methods/new?type=pix"
      locale="pt-BR"
      {...props}
    />,
  );
}

describe("SellerWithdraw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletService.getBalance).mockResolvedValue({
      organizationId: "org-1",
      currency: "BRL",
      availableMinor: 2_474_403,
      reservedMinor: 0,
    });
  });

  it("valor: atalhos, tudo e limite do saldo", async () => {
    const { user } = renderFlow();

    expect(await screen.findByText("R$ 24.744,03")).toBeInTheDocument();
    const amount = screen.getByLabelText("Wallet.withdraw.amount.label");
    expect(amount).toHaveValue("0,00");

    // Sem valor, não avança.
    await user.click(next());
    expect(
      screen.getByText("Wallet.withdraw.amount.errors.required"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: quick("R$ 1.000,00") }),
    );
    expect(amount).toHaveValue("1.000,00");

    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.amount.all" }),
    );
    expect(amount).toHaveValue("24.744,03");

    // A digitação preenche os centavos da direita para a esquerda.
    await user.clear(amount);
    await user.type(amount, "3000000");
    expect(amount).toHaveValue("30.000,00");
    await user.click(next());
    expect(
      screen.getByText("Wallet.withdraw.amount.errors.exceeds"),
    ).toBeInTheDocument();
  });

  it("percorre valor, destino, revisão e PIN até o comprovante", async () => {
    const request = vi.fn().mockResolvedValue({ protocol: "SAQ-2026-008811" });
    const { user } = renderFlow({ request });

    await user.click(
      await screen.findByRole("button", { name: quick("R$ 500,00") }),
    );
    await user.click(next());

    // Destino: a conta padrão já vem marcada; a pendente não recebe saídas.
    const destinations = screen.getByRole("radiogroup", {
      name: "Wallet.withdraw.destination.title",
    });
    expect(
      within(destinations).getByRole("radio", { name: /PIX · Chave CNPJ/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(destinations).getByRole("radio", { name: /TED · Itaú 341/ }),
    ).toBeDisabled();
    await user.click(next());

    // Revisão: 1,5% de R$ 500,00.
    expect(screen.getByText("1,5% · R$ 7,50")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 492,50")).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.review.confirm" }),
    );

    const authorize = screen.getByRole("button", {
      name: "Wallet.withdraw.pin.authorize",
    });
    expect(authorize).toBeDisabled();
    await user.type(
      screen.getByLabelText("Wallet.withdraw.pin.label"),
      "12a3456",
    );
    await user.click(authorize);

    expect(request).toHaveBeenCalledWith({
      amountMinor: 50_000,
      currency: "BRL",
      mode: "normal",
      accountId: "acc-pix",
      totp: "123456",
    });
    expect(
      await screen.findByText("Wallet.withdraw.receipt.title"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("SAQ-2026-008811").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Wallet.withdraw.receipt.back" }),
    ).toHaveAttribute("href", "/seller/wallet");
  });

  it("expresso cobra 3,5%", async () => {
    const { user } = renderFlow();

    await user.click(
      await screen.findByRole("button", { name: quick("R$ 1.000,00") }),
    );
    await user.click(
      screen.getByRole("radio", {
        name: /Wallet.withdraw.modes.express.title/,
      }),
    );
    await user.click(next());
    await user.click(next());

    expect(screen.getByText("3,5% · R$ 35,00")).toBeInTheDocument();
  });

  it("sem a rota de saque, volta ao PIN explicando que nada foi movimentado", async () => {
    const { user } = renderFlow();

    await user.click(
      await screen.findByRole("button", { name: quick("R$ 500,00") }),
    );
    await user.click(next());
    await user.click(next());
    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.review.confirm" }),
    );
    await user.type(
      screen.getByLabelText("Wallet.withdraw.pin.label"),
      "123456",
    );
    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.pin.authorize" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wallet.withdraw.pin.errors.unavailable",
    );
  });

  it("código recusado pede para conferir o autenticador", async () => {
    const request = vi.fn().mockRejectedValue(new AuthError(401));
    const { user } = renderFlow({ request });

    await user.click(
      await screen.findByRole("button", { name: quick("R$ 500,00") }),
    );
    await user.click(next());
    await user.click(next());
    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.review.confirm" }),
    );
    await user.type(
      screen.getByLabelText("Wallet.withdraw.pin.label"),
      "000000",
    );
    await user.click(
      screen.getByRole("button", { name: "Wallet.withdraw.pin.authorize" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Wallet.withdraw.pin.errors.invalidCode",
      ),
    );
  });

  it("sem contas cadastradas, o destino leva ao cadastro", async () => {
    const { user } = renderFlow({ accounts: [] });

    await user.click(
      await screen.findByRole("button", { name: quick("R$ 500,00") }),
    );
    await user.click(next());

    expect(
      screen.getByText("Wallet.withdraw.destination.empty"),
    ).toBeInTheDocument();
    expect(next()).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Wallet.withdraw.destination.add/ }),
    ).toHaveAttribute("href", "/seller/wallet/payment-methods/new?type=pix");
  });
});
