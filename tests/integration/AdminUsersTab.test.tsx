import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminUsersTab from "@/components/AdminUsersTab";
import {
  adminService,
  type AdminOrganizationList,
  type AdminOrganizationSummary,
  type OrganizationStatus,
} from "@/services/admin.service";
import { ForbiddenError } from "@/services/errors";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/admin.service", async (original) => ({
  ...(await original<typeof import("@/services/admin.service")>()),
  adminService: { listOrganizations: vi.fn() },
}));

function organization(
  overrides: Partial<AdminOrganizationSummary>,
): AdminOrganizationSummary {
  return {
    id: "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90",
    legal_name: "Acme Telecom Servicos de Comunicacao Ltda",
    organization_type: "seller",
    status: "pending",
    kyc_level: "pending",
    country_code: "BR",
    tax_id_masked: "12****0195",
    created_at: "2026-08-06T14:32:10Z",
    ...overrides,
  };
}

const ACME = organization({});
const DATABRIDGE = organization({
  id: "018f4c2a-0000-7d64-a0e5-2f7c1b8d3e91",
  legal_name: "DataBridge Corp.",
  organization_type: "buyer",
  status: "active",
  kyc_level: "basic",
  tax_id_masked: "98****4321",
  created_at: "2026-09-01T10:00:00Z",
});
const NEUTRA = organization({
  id: "018f4c2a-1111-7d64-a0e5-2f7c1b8d3e92",
  legal_name: "Neutra+ (equipe interna)",
  organization_type: "platform_operator",
  status: "active",
  kyc_level: "complete",
  tax_id_masked: "11****1111",
  created_at: "2026-01-01T00:00:00Z",
});

const BY_STATUS: Partial<
  Record<OrganizationStatus, AdminOrganizationSummary[]>
> = { pending: [ACME], active: [DATABRIDGE, NEUTRA] };

function page(items: AdminOrganizationSummary[]): AdminOrganizationList {
  return { items, total: items.length, limit: 200, offset: 0 };
}

const rows = () => screen.getAllByRole("row").slice(1);

describe("AdminUsersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.listOrganizations).mockImplementation(
      async (params = {}) => page(BY_STATUS[params.status!] ?? []),
    );
  });

  it("com status Todos, consulta cada status e lista do cadastro mais novo", async () => {
    renderWithProviders(<AdminUsersTab locale="pt-BR" />);

    expect(
      await screen.findByRole("table", { name: "Admin.users.tableLabel" }),
    ).toBeInTheDocument();
    const statuses = vi
      .mocked(adminService.listOrganizations)
      .mock.calls.map(([params]) => params?.status);
    expect(statuses.sort()).toEqual(
      ["active", "anonymized", "pending", "suspended", "taken_down"].sort(),
    );
    expect(
      rows().map((row) => within(row).getAllByRole("cell")[0].textContent),
    ).toEqual([
      "DataBridge Corp.98****4321",
      "Acme Telecom Servicos de Comunicacao Ltda12****0195",
      "Neutra+ (equipe interna)11****1111",
    ]);
    expect(screen.getByText("Admin.users.count")).toBeInTheDocument();
  });

  it("filtra por busca (nome ou documento) e por tipo na tela", async () => {
    const { user } = renderWithProviders(<AdminUsersTab locale="pt-BR" />);
    await screen.findByRole("table");

    await user.type(screen.getByLabelText("Admin.filters.search"), "0195");
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]).getByText(ACME.legal_name)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Admin.filters.search"));
    await user.selectOptions(
      screen.getByLabelText("Admin.filters.typeLabel"),
      "platform_operator",
    );
    expect(rows()).toHaveLength(1);
    expect(within(rows()[0]).getByText(NEUTRA.legal_name)).toBeInTheDocument();
  });

  it("um status específico consulta só ele", async () => {
    const { user } = renderWithProviders(<AdminUsersTab locale="pt-BR" />);
    await screen.findByRole("table");
    vi.mocked(adminService.listOrganizations).mockClear();

    await user.selectOptions(
      screen.getByLabelText("Admin.filters.statusLabel"),
      "pending",
    );

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(adminService.listOrganizations).toHaveBeenCalledTimes(1);
    expect(adminService.listOrganizations).toHaveBeenCalledWith(
      { status: "pending", limit: 200, offset: 0 },
      expect.anything(),
    );
  });

  it("percorre as páginas até o total do status", async () => {
    const many = Array.from({ length: 201 }, (_, index) =>
      organization({
        id: `018f4c2a-9b31-7d64-a0e5-${String(index).padStart(12, "0")}`,
        legal_name: `Org ${index}`,
      }),
    );
    vi.mocked(adminService.listOrganizations).mockImplementation(
      async (params = {}) =>
        params.status === "pending"
          ? {
              items: many.slice(params.offset, params.offset! + 200),
              total: many.length,
              limit: 200,
              offset: params.offset!,
            }
          : page([]),
    );

    renderWithProviders(<AdminUsersTab locale="pt-BR" />);

    expect(
      await screen.findByRole("button", { name: "Admin.users.showMore" }),
    ).toBeInTheDocument();
    expect(adminService.listOrganizations).toHaveBeenCalledWith(
      { status: "pending", limit: 200, offset: 200 },
      expect.anything(),
    );
    expect(rows()).toHaveLength(50);
  });

  it("a ação de cada linha abre a página da organização", async () => {
    renderWithProviders(<AdminUsersTab locale="pt-BR" />);

    const links = await screen.findAllByRole("link", {
      name: "Admin.users.open",
    });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      `/admin/organizations/${DATABRIDGE.id}`,
      `/admin/organizations/${ACME.id}`,
      `/admin/organizations/${NEUTRA.id}`,
    ]);
  });

  it("sem permissão, explica e permite tentar de novo", async () => {
    vi.mocked(adminService.listOrganizations).mockRejectedValue(
      new ForbiddenError(403),
    );
    const { user } = renderWithProviders(<AdminUsersTab locale="pt-BR" />);

    expect(
      await screen.findByText("Admin.users.errors.forbidden"),
    ).toBeInTheDocument();

    vi.mocked(adminService.listOrganizations).mockImplementation(
      async (params = {}) => page(BY_STATUS[params.status!] ?? []),
    );
    await user.click(screen.getByRole("button", { name: "Admin.users.retry" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
