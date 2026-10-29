import { beforeEach, describe, expect, it, vi } from "vitest";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import { ConflictError } from "@/services/errors";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import { renderWithProviders, screen, waitFor } from "../../test-utils";

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
  },
}));

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: {
    listSpecifications: vi.fn(),
    getCatalog: vi.fn(),
    createSpecification: vi.fn(),
    createOffering: vi.fn(),
    updateOffering: vi.fn(),
    bindCoverage: vi.fn(),
    setPromotion: vi.fn(),
    transitionOffering: vi.fn(),
  },
}));

// Software: sem KMZ — a edição salva só a oferta.
const OFFERING: ProductOffering = {
  id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c",
  organizationId: "org-1",
  specificationId: "spec-software",
  name: "Zabbix gerenciado",
  monthlyPrice: "1890.00",
  installationPrice: "0.00",
  speed: null,
  durationMonths: 12,
  isPublic: true,
  status: "published",
  isCorporate: false,
  stateCode: null,
  isCapital: false,
  coverageVersionId: null,
  isActive: true,
  isPromoted: false,
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
  metadata: {
    shortDescription: "Monitoramento NMS gerenciado",
    description:
      "Monitoramento Zabbix gerenciado com alertas 24/7, dashboards e relatórios.",
    technicalSlaPercent: 99.5,
    acceptanceSlaHours: 48,
    deliveryTime: "5 dias úteis",
    pricingModel: "monthly",
    currency: "BRL",
    cancellationTerms: "30 dias corridos sem multa",
  },
};

const onSaved = vi.fn();

function renderEdit() {
  return renderWithProviders(
    <FormSellerOffer
      mode="edit"
      offering={OFFERING}
      initialValues={offeringToFormValues(
        OFFERING,
        "Softwares e Gerenciamento",
      )}
      organizationId="org-1"
      locale="pt-BR"
      onCancel={vi.fn()}
      onSaved={onSaved}
    />,
  );
}

const saveButton = () =>
  screen.getByRole("button", { name: /SellerOfferEdit.actions.save/ });

describe("FormSellerOffer em modo edição", { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productCatalogService.listSpecifications).mockResolvedValue([
      {
        id: "spec-software",
        organizationId: "org-1",
        catalogId: "cat-1",
        name: "Softwares e Gerenciamento",
        description: null,
        estimatedInstallationDays: null,
        capacity: null,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    vi.mocked(productCatalogService.updateOffering).mockResolvedValue(OFFERING);
  });

  it("abre preenchido, vai direto à revisão e salva sem publicar", async () => {
    const { user } = renderEdit();

    expect(
      screen.getByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
    ).toHaveValue("Zabbix gerenciado");

    // Na edição, qualquer etapa pode ser aberta pelo indicador.
    await user.click(screen.getByText("SellerOfferCreate.steps.review"));
    await screen.findByText("SellerOfferCreate.review.truthfulnessNotice");
    await user.click(saveButton());

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith([]));
    expect(productCatalogService.updateOffering).toHaveBeenCalledWith(
      OFFERING.id,
      expect.objectContaining({
        name: "Zabbix gerenciado",
        specificationId: "spec-software",
        monthlyPrice: "1890.00",
      }),
    );
    expect(productCatalogService.createOffering).not.toHaveBeenCalled();
    expect(productCatalogService.transitionOffering).not.toHaveBeenCalled();
    expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
    expect(productCatalogService.setPromotion).not.toHaveBeenCalled();
  });

  it("mostra o erro quando a oferta não pode ser editada", async () => {
    vi.mocked(productCatalogService.updateOffering).mockRejectedValue(
      new ConflictError(409),
    );
    const { user } = renderEdit();

    await user.click(screen.getByText("SellerOfferCreate.steps.review"));
    await user.click(
      await screen.findByRole("button", {
        name: /SellerOfferEdit.actions.save/,
      }),
    );

    expect(
      await screen.findByText("SellerOfferEdit.errors.readOnly"),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });
});
