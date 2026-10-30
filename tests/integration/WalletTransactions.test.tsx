import { beforeEach, describe, expect, it, vi } from "vitest";

import WalletTransactions from "@/components/WalletTransactions";
import { downloadTextFile } from "@/functions/downloadTextFile";
import {
  walletService,
  type WalletTransaction,
} from "@/services/wallet.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/wallet.service", () => ({
  walletService: { getBalance: vi.fn(), listTransactions: vi.fn() },
}));
vi.mock("@/functions/downloadTextFile", () => ({
  downloadTextFile: vi.fn(),
}));

const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

function transaction(
  id: string,
  overrides: Partial<WalletTransaction> = {},
): WalletTransaction {
  return {
    id,
    kind: "credit",
    currency: "BRL",
    amountMinor: 320000,
    orderId: `ORD-2026-${id}`,
    paymentId: `pay-${id}`,
    allocationId: `alloc-${id}`,
    cancellationId: `cancel-${id}`,
    externalPaidMinor: 320000,
    walletPaidMinor: 0,
    createdAt: at("2026-10-10T12:00:00"),
    ...overrides,
  };
}

const FIRST_PAGE = [
  transaction("009"),
  transaction("002", {
    kind: "debit",
    amountMinor: 1680000,
    cancellationId: null,
    createdAt: at("2026-07-06T12:00:00"),
  }),
];

const rows = () =>
  screen
    .getAllByText(/Wallet.transactions.kinds/)
    .map((row) => row.textContent);

describe("WalletTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(walletService.listTransactions).mockImplementation(
      async (params) =>
        params?.cursor
          ? {
              items: [
                transaction("010", {
                  kind: "debit",
                  cancellationId: null,
                  createdAt: at("2026-06-15T12:00:00"),
                }),
              ],
              nextCursor: null,
            }
          : { items: FIRST_PAGE, nextCursor: "41" },
    );
  });

  function renderHistory() {
    return renderWithProviders(
      <WalletTransactions backHref="/seller/wallet" locale="pt-BR" />,
    );
  }

  it("lista os lançamentos com situação, valor e indicadores", async () => {
    renderHistory();

    expect(await screen.findByText("+R$ 3.200,00")).toBeInTheDocument();
    expect(screen.getByText("-R$ 16.800,00")).toBeInTheDocument();
    expect(
      screen.getAllByText("Wallet.transactions.status.completed"),
    ).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Wallet.back" })).toHaveAttribute(
      "href",
      "/seller/wallet",
    );
    expect(walletService.listTransactions).toHaveBeenCalledWith(
      { currency: "BRL", limit: 50 },
      expect.anything(),
    );
  });

  it("filtra por créditos, débitos e escrow", async () => {
    const { user } = renderHistory();
    await screen.findByText("+R$ 3.200,00");

    await user.click(
      screen.getByRole("button", { name: "Wallet.transactions.filter.debits" }),
    );
    expect(screen.queryByText("+R$ 3.200,00")).not.toBeInTheDocument();
    expect(screen.getByText("-R$ 16.800,00")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Wallet.transactions.filter.escrow" }),
    );
    expect(
      screen.getByText("Wallet.transactions.emptyFiltered"),
    ).toBeInTheDocument();
  });

  it("busca pela referência do pedido", async () => {
    const { user } = renderHistory();
    await screen.findByText("+R$ 3.200,00");

    await user.type(
      screen.getByRole("textbox", {
        name: "Wallet.transactions.searchPlaceholder",
      }),
      "ord-2026-002",
    );

    expect(screen.getByText("-R$ 16.800,00")).toBeInTheDocument();
    expect(screen.queryByText("+R$ 3.200,00")).not.toBeInTheDocument();
  });

  it("filtra pelo período", async () => {
    const { user, container } = renderHistory();
    await screen.findByText("+R$ 3.200,00");

    await user.click(
      screen.getByRole("button", { name: "Wallet.transactions.filters" }),
    );
    const [from] =
      container.querySelectorAll<HTMLInputElement>('input[type="date"]');
    await user.type(from, "2026-10-01");

    expect(screen.getByText("+R$ 3.200,00")).toBeInTheDocument();
    expect(screen.queryByText("-R$ 16.800,00")).not.toBeInTheDocument();
  });

  it("carrega os lançamentos mais antigos pelo cursor", async () => {
    const { user } = renderHistory();
    await screen.findByText("+R$ 3.200,00");
    expect(rows()).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "Wallet.transactions.loadMore" }),
    );

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(walletService.listTransactions).toHaveBeenLastCalledWith({
      currency: "BRL",
      limit: 50,
      cursor: "41",
    });
    expect(
      screen.queryByRole("button", { name: "Wallet.transactions.loadMore" }),
    ).not.toBeInTheDocument();
  });

  it("exporta em CSV o que está filtrado", async () => {
    const { user } = renderHistory();
    await screen.findByText("+R$ 3.200,00");

    await user.click(
      screen.getByRole("button", {
        name: "Wallet.transactions.filter.credits",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Wallet.transactions.export" }),
    );

    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [fileName, content, mimeType] =
      vi.mocked(downloadTextFile).mock.calls[0];
    expect(fileName).toMatch(/^transacoes-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(mimeType).toBe("text/csv");
    const lines = content.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("ORD-2026-009");
  });

  it("oferece tentar de novo quando o extrato falha", async () => {
    vi.mocked(walletService.listTransactions).mockRejectedValueOnce(
      new Error("offline"),
    );
    const { user } = renderHistory();

    const alert = await screen.findByText("Wallet.errors.transactionsFailed");
    await user.click(
      within(alert.parentElement as HTMLElement).getByRole("button", {
        name: "Wallet.retry",
      }),
    );

    expect(await screen.findByText("+R$ 3.200,00")).toBeInTheDocument();
  });
});
