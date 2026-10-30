import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminOrganizationDetail from "@/components/AdminOrganizationDetail";
import {
  adminService,
  type AdminOrganizationDetail as Organization,
} from "@/services/admin.service";
import { ForbiddenError, NotFoundError } from "@/services/errors";
import { geoStorageService } from "@/services/geoStorage.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/admin.service", async (original) => ({
  ...(await original<typeof import("@/services/admin.service")>()),
  adminService: { getOrganization: vi.fn(), listOrganizationMembers: vi.fn() },
}));

vi.mock("@/services/geoStorage.service", () => ({
  geoStorageService: { getStorage: vi.fn(), updateQuota: vi.fn() },
}));

// Papéis de quem está logado: a cota é só do super_admin.
const session = vi.hoisted(() => ({ roles: [] as string[] }));
vi.mock("@/contexts/SessionContext", () => ({
  useSession: () => ({ profile: { id: "u1", roles: session.roles } }),
}));

const ORGANIZATION = "018f5d13-c1a7-7f35-84de-92b6c4017a5d";

const ACME: Organization = {
  id: ORGANIZATION,
  organization_type: "seller",
  status: "active",
  kyc_level: "verified",
  kyc_state: "approved",
  legal_name: "Acme Telecom Servicos de Comunicacao Ltda",
  trade_name: "Acme Telecom",
  country_code: "BR",
  tax_id_masked: "12****0195",
  contact_email: "operacoes@acmetelecom.com.br",
  created_at: "2026-08-06T14:32:10Z",
};

const MEMBERS = {
  items: [
    {
      user_id: "018f5d13-4e88-7c02-9b6f-1a3d7e5c0482",
      email: "operacoes@acmetelecom.com.br",
      role: "org_admin",
      status: "active",
      joined_at: "2026-08-06T14:32:10Z",
    },
    {
      user_id: "018f5d13-9999-7c02-9b6f-1a3d7e5c0483",
      email: "financeiro@acmetelecom.com.br",
      role: "seller_finance",
      status: "suspended",
      joined_at: "2026-09-01T10:00:00Z",
    },
  ],
  total: 2,
};

const STORAGE = {
  organizationId: ORGANIZATION,
  quotaMb: 500,
  usedMb: 122,
  availableMb: 378,
  overQuota: false,
  originalsMb: 100,
  geometriesMb: 20,
  metadataMb: 2,
  defaultQuotaMb: 200,
  maxQuotaMb: 1000,
};

const renderPage = () =>
  renderWithProviders(
    <AdminOrganizationDetail organizationId={ORGANIZATION} locale="pt-BR" />,
  );

const counter = (label: string) =>
  screen.getByText(`Admin.organizationDetail.counters.${label}`)
    .previousElementSibling?.textContent;

describe("AdminOrganizationDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.roles = [];
    vi.mocked(adminService.getOrganization).mockResolvedValue(ACME);
    vi.mocked(adminService.listOrganizationMembers).mockResolvedValue(MEMBERS);
    vi.mocked(geoStorageService.getStorage).mockResolvedValue(STORAGE);
  });

  it("mostra a organização, as informações e volta para a lista", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Acme Telecom" }),
    ).toBeInTheDocument();
    expect(adminService.getOrganization).toHaveBeenCalledWith(
      ORGANIZATION,
      expect.anything(),
    );
    expect(screen.getByText(ACME.legal_name)).toBeInTheDocument();
    expect(screen.getByText("12****0195")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Admin.organizationDetail.back/ }),
    ).toHaveAttribute("href", "/admin?tab=users");
  });

  it("conta e lista os usuários, com busca por e-mail", async () => {
    const { user } = renderPage();

    const table = await screen.findByRole("table", {
      name: "Admin.organizationDetail.members.tableLabel",
    });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(counter("users")).toBe("2");
    expect(counter("active")).toBe("1");
    expect(counter("suspended")).toBe("1");

    await user.type(
      screen.getByLabelText("Admin.organizationDetail.members.search"),
      "financeiro",
    );
    expect(within(table).getAllByRole("row")).toHaveLength(2);
    expect(
      within(table).getByText("financeiro@acmetelecom.com.br"),
    ).toBeInTheDocument();
  });

  it("aceita a resposta atual dos membros (só id e papel)", async () => {
    vi.mocked(adminService.listOrganizationMembers).mockResolvedValue({
      items: [
        { user_id: "018f5d13-4e88-7c02-9b6f-1a3d7e5c0482", role: "org_owner" },
      ],
      total: 1,
    });
    renderPage();

    const table = await screen.findByRole("table");
    expect(within(table).getByText("018f5d13")).toBeInTheDocument();
    expect(counter("users")).toBe("1");
    expect(counter("active")).toBe("0");
  });

  it("sem acesso aos membros, explica e não inventa contagens", async () => {
    vi.mocked(adminService.listOrganizationMembers).mockRejectedValue(
      new ForbiddenError(403),
    );
    renderPage();

    expect(
      await screen.findByText(
        "Admin.organizationDetail.members.errors.forbidden",
      ),
    ).toBeInTheDocument();
    expect(counter("users")).toBe("—");
  });

  it("super_admin vê a cota e abre o diálogo por Atualizar cotas", async () => {
    session.roles = ["super_admin"];
    const { user } = renderPage();

    expect(await screen.findByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "24",
    );
    await user.click(
      screen.getByRole("button", {
        name: /Admin.organizationDetail.updateQuota/,
      }),
    );
    expect(
      await screen.findByRole("dialog", {
        name: "CoverageStorage.quota.title",
      }),
    ).toBeInTheDocument();
  });

  it("sem super_admin, não consulta nem mostra a cota", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Acme Telecom" });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Admin.organizationDetail.updateQuota/,
      }),
    ).not.toBeInTheDocument();
    expect(geoStorageService.getStorage).not.toHaveBeenCalled();
  });

  it("recolhe as informações da empresa", async () => {
    const { user } = renderPage();

    const toggle = await screen.findByRole("button", {
      name: "Admin.organizationDetail.info.collapse",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);

    await waitFor(() =>
      expect(
        screen.queryByText("Admin.organizationDetail.info.fields.legalName"),
      ).not.toBeInTheDocument(),
    );
  });

  it("organização inexistente mostra o aviso, sem tentar de novo", async () => {
    vi.mocked(adminService.getOrganization).mockRejectedValue(
      new NotFoundError(404),
    );
    renderPage();

    expect(
      await screen.findByText("Admin.organizationDetail.errors.notFound"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Admin.organizationDetail.retry" }),
    ).not.toBeInTheDocument();
  });
});
