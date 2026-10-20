import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminKycQueue from "@/components/AdminKycQueue";
import {
  useAdminKycQueue,
  type AdminKycQueueFilters,
} from "@/hooks/useAdminKycQueue";
import {
  adminService,
  type KycQueue,
  type KycQueueItem,
} from "@/services/admin.service";
import { apiErrorFromResponse } from "@/services/errors";

import { fireEvent, renderWithProviders, screen, waitFor } from "../test-utils";

function item(overrides: Partial<KycQueueItem>): KycQueueItem {
  return {
    request_id: "KYC-018F4C2A",
    organization_id: "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90",
    organization_name: "Acme Telecom",
    organization_type: "seller",
    country_code: "BR",
    tax_id: "12345678000195",
    tax_id_kind: "CNPJ",
    status: "enviado",
    kyc_state: "under_review",
    kyc_level: "basic",
    requested_level: "verified",
    registered_at: "2026-10-02T13:05:41Z",
    submitted_at: "2026-10-14T18:20:03Z",
    documents: { sent: 5, required: 6, pending: 1, missing_types: [] },
    sla: {
      state: "em_andamento",
      limit_business_hours: 72,
      started_at: "2026-10-14T18:20:03Z",
      deadline_at: "2026-10-19T18:20:03Z",
      remaining_business_hours: 49.5,
    },
    alerts: [
      { code: "scm_pendente", status: "ativo" },
      { code: "sancao", status: "nao_verificado" },
    ],
    flags: { em_revisao: false, revisao_especial: false },
    ...overrides,
  };
}

const ACME = item({});
const NEXUS = item({
  request_id: "KYC-0190B1C2",
  organization_id: "0190b1c2-3d4e-7f80-a1b2-c3d4e5f60718",
  organization_name: "Nexus Internet S.A.",
  organization_type: "buyer",
  alerts: [],
  flags: { em_revisao: false, revisao_especial: true },
});

function queue(items: KycQueueItem[], total = items.length): KycQueue {
  return {
    items,
    total,
    limit: 50,
    offset: 0,
    indicators: {
      total: 5,
      pending: 3,
      rejected: 1,
      by_status: {
        pendente: 1,
        enviado: 2,
        correcao_solicitada: 0,
        aprovado: 1,
        recusado: 1,
        suspenso: 0,
      },
    },
    generated_at: "2026-10-16T14:32:10Z",
  };
}

// Mesma composição da página /admin (sem o atraso da busca).
function Harness() {
  const [filters, setFilters] = React.useState<AdminKycQueueFilters>({
    search: "",
    status: "",
    type: "",
    dateFrom: "",
    dateTo: "",
  });
  const state = useAdminKycQueue(filters);
  return (
    <AdminKycQueue
      filters={filters}
      onFiltersChange={setFilters}
      queue={state}
    />
  );
}

describe("AdminKycQueue", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista a fila sem filtro de status e mostra os indicadores da API", async () => {
    const get = vi
      .spyOn(adminService, "getKycQueue")
      .mockResolvedValue(queue([ACME, NEXUS]));
    renderWithProviders(<Harness />);

    expect(await screen.findByText("Acme Telecom")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(
      { limit: 50, offset: 0 },
      expect.anything(),
    );
    // Indicadores: total 5, pendentes 3, negados 1.
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("mostra o código da solicitação, o CNPJ formatado e só os alertas ativos", async () => {
    vi.spyOn(adminService, "getKycQueue").mockResolvedValue(queue([ACME]));
    renderWithProviders(<Harness />);

    expect(
      await screen.findByText(/12\.345\.678\/0001-95 · KYC-018F4C2A/),
    ).toBeInTheDocument();
    // Sem traduções carregadas no teste, o alerta cai no `defaultValue`: o
    // próprio código.
    expect(screen.getByText("scm_pendente")).toBeInTheDocument();
    expect(screen.queryByText("sancao")).not.toBeInTheDocument();
  });

  it("dá prioridade à revisão especial na pílula de status", async () => {
    vi.spyOn(adminService, "getKycQueue").mockResolvedValue(queue([NEXUS]));
    renderWithProviders(<Harness />);

    expect(
      await screen.findByText("Admin.organization.status.revisao_especial"),
    ).toBeInTheDocument();
  });

  it("manda status, tipo e período para a API", async () => {
    const get = vi
      .spyOn(adminService, "getKycQueue")
      .mockResolvedValue(queue([ACME]));
    renderWithProviders(<Harness />);
    await screen.findByText("Acme Telecom");

    fireEvent.change(screen.getByLabelText("Admin.filters.statusLabel"), {
      target: { value: "revisao_especial" },
    });
    fireEvent.change(screen.getByLabelText("Admin.filters.typeLabel"), {
      target: { value: "seller" },
    });
    fireEvent.change(screen.getByLabelText("Admin.filters.from"), {
      target: { value: "2026-10-01" },
    });

    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        {
          status: "revisao_especial",
          type: "seller",
          date_from: "2026-10-01",
          limit: 50,
          offset: 0,
        },
        expect.anything(),
      ),
    );
  });

  it("expande o card e mostra as ações de revisão", async () => {
    vi.spyOn(adminService, "getKycQueue").mockResolvedValue(queue([ACME]));
    renderWithProviders(<Harness />);

    fireEvent.click(await screen.findByText("Acme Telecom"));

    expect(
      screen.getByText("Admin.organization.actions.startReview"),
    ).toBeInTheDocument();
  });

  it("acrescenta a próxima página em Carregar mais", async () => {
    const get = vi
      .spyOn(adminService, "getKycQueue")
      .mockResolvedValueOnce(queue([ACME], 2))
      .mockResolvedValueOnce({ ...queue([NEXUS], 2), offset: 1 });
    renderWithProviders(<Harness />);
    await screen.findByText("Acme Telecom");

    fireEvent.click(screen.getByText("Admin.kyc.loadMore"));

    expect(await screen.findByText("Nexus Internet S.A.")).toBeInTheDocument();
    expect(get).toHaveBeenLastCalledWith({ limit: 50, offset: 1 });
  });

  it("avisa quando a conta não tem permissão ou MFA", async () => {
    vi.spyOn(adminService, "getKycQueue").mockRejectedValue(
      apiErrorFromResponse(403),
    );
    renderWithProviders(<Harness />);

    expect(
      await screen.findByText("Admin.kyc.errors.forbidden"),
    ).toBeInTheDocument();
  });
});
