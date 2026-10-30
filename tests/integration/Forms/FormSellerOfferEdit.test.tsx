import { beforeEach, describe, expect, it, vi } from "vitest";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import { offeringToFormValues } from "@/functions/offeringToFormValues";
import { ConflictError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import {
  productCatalogService,
  type OfferingImage,
  type ProductOffering,
} from "@/services/productCatalog.service";

import { renderWithProviders, screen, waitFor, within } from "../../test-utils";

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
    listFiles: vi.fn(),
    getVersion: vi.fn(),
    getOfferCoverage: vi.fn(),
    downloadOriginal: vi.fn(),
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
    requestImageUpload: vi.fn(),
    confirmImage: vi.fn(),
    reorderImages: vi.fn(),
    deleteImage: vi.fn(),
    listImages: vi.fn(),
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

// Conectividade: a cobertura tem área própria, fora do "Salvar alterações".
const BOUND = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";
const OTHER = "0193f1e2-9999-7c8d-9e0f-1a2b3c4d5e6f";
const CONNECTIVITY: ProductOffering = {
  ...OFFERING,
  specificationId: "spec-connectivity",
  name: "Link Dedicado 1 Gbps",
  speed: "1 Gbps",
  coverageVersionId: BOUND,
};

function renderConnectivityEdit() {
  return renderWithProviders(
    <FormSellerOffer
      mode="edit"
      offering={CONNECTIVITY}
      initialValues={offeringToFormValues(CONNECTIVITY, "Conectividade")}
      images={[]}
      organizationId="org-1"
      locale="pt-BR"
      onCancel={vi.fn()}
      onSaved={onSaved}
    />,
  );
}

function renderEdit(images: OfferingImage[] = []) {
  return renderWithProviders(
    <FormSellerOffer
      mode="edit"
      offering={OFFERING}
      initialValues={offeringToFormValues(
        OFFERING,
        "Softwares e Gerenciamento",
      )}
      images={images}
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
    // Vínculo salvo com o KMZ inteiro (sem recorte).
    vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
      offeringId: "",
      coverageVersionId: "",
      publicGeometry: null,
    });
  });

  describe("cobertura (Conectividade)", () => {
    beforeEach(() => {
      vi.mocked(productCatalogService.updateOffering).mockResolvedValue(
        CONNECTIVITY,
      );
      // Dois KMZs da organização: o vinculado e outro.
      vi.mocked(geoCoverageService.listFiles).mockResolvedValue({
        items: [BOUND, OTHER].map((id, index) => ({
          fileId: `file-${index}`,
          activeVersionId: id,
          archived: false,
          revision: 0,
        })),
        total: 2,
        offset: 0,
        limit: 200,
      });
      vi.mocked(geoCoverageService.getVersion).mockImplementation(
        async (id: string) => ({
          id,
          organizationId: "org-1",
          predecessorId: null,
          sourceSha256: "a".repeat(64),
          createdAt: "2026-04-28T12:00:00Z",
          logicalFileId: "file",
          originalAvailable: true,
          metadataAvailable: true,
        }),
      );
      vi.mocked(geoCoverageService.downloadOriginal).mockReturnValue(
        new Promise(() => {}),
      );
    });

    it("abre na área de cobertura com o KMZ vinculado", async () => {
      renderConnectivityEdit();

      const section = screen.getByRole("region", {
        name: "SellerOfferCoverage.title",
      });
      expect(
        await within(section).findByText("SellerOfferCreate.kmz.bound"),
      ).toBeInTheDocument();
      expect(
        within(section).getByText("SellerOfferCoverage.upToDate"),
      ).toBeVisible();
    });

    it("'Confirmar cobertura' vincula na hora o outro KMZ, sem salvar a oferta", async () => {
      vi.mocked(productCatalogService.bindCoverage).mockResolvedValue({
        offeringId: CONNECTIVITY.id,
        coverageVersionId: OTHER,
      });
      const { user } = renderConnectivityEdit();

      const group = await screen.findByRole("radiogroup", {
        name: /SellerOfferCreate.kmz.label/,
      });
      await waitFor(() =>
        expect(within(group).getAllByRole("radio")).toHaveLength(2),
      );
      const other = within(group)
        .getAllByRole("radio")
        .find((radio) => radio.getAttribute("aria-checked") === "false")!;
      await user.click(other);
      await user.click(
        screen.getByRole("button", { name: /SellerOfferCoverage.confirm/ }),
      );

      await waitFor(() =>
        expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
          CONNECTIVITY.id,
          OTHER,
          null,
          [],
        ),
      );
      expect(productCatalogService.updateOffering).not.toHaveBeenCalled();
    });

    it("'Salvar alterações' não vincula e avisa da cobertura não confirmada", async () => {
      const { user } = renderConnectivityEdit();

      const group = await screen.findByRole("radiogroup", {
        name: /SellerOfferCreate.kmz.label/,
      });
      await waitFor(() =>
        expect(within(group).getAllByRole("radio")).toHaveLength(2),
      );
      await user.click(
        within(group)
          .getAllByRole("radio")
          .find((radio) => radio.getAttribute("aria-checked") === "false")!,
      );

      await user.click(screen.getByText("SellerOfferCreate.steps.review"));
      await screen.findByText("SellerOfferCreate.review.truthfulnessNotice");
      await user.click(saveButton());

      await waitFor(() =>
        expect(onSaved).toHaveBeenCalledWith([
          "SellerOfferCoverage.notConfirmedOnSave",
        ]),
      );
      expect(productCatalogService.updateOffering).toHaveBeenCalled();
      expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
    });
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
    // Mesma categoria: o PATCH sai direto, sem ler os planos antes.
    expect(productCatalogService.listSpecifications).not.toHaveBeenCalled();
    expect(productCatalogService.createOffering).not.toHaveBeenCalled();
    expect(productCatalogService.transitionOffering).not.toHaveBeenCalled();
    expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
    expect(productCatalogService.setPromotion).not.toHaveBeenCalled();
    // Imagens iguais às salvas: nenhuma chamada de imagem.
    expect(productCatalogService.deleteImage).not.toHaveBeenCalled();
    expect(productCatalogService.reorderImages).not.toHaveBeenCalled();
  });

  describe("área de fotos", () => {
    const image = (id: string, position: number): OfferingImage => ({
      id,
      status: "ready",
      position,
      contentType: "image/png",
      sizeBytes: 100,
      url: `https://storage.test/${id}.png`,
      urlExpiresAt: null,
    });
    const SAVED = [
      image("image-a", 0),
      image("image-b", 1),
      image("image-c", 2),
    ];
    const confirmButton = () =>
      screen.getByRole("button", { name: /SellerOfferImages.confirm/ });

    // Remove a capa (a) e põe a c antes da b.
    async function removeCoverAndSwap(
      user: ReturnType<typeof renderEdit>["user"],
    ) {
      await user.click(screen.getByText("SellerOfferCreate.steps.basicInfo"));
      const items = await screen.findAllByRole("listitem");
      expect(items).toHaveLength(3);
      await user.click(
        within(items[0]).getByRole("button", {
          name: "SellerOfferCreate.basicInfo.imageRemove",
        }),
      );
      await user.click(
        within(screen.getAllByRole("listitem")[1]).getByRole("button", {
          name: "SellerOfferCreate.basicInfo.imageMoveLeft",
        }),
      );
    }

    it("abre com as fotos salvas; Confirmar fotos envia na hora e recarrega a lista", async () => {
      vi.mocked(productCatalogService.listImages).mockResolvedValue([
        image("image-c", 0),
        image("image-b", 1),
      ]);
      const { user } = renderEdit(SAVED);

      await user.click(screen.getByText("SellerOfferCreate.steps.basicInfo"));
      // Sem mudança, nada a confirmar.
      expect(confirmButton()).toBeDisabled();

      await removeCoverAndSwap(user);
      expect(screen.getByText("SellerOfferImages.pending")).toBeInTheDocument();
      await user.click(confirmButton());

      expect(
        await screen.findByText("SellerOfferImages.confirmed"),
      ).toBeInTheDocument();
      expect(productCatalogService.deleteImage).toHaveBeenCalledWith(
        OFFERING.id,
        "image-a",
      );
      expect(productCatalogService.reorderImages).toHaveBeenCalledWith(
        OFFERING.id,
        ["image-c", "image-b"],
      );
      expect(productCatalogService.listImages).toHaveBeenCalledWith(
        OFFERING.id,
      );
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(confirmButton()).toBeDisabled();
      // As fotos não dependem de "Salvar alterações".
      expect(productCatalogService.updateOffering).not.toHaveBeenCalled();
    });

    it("Salvar alterações não leva as fotos e avisa quando ficaram sem confirmar", async () => {
      const { user } = renderEdit(SAVED);

      await removeCoverAndSwap(user);
      await user.click(screen.getByText("SellerOfferCreate.steps.review"));
      await user.click(saveButton());

      await waitFor(() =>
        expect(onSaved).toHaveBeenCalledWith([
          "SellerOfferImages.notConfirmedOnSave",
        ]),
      );
      expect(productCatalogService.updateOffering).toHaveBeenCalled();
      expect(productCatalogService.deleteImage).not.toHaveBeenCalled();
      expect(productCatalogService.reorderImages).not.toHaveBeenCalled();
    });
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
