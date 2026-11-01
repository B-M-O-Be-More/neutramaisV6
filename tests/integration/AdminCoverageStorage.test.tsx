import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminCoverageStorage from "@/components/AdminCoverageStorage";
import { ForbiddenError } from "@/services/errors";
import {
  geoStorageService,
  type OrganizationStorage,
} from "@/services/geoStorage.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/geoStorage.service", () => ({
  geoStorageService: { getStorage: vi.fn(), updateQuota: vi.fn() },
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";

const STORAGE: OrganizationStorage = {
  organizationId: ORGANIZATION,
  quotaMb: 200,
  usedMb: 120,
  availableMb: 80,
  overQuota: false,
  originalsMb: 80,
  geometriesMb: 30,
  metadataMb: 10,
  defaultQuotaMb: 200,
  maxQuotaMb: 1000,
};

function renderBlock() {
  return renderWithProviders(
    <AdminCoverageStorage
      organizationId={ORGANIZATION}
      organizationName="Fibra Norte"
      locale="pt-BR"
    />,
  );
}

const quotaInput = () =>
  screen.getByLabelText(/CoverageStorage.quota.manualLabel/);
const reasonInput = () =>
  screen.getByLabelText(/CoverageStorage.quota.reasonLabel/);

describe("AdminCoverageStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoStorageService.getStorage).mockResolvedValue(STORAGE);
  });

  it("mostra o consumo da organização", async () => {
    renderBlock();

    expect(await screen.findByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
    expect(geoStorageService.getStorage).toHaveBeenCalledWith(
      ORGANIZATION,
      expect.anything(),
    );
    expect(
      screen.getByText("CoverageStorage.categories.originals"),
    ).toBeInTheDocument();
  });

  it("altera a cota com o motivo e mostra o novo saldo", async () => {
    vi.mocked(geoStorageService.updateQuota).mockResolvedValue({
      ...STORAGE,
      quotaMb: 512,
      availableMb: 392,
    });
    const { user } = renderBlock();

    await user.click(
      await screen.findByRole("button", {
        name: /CoverageStorage.quota.edit/,
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.clear(quotaInput());
    await user.type(quotaInput(), "512");
    await user.type(reasonInput(), "Ampliação aprovada");
    await user.click(
      within(dialog).getByRole("button", {
        name: "CoverageStorage.quota.save",
      }),
    );

    await waitFor(() =>
      expect(geoStorageService.updateQuota).toHaveBeenCalledWith(ORGANIZATION, {
        quotaMb: 512,
        reason: "Ampliação aprovada",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "23",
    );
  });

  it("avisa ao reduzir abaixo do consumo e exige o motivo", async () => {
    const { user } = renderBlock();

    await user.click(
      await screen.findByRole("button", {
        name: /CoverageStorage.quota.edit/,
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.clear(quotaInput());
    await user.type(quotaInput(), "100");

    expect(
      within(dialog).getByText("CoverageStorage.quota.belowUsage"),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: "CoverageStorage.quota.save",
      }),
    );
    expect(
      await within(dialog).findByText(
        "CoverageStorage.quota.errors.reasonRequired",
      ),
    ).toBeInTheDocument();
    expect(geoStorageService.updateQuota).not.toHaveBeenCalled();
  });

  it("explica quando a geo-api recusa por falta de permissão", async () => {
    vi.mocked(geoStorageService.updateQuota).mockRejectedValue(
      new ForbiddenError(403),
    );
    const { user } = renderBlock();

    await user.click(
      await screen.findByRole("button", {
        name: /CoverageStorage.quota.edit/,
      }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(reasonInput(), "Teste de permissão");
    await user.click(
      within(dialog).getByRole("button", {
        name: "CoverageStorage.quota.save",
      }),
    );

    expect(
      await within(dialog).findByText("CoverageStorage.quota.errors.forbidden"),
    ).toBeInTheDocument();
  });

  it("acima da cota, avisa que novos envios estão bloqueados", async () => {
    vi.mocked(geoStorageService.getStorage).mockResolvedValue({
      ...STORAGE,
      quotaMb: 100,
      availableMb: 0,
      overQuota: true,
    });
    renderBlock();

    expect(
      await screen.findByText("CoverageStorage.overQuota"),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("sem acesso, mostra o erro e permite tentar de novo", async () => {
    vi.mocked(geoStorageService.getStorage).mockRejectedValueOnce(
      new ForbiddenError(403),
    );
    const { user } = renderBlock();

    expect(
      await screen.findByText("CoverageStorage.errors.forbidden"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /CoverageStorage.quota.edit/ }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "CoverageStorage.retry" }),
    );
    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
  });

  describe("modal Atualizar cota", () => {
    async function openModal() {
      const rendered = renderBlock();
      await rendered.user.click(
        await screen.findByRole("button", {
          name: /CoverageStorage.quota.edit/,
        }),
      );
      const dialog = await screen.findByRole("dialog", {
        name: "CoverageStorage.quota.title",
      });
      return { ...rendered, dialog };
    }

    it("mostra a organização e parte da cota atual, no slider e no campo", async () => {
      const { dialog } = await openModal();

      expect(
        within(dialog).getByLabelText(
          "CoverageStorage.quota.organizationLabel",
        ),
      ).toBeDisabled();
      expect(within(dialog).getByText("Fibra Norte")).toBeInTheDocument();
      expect(quotaInput()).toHaveValue("200");
      expect(within(dialog).getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "200",
      );
    });

    it("o campo manual move o slider e o valor em destaque", async () => {
      const { user, dialog } = await openModal();

      await user.clear(quotaInput());
      await user.type(quotaInput(), "750");

      expect(within(dialog).getByRole("slider")).toHaveAttribute(
        "aria-valuenow",
        "750",
      );
      expect(within(dialog).getByText("750 MB")).toBeInTheDocument();
    });

    it("o slider pelo teclado muda a quantidade manual", async () => {
      const { user, dialog } = await openModal();

      within(dialog).getByRole("slider").focus();
      await user.keyboard("{ArrowRight}{ArrowRight}");

      expect(quotaInput()).toHaveValue("202");
    });

    it("recusa cota fora de 50 a 1.000 MB e motivo curto", async () => {
      const { user, dialog } = await openModal();

      await user.clear(quotaInput());
      await user.type(quotaInput(), "30");
      await user.type(reasonInput(), "curto");
      expect(
        within(dialog).getByText("CoverageStorage.quota.reasonHelper"),
      ).toBeInTheDocument();
      await user.click(
        within(dialog).getByRole("button", {
          name: "CoverageStorage.quota.save",
        }),
      );

      expect(
        await within(dialog).findByText(
          "CoverageStorage.quota.errors.quotaRange",
        ),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText("CoverageStorage.quota.errors.reasonTooShort"),
      ).toBeInTheDocument();
      expect(geoStorageService.updateQuota).not.toHaveBeenCalled();
    });

    it("Cancelar fecha sem salvar", async () => {
      const { user, dialog } = await openModal();

      await user.click(
        within(dialog).getByRole("button", {
          name: "CoverageStorage.quota.cancel",
        }),
      );

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(geoStorageService.updateQuota).not.toHaveBeenCalled();
    });
  });
});
