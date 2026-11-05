import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerSalesSettingsPanel from "@/components/SellerSalesSettingsPanel";
import { ConflictError, ValidationError } from "@/services/errors";
import { salesSettingsService } from "@/services/salesSettings.service";

import { renderWithProviders, screen, waitFor } from "../test-utils";

vi.mock("@/services/salesSettings.service", () => ({
  salesSettingsService: {
    getSlaConfig: vi.fn(),
    updateSlaConfig: vi.fn(),
    getAutoAccept: vi.fn(),
    setAutoAccept: vi.fn(),
  },
}));

const SLA = {
  id: "sla-1",
  organizationId: "org-1",
  maxFirstResponseHours: 4,
  maxResolutionHours: 48,
  createdAt: null,
  updatedAt: null,
};

const ALL = ["sla:change", "order:accept"];

const renderPanel = (permissions = ALL) =>
  renderWithProviders(<SellerSalesSettingsPanel permissions={permissions} />);

const firstField = () =>
  screen.findByLabelText("SellerSalesSettings.sla.firstLabel");
const resolutionField = () =>
  screen.getByLabelText("SellerSalesSettings.sla.resolutionLabel");
const saveButton = () =>
  screen.getByRole("button", { name: "SellerSalesSettings.sla.save" });

describe("SellerSalesSettingsPanel (configurações de venda)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(salesSettingsService.getSlaConfig).mockResolvedValue(SLA);
    vi.mocked(salesSettingsService.getAutoAccept).mockResolvedValue({
      autoAccept: false,
      version: 0,
    });
  });

  it("mostra os prazos lidos e salva só quando mudam", async () => {
    vi.mocked(salesSettingsService.updateSlaConfig).mockResolvedValue({
      ...SLA,
      maxFirstResponseHours: 2,
      maxResolutionHours: 24,
    });
    const { user } = renderPanel();

    expect(await firstField()).toHaveValue("4");
    expect(resolutionField()).toHaveValue("48");
    expect(saveButton()).toBeDisabled();

    await user.clear(await firstField());
    await user.type(await firstField(), "2");
    await user.clear(resolutionField());
    await user.type(resolutionField(), "24");
    await user.click(saveButton());

    expect(salesSettingsService.updateSlaConfig).toHaveBeenCalledWith({
      maxFirstResponseHours: 2,
      maxResolutionHours: 24,
    });
    expect(
      await screen.findByText("SellerSalesSettings.saved"),
    ).toBeInTheDocument();
  });

  it("resolução menor que a primeira resposta trava o salvar", async () => {
    const { user } = renderPanel();

    // Espera os prazos carregarem (primeira resposta = 4).
    await firstField();
    await user.clear(resolutionField());
    await user.type(resolutionField(), "2");

    expect(
      screen.getByText("SellerSalesSettings.errors.slaOrder"),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(salesSettingsService.updateSlaConfig).not.toHaveBeenCalled();
  });

  it("recusa do backend (400) explica a ordem dos prazos", async () => {
    vi.mocked(salesSettingsService.updateSlaConfig).mockRejectedValue(
      new ValidationError(400, []),
    );
    const { user } = renderPanel();

    await user.clear(await firstField());
    await user.type(await firstField(), "6");
    await user.click(saveButton());

    expect(
      await screen.findByText("SellerSalesSettings.errors.slaOrder"),
    ).toBeInTheDocument();
  });

  it("sem sla:change, os prazos ficam só para leitura", async () => {
    renderPanel(["order:accept"]);

    expect(await firstField()).toBeDisabled();
    expect(
      screen.getByText("SellerSalesSettings.sla.readOnly"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "SellerSalesSettings.sla.save" }),
    ).not.toBeInTheDocument();
  });

  it("liga o aceite automático com a versão lida", async () => {
    vi.mocked(salesSettingsService.setAutoAccept).mockResolvedValue({
      autoAccept: true,
      version: 1,
    });
    const { user } = renderPanel();

    await user.click(
      await screen.findByText("SellerSalesSettings.autoAccept.label"),
    );

    expect(salesSettingsService.setAutoAccept).toHaveBeenCalledWith(true, 0);
    expect(
      await screen.findByText("SellerSalesSettings.autoAccept.on"),
    ).toBeInTheDocument();
  });

  it("conflito de versão (409) relê o valor e avisa", async () => {
    vi.mocked(salesSettingsService.setAutoAccept).mockRejectedValue(
      new ConflictError(409),
    );
    const { user } = renderPanel();

    await user.click(
      await screen.findByText("SellerSalesSettings.autoAccept.label"),
    );

    expect(
      await screen.findByText("SellerSalesSettings.errors.conflict"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(salesSettingsService.getAutoAccept).toHaveBeenCalledTimes(2),
    );
  });

  it("sem order:accept, não lê o aceite automático", async () => {
    renderPanel(["sla:change"]);

    expect(
      await screen.findByText("SellerSalesSettings.autoAccept.noPermission"),
    ).toBeInTheDocument();
    expect(salesSettingsService.getAutoAccept).not.toHaveBeenCalled();
  });
});
