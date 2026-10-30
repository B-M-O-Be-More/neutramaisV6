import { beforeEach, describe, expect, it, vi } from "vitest";

import WalletOverview from "@/components/WalletOverview";
import { ForbiddenError } from "@/services/errors";
import {
  walletService,
  type WalletTransaction,
} from "@/services/wallet.service";

import { renderWithProviders, screen } from "../test-utils";

vi.mock("@/services/wallet.service", () => ({
  walletService: { getBalance: vi.fn(), listTransactions: vi.fn() },
}));

const NOW = new Date("2026-10-29T10:00:00");
const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function transaction(
  id: string,
  overrides: Partial<WalletTransaction> = {},
): WalletTransaction {
  return {
    id,
    kind: "credit",
    currency: "BRL",
    amountMinor: 2450000,
    orderId: `ORD-${id}`,
    paymentId: `pay-${id}`,
    allocationId: `alloc-${id}`,
    cancellationId: `cancel-${id}`,
    externalPaidMinor: 2450000,
    walletPaidMinor: 0,
    createdAt: at("2026-10-26T12:00:00"),
    ...overrides,
  };
}

const TRANSACTIONS = [
  transaction("1"),
  transaction("2", {
    kind: "debit",
    amountMinor: 10999,
    cancellationId: null,
    createdAt: at("2026-10-20T12:00:00"),
  }),
  ...["3", "4", "5", "6"].map((id) =>
    transaction(id, { amountMinor: 100, createdAt: at("2026-09-10T12:00:00") }),
  ),
];

function renderWallet(variant: "buyer" | "seller") {
  return renderWithProviders(
    <WalletOverview variant={variant} locale="pt-BR" now={NOW} />,
  );
}

describe("WalletOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletService.getBalance).mockResolvedValue({
      organizationId: "org-1",
      currency: "BRL",
      availableMinor: 2474403,
      reservedMinor: 0,
    });
    vi.mocked(walletService.listTransactions).mockResolvedValue({
      items: TRANSACTIONS,
      nextCursor: null,
    });
  });

  it("mostra o saldo, o movimento do mês e os últimos lançamentos", async () => {
    renderWallet("buyer");

    expect(await screen.findByText("R$ 24.744")).toBeInTheDocument();
    expect(screen.getByText("R$ 24.744,03")).toBeInTheDocument();
    // Só outubro entra nos totais do mês.
    expect(await screen.findByText("R$ 24.500,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 109,99")).toBeInTheDocument();

    expect(screen.getByText("+R$ 24.500,00")).toBeInTheDocument();
    expect(screen.getByText("-R$ 109,99")).toBeInTheDocument();
    // A lista mostra os 5 mais recentes.
    expect(screen.getByText("ORD-5")).toBeInTheDocument();
    expect(screen.queryByText("ORD-6")).not.toBeInTheDocument();

    expect(walletService.listTransactions).toHaveBeenCalledWith(
      { currency: "BRL", limit: 100 },
      expect.anything(),
    );
  });

  it("buyer não vê os blocos de recebimento do seller", async () => {
    renderWallet("buyer");

    expect(
      await screen.findByRole("heading", { name: "Wallet.buyer.title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet.methods.paymentTitle")).toBeInTheDocument();
    expect(
      screen.queryByText("Wallet.methods.payoutTitle"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Wallet.seller.notice.title"),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Wallet.methods.add/ })[0],
    ).toHaveAttribute("href", "/wallet/payment-methods/new");
    expect(
      screen.getByRole("link", { name: "Wallet.transactions.viewAll" }),
    ).toHaveAttribute("href", "/wallet/transactions");
  });

  it("seller vê o aviso, as contas de recebimento e as ações bloqueadas", async () => {
    const { user } = renderWallet("seller");

    expect(
      await screen.findByRole("heading", { name: "Wallet.seller.title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet.methods.payoutTitle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Wallet.seller.advance" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Wallet.seller.payout" }),
    ).toBeDisabled();

    // Conta de recebimento abre o cadastro direto no PIX.
    const payoutLinks = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(payoutLinks).toContain(
      "/seller/wallet/payment-methods/new?type=pix",
    );
    expect(payoutLinks).toContain("/seller/wallet/transactions");

    await user.click(
      screen.getByRole("button", { name: "Wallet.seller.notice.dismiss" }),
    );
    expect(
      screen.queryByText("Wallet.seller.notice.title"),
    ).not.toBeInTheDocument();
  });

  it("explica quando o perfil não tem acesso à carteira", async () => {
    vi.mocked(walletService.getBalance).mockRejectedValue(
      new ForbiddenError(403),
    );

    renderWallet("buyer");

    expect(
      await screen.findByText("Wallet.errors.forbidden"),
    ).toBeInTheDocument();
  });

  it("mostra a carteira vazia sem lançamentos", async () => {
    vi.mocked(walletService.listTransactions).mockResolvedValue({
      items: [],
      nextCursor: null,
    });

    renderWallet("buyer");

    expect(
      await screen.findByText("Wallet.transactions.empty"),
    ).toBeInTheDocument();
  });
});
