import { describe, expect, it } from "vitest";

import DashboardFeaturedOffers from "@/components/DashboardFeaturedOffers";
import DashboardQuickAccess from "@/components/DashboardQuickAccess";
import DashboardSellerPerformance from "@/components/DashboardSellerPerformance";
import DashboardStats from "@/components/DashboardStats";

import { renderWithProviders, screen } from "../test-utils";

describe("DashboardStats", () => {
  it("exibe os quatro indicadores com os valores recebidos", () => {
    renderWithProviders(
      <DashboardStats
        data={{
          activeOrders: "300",
          ordersInProgress: 2,
          openRfqs: "5",
          rfqsWithProposal: 2,
          availableCredit: "R$ 204.744",
          activeContracts: "2",
          renewingContracts: 1,
          nextRenewalDays: 6,
        }}
      />,
    );

    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("R$ 204.744")).toBeInTheDocument();
    expect(
      screen.getByText("Dashboard.stats.activeContracts"),
    ).toBeInTheDocument();
  });
});

describe("DashboardQuickAccess", () => {
  it("leva cada atalho para a rota da área", () => {
    renderWithProviders(<DashboardQuickAccess walletCredit="R$ 24.744" />);

    expect(
      screen.getByRole("link", {
        name: /Dashboard.quickAccess.searchNetwork.title/,
      }),
    ).toHaveAttribute("href", "/search-network");
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("mostra o contador de propostas só quando há pendências", () => {
    const { rerender } = renderWithProviders(
      <DashboardQuickAccess walletCredit="R$ 24.744" pendingProposals={3} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();

    rerender(
      <DashboardQuickAccess walletCredit="R$ 24.744" pendingProposals={0} />,
    );
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });
});

describe("DashboardFeaturedOffers", () => {
  it("monta a linha do provedor e leva o Comprar para a oferta", () => {
    renderWithProviders(
      <DashboardFeaturedOffers
        viewAllHref="/offers"
        offers={[
          {
            id: "1",
            title: "ONT Gpon",
            provider: "BRX Telecom",
            category: "Hardware",
            price: "R$ 24.500,00",
            href: "/offers/1",
          },
        ]}
      />,
    );

    expect(
      screen.getByText("BRX Telecom · Hardware · Dashboard.featuredOffers.sla"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Dashboard.featuredOffers.buy" }),
    ).toHaveAttribute("href", "/offers/1");
  });
});

describe("DashboardSellerPerformance", () => {
  it("limita as barras de indicadores a 0–100%", () => {
    renderWithProviders(
      <DashboardSellerPerformance
        reportHref="/seller/score"
        data={{
          rating: 4.8,
          reviewCount: 124,
          acceptanceSla: 95,
          onTimeDelivery: 140,
        }}
      />,
    );

    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "95");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });
});
