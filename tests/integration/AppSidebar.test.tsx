import { describe, expect, it, vi } from "vitest";

import AppSidebar from "@/components/AppSidebar";

import { renderWithProviders, screen } from "../test-utils";

// A rota atual define o item ativo — sobrescreve o stub global ("/").
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/search-network",
}));

function itemLinks() {
  return screen
    .getAllByRole("link")
    .map((link) => link.textContent)
    .filter((text) => text?.startsWith("AppSidebar.items."));
}

describe("AppSidebar", () => {
  it("buyer vê Buscar Rede, Minhas Redes, Carteira e Meu Perfil", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["buyer"] }} />,
    );

    expect(screen.getByText("AppSidebar.personas.buyer")).toBeInTheDocument();
    expect(
      screen.queryByText("AppSidebar.personas.seller"),
    ).not.toBeInTheDocument();
    expect(itemLinks()).toEqual([
      "AppSidebar.items.searchNetwork",
      "AppSidebar.items.myNetworks",
      "AppSidebar.items.wallet",
      "AppSidebar.items.profile",
    ]);
  });

  it("seller vê Buscar Rede, Minhas Ofertas, Carteira e Meu Perfil", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["seller"] }} />,
    );

    expect(itemLinks()).toEqual([
      "AppSidebar.items.searchNetwork",
      "AppSidebar.items.sellerOffers",
      "AppSidebar.items.wallet",
      "AppSidebar.items.profile",
    ]);
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

    const other = screen.getByRole("link", {
      name: "AppSidebar.items.wallet",
    });
    expect(other).not.toHaveAttribute("aria-current");
  });

  it("admin vê o KYC (painel) e os Operadores", () => {
    renderWithProviders(
      <AppSidebar
        user={{ name: "Maria Azevedo", personas: ["admin"] }}
        badges={{ kyc: 8 }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "AppSidebar.items.kyc 8" }),
    ).toHaveAttribute("href", "/admin");
    expect(
      screen.getByRole("link", { name: "AppSidebar.items.platformInvites" }),
    ).toHaveAttribute("href", "/admin/platform-invites");
    expect(itemLinks()).toHaveLength(2);
    // O grupo admin começa direto nas seções, sem o título do papel.
    expect(
      screen.queryByText("AppSidebar.personas.admin"),
    ).not.toBeInTheDocument();
  });

  it("mostra as iniciais e o nome do usuário", () => {
    renderWithProviders(
      <AppSidebar user={{ name: "Maria Azevedo", personas: ["buyer"] }} />,
    );

    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(screen.getByText("Maria Azevedo")).toBeInTheDocument();
  });
});
