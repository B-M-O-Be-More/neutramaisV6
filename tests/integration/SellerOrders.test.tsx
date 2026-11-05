import { describe, expect, it, vi } from "vitest";

import SellerInboxTabs from "@/components/SellerInboxTabs";
import SellerOrdersFilters, {
  type SellerOrdersFiltersValue,
} from "@/components/SellerOrdersFilters";
import SellerOrdersInfo from "@/components/SellerOrdersInfo";
import SellerOrdersStats from "@/components/SellerOrdersStats";

import { renderWithProviders, screen } from "../test-utils";

const FILTERS: SellerOrdersFiltersValue = {
  search: "",
  specificationId: "",
  status: "all",
};

describe("Caixa de entrada do seller", () => {
  it("recolhe e fecha a explicação da caixa de entrada", async () => {
    const onDismiss = vi.fn();
    const { user } = renderWithProviders(
      <SellerOrdersInfo onDismiss={onDismiss} />,
    );

    expect(
      screen.getByText("SellerOrders.info.description"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "SellerOrders.info.collapse" }),
    );
    expect(
      screen.queryByText("SellerOrders.info.description"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SellerOrders.info.expand" }),
    ).toHaveAttribute("aria-expanded", "false");

    await user.click(
      screen.getByRole("button", { name: "SellerOrders.info.dismiss" }),
    );
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("alterna entre pedidos e RFQs e oculta o contador zerado", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <SellerInboxTabs
        value="orders"
        counts={{ orders: 0, rfq: 3 }}
        onChange={onChange}
      />,
    );

    const orders = screen.getByRole("tab", {
      name: "SellerOrders.tabs.orders",
    });
    expect(orders).toHaveAttribute("aria-selected", "true");
    const rfq = screen.getByRole("tab", { name: /^SellerOrders\.tabs\.rfq/ });
    expect(rfq).toHaveAttribute("aria-selected", "false");
    expect(rfq).toHaveTextContent("3");
    expect(orders).toHaveTextContent(/^SellerOrders\.tabs\.orders$/);

    await user.click(rfq);
    expect(onChange).toHaveBeenCalledWith("rfq");
  });

  it("mostra os quatro contadores da fila", () => {
    renderWithProviders(
      <SellerOrdersStats
        locale="pt-BR"
        data={{ monthTotal: 1200, awaiting: 2, accepted: 5, withIssue: 0 }}
      />,
    );

    expect(
      screen.getByText("SellerOrders.stats.monthTotal"),
    ).toBeInTheDocument();
    expect(screen.getByText("1.200")).toBeInTheDocument();
    expect(
      screen.getByText("SellerOrders.stats.withIssue"),
    ).toBeInTheDocument();
  });

  it("filtra por status, categoria e busca", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <SellerOrdersFilters
        value={FILTERS}
        onChange={onChange}
        specifications={[{ id: "spec-1", name: "Conectividade" }] as never}
        counts={{ awaiting: 1, accepted: 0 }}
      />,
    );

    expect(
      screen.getByRole("tab", { name: "SellerOrders.filters.statuses.all" }),
    ).toHaveAttribute("aria-selected", "true");
    // O contador só aparece quando há pedidos no status.
    expect(
      screen.getByRole("tab", {
        name: "SellerOrders.filters.statuses.awaiting 1",
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("tab", {
        name: "SellerOrders.filters.statuses.accepted",
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...FILTERS,
      status: "accepted",
    });

    await user.selectOptions(
      screen.getByRole("combobox", { name: "SellerOrders.filters.category" }),
      "spec-1",
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...FILTERS,
      specificationId: "spec-1",
    });

    await user.type(
      screen.getByRole("searchbox", { name: "SellerOrders.filters.search" }),
      "P",
    );
    expect(onChange).toHaveBeenLastCalledWith({ ...FILTERS, search: "P" });
  });
});
