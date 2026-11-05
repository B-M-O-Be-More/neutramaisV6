import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import SellerServiceOrdersLayout from "@/app/seller/service-orders/layout";
import SellerServiceOrdersPage from "@/app/seller/service-orders/page";
import ServiceOrderItemsPage from "@/app/seller/service-orders/[orderId]/page";
import ServiceOrderDetailPage from "@/app/seller/service-orders/[orderId]/[itemId]/page";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));

vi.mock("next/navigation", () => ({
  useParams: () => params.value,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/seller/service-orders",
}));

// A casca autenticada (sessão, sidebar) não interessa aqui.
vi.mock("@/components/Layouts/Authenticated", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// O Mapbox não roda no jsdom.
vi.mock("@/components/CoverageMap", () => ({
  default: ({ label }: { label: string }) => (
    <div role="img" aria-label={label} />
  ),
}));

function renderPage(page: ReactNode) {
  return renderWithProviders(
    <SellerServiceOrdersLayout>{page}</SellerServiceOrdersLayout>,
  );
}

describe("Ordens de serviço do seller", { timeout: 20_000 }, () => {
  it("lista as ordens com status, busca e filtros", async () => {
    const { user } = renderPage(<SellerServiceOrdersPage />);

    expect(
      screen.getByRole("heading", { name: "ServiceOrders.title" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(7);
    const colocation = screen.getByRole("article", {
      name: "Colocation 2U São Paulo Metro",
    });
    expect(
      within(colocation).getByText("ServiceOrders.order.status.held"),
    ).toBeInTheDocument();
    expect(
      within(colocation).getByRole("link", {
        name: "ServiceOrders.card.details",
      }),
    ).toHaveAttribute("href", "/seller/service-orders/ORD-2026-002");

    await user.type(
      screen.getByRole("searchbox", { name: "ServiceOrders.search" }),
      "fastnet",
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await user.clear(screen.getByRole("searchbox"));

    await user.click(
      screen.getByRole("button", { name: "ServiceOrders.filters" }),
    );
    await user.click(
      screen.getByRole("tab", { name: /ServiceOrders.order.status.credited/ }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "ServiceOrders.order.viewCredit" }),
    ).toBeInTheDocument();
  });

  it('demandas: abre o card no "Ver OS" e recolhe', async () => {
    params.value = { orderId: "ORD-2026-001" };
    const { user } = renderPage(<ServiceOrderItemsPage />);

    expect(
      screen.getByRole("heading", { name: "ServiceOrders.items.title" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);

    const card = screen.getByRole("article", {
      name: "Internet Fibra Premium 500 Mbps",
    });
    await user.click(
      within(card).getByRole("button", { name: "ServiceOrders.item.expand" }),
    );

    const expanded = screen.getByRole("article", {
      name: "Internet Fibra Premium 500 Mbps · OS-2026-0041",
    });
    expect(
      within(expanded).getByText("ServiceOrders.item.tiles.orderId"),
    ).toBeInTheDocument();
    expect(within(expanded).getByText("ORD-2026-001")).toBeInTheDocument();

    await user.click(
      within(expanded).getByRole("button", {
        name: "ServiceOrders.item.collapse",
      }),
    );
    expect(
      screen.queryByRole("article", {
        name: "Internet Fibra Premium 500 Mbps · OS-2026-0041",
      }),
    ).not.toBeInTheDocument();
  });

  it("detalhe pendente: adiciona técnico e inicia a execução", async () => {
    params.value = { orderId: "ORD-2026-003", itemId: "OS-2026-0038" };
    const { user } = renderPage(<ServiceOrderDetailPage />);

    expect(
      screen.getByRole("heading", {
        name: "Bloco IPv4 /24 — Transferência assistida",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ServiceOrders.detail.technicians.empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "ServiceOrders.detail.actions.start",
      }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: "ServiceOrders.detail.actions.addTechnician",
      }),
    );
    await user.click(
      await screen.findByRole("radio", { name: /Pedro Ortega/ }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "ServiceOrders.technician.confirmAdd",
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "ServiceOrders.startPrompt.start",
      }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "ServiceOrders.detail.actions.complete",
        }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByText("ServiceOrders.detail.actions.completeBlocked"),
    ).toBeInTheDocument();
    // "Registrar" é o rótulo do campo de arquivo de cada slot pendente.
    expect(
      screen.getAllByLabelText(/ServiceOrders.detail.evidences.register/),
    ).toHaveLength(2);
    expect(
      screen.getByText("ServiceOrders.chat.technicianStarted"),
    ).toBeInTheDocument();
  });
});
