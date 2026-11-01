import { describe, expect, it, vi } from "vitest";

import CartBlockedNotice from "@/components/CartBlockedNotice";
import CartItemRow from "@/components/CartItemRow";
import CartSummaryCard from "@/components/CartSummaryCard";
import type { CartLine } from "@/functions/cartView";

import { renderWithProviders, screen } from "../test-utils";

const LINE: CartLine = {
  entry: { offeringId: "offer-1", quantity: 2 },
  snapshot: {
    schemaVersion: 2,
    offeringId: "offer-1",
    sellerOrganizationId: "seller-a",
    revision: 1,
    snapshotVersion: "a".repeat(64),
    name: "OLT GPON 16 portas",
    pricingMode: "fixed",
    currency: "BRL",
    prices: [
      {
        id: "p1",
        priceType: "one_time",
        currency: "BRL",
        amount: "12490.00",
        recurringPeriod: null,
        minQuantity: 1,
        maxQuantity: null,
      },
    ],
    durationMonths: null,
    speed: null,
    productType: "physical",
    stockQuantity: 2,
    purchaseLimitPerAccount: null,
    specification: {
      id: "spec-1",
      name: "Hardware e CPE",
      estimatedInstallationDays: null,
    },
    shipping: { postingDays: 3 },
  },
  price: {
    totalMinor: 2498000,
    parts: [
      {
        price: {
          id: "p1",
          priceType: "one_time",
          currency: "BRL",
          amount: "12490.00",
          recurringPeriod: null,
          minQuantity: 1,
          maxQuantity: null,
        },
        unitMinor: 1249000,
      },
    ],
  },
  maxQuantity: 2,
  problem: null,
};

describe("Carrinho", () => {
  it("item mostra o preço da linha e respeita o estoque", async () => {
    const onQuantityChange = vi.fn();
    const onRemove = vi.fn();
    const { user } = renderWithProviders(
      <ul>
        <CartItemRow
          line={LINE}
          index={0}
          locale="pt-BR"
          onQuantityChange={onQuantityChange}
          onRemove={onRemove}
        />
      </ul>,
    );

    expect(screen.getByText("Hardware e CPE")).toBeInTheDocument();
    expect(screen.getByText(/24\.980,00/)).toBeInTheDocument();
    expect(screen.getByText("Cart.item.shipping")).toBeInTheDocument();
    // No estoque máximo, só dá para diminuir.
    expect(
      screen.getByRole("button", { name: "Cart.item.increase" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Cart.item.decrease" }),
    );
    expect(onQuantityChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole("button", { name: "Cart.item.remove" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("KYC reprovado leva à tela de KYC; em análise não tem ação", () => {
    const { unmount } = renderWithProviders(
      <CartBlockedNotice reason="rejected" />,
    );
    expect(
      screen.getByRole("link", { name: "Cart.blocked.rejected.action" }),
    ).toHaveAttribute("href", "/kyc");
    unmount();

    renderWithProviders(<CartBlockedNotice reason="inReview" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cart.blocked.inReview.title",
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("resumo abate o crédito e bloqueia moedas misturadas", () => {
    const { rerender } = renderWithProviders(
      <CartSummaryCard
        subtotals={new Map([["BRL", 1987000]])}
        creditMinor={320000}
        hasPhysical
        locale="pt-BR"
        canCheckout
        onCheckout={vi.fn()}
      />,
    );

    expect(screen.getByText(/3\.200,00/)).toBeInTheDocument();
    expect(screen.getByText(/16\.670,00/)).toBeInTheDocument();
    expect(screen.getByText("Cart.summary.atPayment")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cart.summary.checkout" }),
    ).toBeEnabled();

    rerender(
      <CartSummaryCard
        subtotals={
          new Map([
            ["BRL", 1987000],
            ["USD", 289000],
          ])
        }
        creditMinor={0}
        hasPhysical={false}
        locale="pt-BR"
        notice="Cart.summary.mixedCurrencies"
        canCheckout={false}
        onCheckout={vi.fn()}
      />,
    );
    expect(screen.getAllByText("Cart.summary.subtotalIn")).toHaveLength(2);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cart.summary.mixedCurrencies",
    );
    expect(
      screen.getByRole("button", { name: "Cart.summary.checkout" }),
    ).toBeDisabled();
  });
});
