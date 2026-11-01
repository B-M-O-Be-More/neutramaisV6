import { beforeEach, describe, expect, it, vi } from "vitest";

import WalletOverview from "@/components/WalletOverview";
import { ForbiddenError } from "@/services/errors";
import {
  sellerPayoutService,
  type SellerReceivable,
} from "@/services/sellerPayout.service";
import {
  walletService,
  type WalletTransaction,
} from "@/services/wallet.service";

import { renderWithProviders, screen } from "../test-utils";

vi.mock("@/services/wallet.service", () => ({
  walletService: { getBalance: vi.fn(), listTransactions: vi.fn() },
}));

vi.mock("@/services/sellerPayout.service", () => ({
  sellerPayoutService: {
    listReceivables: vi.fn(),
    listShippingCostDebts: vi.fn(),
  },
}));

const receivable = (overrides: Partial<SellerReceivable> = {}) => ({
  allocationId: "a-1",
  orderId: "o-1",
  sellerOrganizationId: "org-1",
  currency: "BRL",
  grossMinor: 1_890_000,
  feeMinor: 210_000,
  netMinor: 1_680_000,
  eligible: false,
  batchId: null,
  cancellationId: null,
  ...overrides,
});

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
  // A wallet-api devolve o débito negativo.
  transaction("2", {
    kind: "debit",
    amountMinor: -10999,
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
    vi.mocked(sellerPayoutService.listReceivables).mockResolvedValue([
      receivable(),
      // Já repassado: só a taxa conta.
      receivable({ allocationId: "a-2", batchId: "batch-1" }),
      // Cancelado: fica de fora.
      receivable({ allocationId: "a-3", cancellationId: "c-1" }),
    ]);
    vi.mocked(sellerPayoutService.listShippingCostDebts).mockResolvedValue([]);
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
    // A carteira do buyer não lê os recebimentos do seller.
    expect(sellerPayoutService.listReceivables).not.toHaveBeenCalled();
  });

  it("seller vê o aviso, as contas de recebimento e Sacar", async () => {
    const { user } = renderWallet("seller");

    expect(
      await screen.findByRole("heading", { name: "Wallet.seller.title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet.methods.payoutTitle")).toBeInTheDocument();
    expect(
      screen.queryByText("Wallet.methods.paymentTitle"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Wallet.seller.advance" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Wallet.seller.payout" }),
    ).toHaveAttribute("href", "/seller/wallet/withdraw");

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

  it("seller vê o a receber e as taxas da payment-api", async () => {
    renderWallet("seller");

    // A receber: só o recebível fora de lote e não cancelado.
    expect(await screen.findByText("R$ 16.800")).toBeInTheDocument();
    expect(
      screen.getByText("Wallet.seller.balance.toReceive.label"),
    ).toBeInTheDocument();
    // Taxas: os dois não cancelados.
    expect(screen.getByText("R$ 4.200,00")).toBeInTheDocument();
    expect(
      screen.queryByText("Wallet.seller.debt.message"),
    ).not.toBeInTheDocument();
  });

  it("seller com dívida de frete vê o aviso com o total", async () => {
    vi.mocked(sellerPayoutService.listShippingCostDebts).mockResolvedValue([
      {
        reference: "shipping-cost:o-1:1",
        orderId: "o-1",
        sellerOrganizationId: "org-1",
        currency: "BRL",
        amountMinor: 1_000_000,
        eventId: "e-1",
        occurredAt: "2026-10-28T14:05:11Z",
        status: "recorded",
        automaticallyDeducted: false,
      },
    ]);

    renderWallet("seller");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Wallet.seller.debt.message",
    );
  });

  it("seller sem payment:read vê o motivo nos cards de recebimento", async () => {
    vi.mocked(sellerPayoutService.listReceivables).mockRejectedValue(
      new ForbiddenError(403),
    );

    renderWallet("seller");

    expect(
      await screen.findAllByText("Wallet.seller.errors.receivablesForbidden"),
    ).toHaveLength(2);
  });

  it("seller troca a moeda do histórico", async () => {
    const { user } = renderWallet("seller");

    await user.selectOptions(
      await screen.findByRole("combobox", {
        name: "Wallet.transactions.currency",
      }),
      "USD",
    );

    expect(walletService.listTransactions).toHaveBeenCalledWith(
      { currency: "USD", limit: 5 },
      expect.anything(),
    );
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
