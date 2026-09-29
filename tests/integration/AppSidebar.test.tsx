import { describe, expect, it, vi } from "vitest";

import AppSidebar from "@/components/AppSidebar";

import { renderWithProviders, screen } from "../test-utils";

// A rota atual define o item ativo — sobrescreve o stub global ("/").
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/search-network",
}));

describe("AppSidebar", () => {
  it("mostra só o grupo do papel da organização", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["buyer"] }} />,
    );

    expect(screen.getByText("AppSidebar.personas.buyer")).toBeInTheDocument();
    expect(
      screen.queryByText("AppSidebar.personas.seller"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("AppSidebar.items.receivedOrders"),
    ).not.toBeInTheDocument();
  });

  it("mostra os dois grupos para quem compra e vende", () => {
    renderWithProviders(
      <AppSidebar
        user={{ name: "Maria Azevedo", personas: ["buyer", "seller"] }}
      />,
    );

    expect(screen.getByText("AppSidebar.personas.buyer")).toBeInTheDocument();
    expect(screen.getByText("AppSidebar.personas.seller")).toBeInTheDocument();
  });

  it("marca o item da rota atual como página ativa", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["buyer"] }} />,
    );

    const active = screen.getByRole("link", {
      name: "AppSidebar.items.searchNetwork",
    });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("href", "/search-network");

    const other = screen.getByRole("link", { name: "AppSidebar.items.home" });
    expect(other).not.toHaveAttribute("aria-current");
  });

  it("exibe contadores só quando há pendências", () => {
    renderWithProviders(
      <AppSidebar
        user={{ name: "Maria Azevedo", personas: ["buyer"] }}
        badges={{ proposals: 3, disputes: 0 }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "AppSidebar.items.proposals 3" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AppSidebar.items.disputes" }),
    ).toBeInTheDocument();
  });

  it("mostra as iniciais e o nome do usuário", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["buyer"] }} />,
    );

    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("Maria Azevedo")).toBeInTheDocument();
  });
});
