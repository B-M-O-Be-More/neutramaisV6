import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import { ForbiddenError } from "@/services/errors";
import { productCatalogService } from "@/services/productCatalog.service";

import { renderWithProviders, screen, waitFor } from "../../test-utils";

// A geo-api não lista versões: o assistente só mostra os KMZs enviados nele.
vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
  },
}));

// Marketplace-api da publicação: cada teste define as respostas.
vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: {
    listSpecifications: vi.fn(),
    getCatalog: vi.fn(),
    createSpecification: vi.fn(),
    createOffering: vi.fn(),
    bindCoverage: vi.fn(),
    setPromotion: vi.fn(),
    transitionOffering: vi.fn(),
  },
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const onPublished = vi.fn();

function renderForm() {
  return renderWithProviders(
    <FormSellerOffer
      organizationId={ORGANIZATION}
      locale="pt-BR"
      onCancel={vi.fn()}
      onPublished={onPublished}
    />,
  );
}

const continueButton = () =>
  screen.getByRole("button", { name: /SellerOfferCreate.actions.continue/ });

const category = (key: string) =>
  screen.getByRole("radio", {
    name: new RegExp(`SellerOfferCreate.categories.${key}.label`),
  });

beforeAll(() => {
  // O jsdom não implementa URLs de Blob (prévia da imagem).
  URL.createObjectURL = vi.fn(() => "blob:offer-image");
  URL.revokeObjectURL = vi.fn();
});

// Software não tem KMZ, velocidade obrigatória nem bloco extra: é o caminho
// mais curto até a etapa 4.
async function goToPricing() {
  const rendered = renderForm();
  const { user } = rendered;
  const paste = async (label: RegExp, text: string) => {
    await user.click(screen.getByLabelText(label));
    await user.paste(text);
  };

  await user.click(category("software"));
  await user.click(continueButton());

  await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/);
  await paste(/SellerOfferCreate.basicInfo.nameLabel/, "Zabbix gerenciado");
  await paste(
    /SellerOfferCreate.basicInfo.shortDescriptionLabel/,
    "Monitoramento NMS gerenciado",
  );
  await paste(
    /SellerOfferCreate.basicInfo.descriptionLabel/,
    "Monitoramento Zabbix gerenciado com alertas 24/7, dashboards e relatórios.",
  );
  await user.click(continueButton());

  await screen.findByLabelText(/SellerOfferCreate.technicalSpecs.speedLabel/);
  await paste(/SellerOfferCreate.technicalSpecs.technicalSlaLabel/, "99,5");
  await paste(
    /SellerOfferCreate.technicalSpecs.deliveryTimeLabel/,
    "5 dias úteis",
  );
  await user.click(continueButton());

  await screen.findByLabelText(/SellerOfferCreate.pricing.pricingModelLabel/);
  return { ...rendered, paste };
}

/** Preenche a etapa 4 e chega à revisão final. */
async function goToReview() {
  const rendered = await goToPricing();
  const { user, paste } = rendered;
  await user.selectOptions(
    screen.getByLabelText(/SellerOfferCreate.pricing.pricingModelLabel/),
    "monthly",
  );
  await paste(/SellerOfferCreate.pricing.priceLabel/, "1.890,00");
  await paste(
    /SellerOfferCreate.pricing.cancellationLabel/,
    "30 dias corridos sem multa",
  );
  await user.click(continueButton());
  await screen.findByText("SellerOfferCreate.review.truthfulnessNotice");
  return rendered;
}

// Formulário pesado (5 etapas, mapa, preview): no jsdom a primeira montagem e
// a digitação em vários campos levam alguns segundos — acima dos 5 s padrão.
describe("FormSellerOffer", { timeout: 20_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it("exige a categoria antes de avançar", async () => {
    const { user } = renderForm();

    await user.click(continueButton());

    expect(
      await screen.findByText("SellerOfferCreate.errors.categoryRequired"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SellerOfferCreate.coverage.categoriesLabel"),
    ).toBeVisible();
  });

  it("Conectividade avisa que a cobertura vem depois, mostra a localidade A/Z e avança", async () => {
    const { user } = renderForm();

    await user.click(category("connectivity"));
    expect(
      screen.getByText("SellerOfferCreate.coverage.afterCreateTitle"),
    ).toBeVisible();
    // Sem KMZ na criação: ele só é vinculado à oferta já criada.
    expect(
      screen.queryByText("SellerOfferCreate.kmz.label"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: /SellerOfferCreate.coverage.locationLabel/,
      }),
    ).toBeVisible();

    await user.click(continueButton());

    expect(
      await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
    ).toBeVisible();
  });

  it("Hardware mostra 'Cobertura não aplicável', sem KMZ nem localidade, e avança", async () => {
    const { user } = renderForm();

    await user.click(category("hardware"));

    expect(
      screen.getByText("SellerOfferCreate.coverage.notApplicableTitle"),
    ).toBeVisible();
    expect(
      screen.queryByText("SellerOfferCreate.kmz.label"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", {
        name: /SellerOfferCreate.coverage.locationLabel/,
      }),
    ).not.toBeInTheDocument();
    // Só recursos numéricos pedem a região.
    expect(
      screen.queryByLabelText("SellerOfferCreate.coverage.regionLabel"),
    ).not.toBeInTheDocument();

    await user.click(continueButton());

    expect(
      await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
    ).toBeVisible();
  });

  it("Recursos Numéricos pedem a região dentro do card", async () => {
    const { user } = renderForm();

    await user.click(category("numberingResources"));

    expect(
      screen.getByLabelText("SellerOfferCreate.coverage.regionLabel"),
    ).toBeVisible();
  });

  describe("etapa Informações básicas", () => {
    async function goToBasicInfo() {
      const rendered = renderForm();
      await rendered.user.click(category("hardware"));
      await rendered.user.click(continueButton());
      await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/);
      return rendered;
    }

    it("valida os campos obrigatórios e o mínimo da descrição", async () => {
      const { user } = await goToBasicInfo();

      await user.click(continueButton());

      expect(
        await screen.findByText("SellerOfferCreate.errors.nameRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.shortDescriptionRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.descriptionRequired"),
      ).toBeInTheDocument();

      await user.type(
        screen.getByLabelText(/SellerOfferCreate.basicInfo.descriptionLabel/),
        "Curta demais",
      );

      // Depois da primeira tentativa, o erro acompanha a digitação.
      expect(
        await screen.findByText("SellerOfferCreate.errors.descriptionTooShort"),
      ).toBeInTheDocument();
    });

    it("conta os caracteres, atualiza o preview e avança com os dados válidos", async () => {
      const { user } = await goToBasicInfo();

      await user.type(
        screen.getByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
        "Bloco IPv6 /48",
      );
      expect(screen.getByText("14/100")).toBeInTheDocument();
      // O nome aparece no preview do marketplace.
      expect(screen.getAllByText("Bloco IPv6 /48").length).toBeGreaterThan(0);

      // Textos longos são colados — digitar caractere a caractere é lento no jsdom.
      await user.click(
        screen.getByLabelText(
          /SellerOfferCreate.basicInfo.shortDescriptionLabel/,
        ),
      );
      await user.paste("Bloco /48 via LACNIC");
      await user.click(
        screen.getByLabelText(/SellerOfferCreate.basicInfo.descriptionLabel/),
      );
      await user.paste(
        "Bloco IPv6 /48 via LACNIC com transferência de titularidade e suporte.",
      );

      await user.click(continueButton());

      expect(
        await screen.findByLabelText(
          /SellerOfferCreate.technicalSpecs.speedLabel/,
        ),
      ).toBeVisible();
      expect(
        screen.queryByText("SellerOfferCreate.errors.nameRequired"),
      ).not.toBeInTheDocument();
    });

    it("não tem fotos na criação: avisa que entram depois de publicar", async () => {
      const { container } = await goToBasicInfo();

      expect(container.querySelector('input[type="file"]')).toBeNull();
      expect(
        screen.queryByRole("button", { name: /SellerOfferImages.confirm/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferImages.afterPublishNotice"),
      ).toBeVisible();
    });
  });

  describe("etapa Especificações técnicas", () => {
    async function goToTechnicalSpecs(categoryKey = "hardware") {
      const rendered = renderForm();
      const { user } = rendered;
      await user.click(category(categoryKey));
      await user.click(continueButton());

      await user.click(
        await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
      );
      await user.paste("Roteador CPE Wi-Fi 6");
      await user.click(
        screen.getByLabelText(
          /SellerOfferCreate.basicInfo.shortDescriptionLabel/,
        ),
      );
      await user.paste("CPE com Wi-Fi 6 e gerência remota");
      await user.click(
        screen.getByLabelText(/SellerOfferCreate.basicInfo.descriptionLabel/),
      );
      await user.paste(
        "Roteador CPE com Wi-Fi 6, gerência remota TR-069 e garantia de 12 meses.",
      );
      await user.click(continueButton());

      // Recursos Numéricos não têm velocidade: espera pelo SLA técnico.
      await screen.findByLabelText(
        /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
      );
      return rendered;
    }

    it("valida SLAs e prazo sem exigir velocidade fora de Conectividade", async () => {
      const { user } = await goToTechnicalSpecs();

      // O SLA de aceite já vem com o padrão de 48h.
      expect(
        screen.getByLabelText(
          /SellerOfferCreate.technicalSpecs.acceptanceSlaLabel/,
        ),
      ).toHaveValue(48);

      await user.click(continueButton());

      expect(
        await screen.findByText(
          "SellerOfferCreate.errors.technicalSlaRequired",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.deliveryTimeRequired"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("SellerOfferCreate.errors.speedRequired"),
      ).not.toBeInTheDocument();

      // A máscara aceita 0, mas o SLA precisa ser maior que zero.
      await user.type(
        screen.getByLabelText(
          /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
        ),
        "0",
      );

      expect(
        await screen.findByText("SellerOfferCreate.errors.technicalSlaRange"),
      ).toBeInTheDocument();
    });

    it("velocidade e latência só aceitam números; SLA técnico vai até 100%", async () => {
      const { user } = await goToTechnicalSpecs("software");

      const speed = screen.getByLabelText(
        /SellerOfferCreate.technicalSpecs.speedLabel/,
      );
      const latency = screen.getByLabelText(
        /SellerOfferCreate.technicalSpecs.latencyLabel/,
      );
      const technicalSla = screen.getByLabelText(
        /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
      );

      await user.type(speed, "5a0b0");
      await user.type(latency, "1x2,5");
      await user.type(technicalSla, "9x9,5");

      expect(speed).toHaveValue("500");
      expect(latency).toHaveValue("125");
      expect(technicalSla).toHaveValue("99,5");

      // Acima de 100 a máscara não aceita o dígito.
      await user.clear(technicalSla);
      await user.type(technicalSla, "150");
      expect(technicalSla).toHaveValue("15");
    });

    it("Recursos Numéricos trocam banda e latência pela documentação LACNIC/ANATEL", async () => {
      const { user } = await goToTechnicalSpecs("numberingResources");

      expect(
        screen.queryByLabelText(/SellerOfferCreate.technicalSpecs.speedLabel/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText(
          /SellerOfferCreate.technicalSpecs.latencyLabel/,
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("group", {
          name: "SellerOfferCreate.numbering.title",
        }),
      ).toBeVisible();

      await user.click(continueButton());

      expect(
        await screen.findByText(
          "SellerOfferCreate.errors.numberingTypeRequired",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.numberingBlockRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.numberingHolderRequired"),
      ).toBeInTheDocument();
    });

    it("Hardware exige fabricante, modelo, condição e o envio", async () => {
      const { user } = await goToTechnicalSpecs();

      expect(
        screen.getByRole("group", {
          name: "SellerOfferCreate.hardware.title",
        }),
      ).toBeVisible();
      expect(
        screen.getByRole("group", {
          name: "SellerOfferCreate.shipping.title",
        }),
      ).toBeVisible();

      await user.click(continueButton());

      expect(
        await screen.findByText(
          "SellerOfferCreate.errors.manufacturerRequired",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.modelRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.conditionRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.weightRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.postalCodeRequired"),
      ).toBeInTheDocument();
    });

    it("não mostra os blocos de Hardware e de envio nas outras categorias", async () => {
      await goToTechnicalSpecs("software");

      expect(
        screen.queryByRole("group", {
          name: "SellerOfferCreate.hardware.title",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("group", {
          name: "SellerOfferCreate.shipping.title",
        }),
      ).not.toBeInTheDocument();
    });

    it("mostra os SLAs no preview e avança", async () => {
      const { user } = await goToTechnicalSpecs();

      await user.type(
        screen.getByLabelText(
          /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
        ),
        "98,5",
      );
      await user.click(
        screen.getByLabelText(
          /SellerOfferCreate.technicalSpecs.deliveryTimeLabel/,
        ),
      );
      await user.paste("30 dias após o aceite");
      await user.click(
        screen.getByLabelText(/SellerOfferCreate.hardware.manufacturerLabel/),
      );
      await user.paste("Mikrotik");
      await user.click(
        screen.getByLabelText(/SellerOfferCreate.hardware.modelLabel/),
      );
      await user.paste("RB4011");
      await user.selectOptions(
        screen.getByLabelText(/SellerOfferCreate.hardware.conditionLabel/),
        "new",
      );
      for (const [label, value] of [
        [/SellerOfferCreate.shipping.weightLabel/, "1,25"],
        [/SellerOfferCreate.shipping.heightLabel/, "10"],
        [/SellerOfferCreate.shipping.widthLabel/, "25"],
        [/SellerOfferCreate.shipping.lengthLabel/, "30"],
        [/SellerOfferCreate.shipping.postalCodeLabel/, "01310100"],
      ] as const) {
        await user.type(screen.getByLabelText(label), value);
      }
      // A máscara põe o hífen do CEP.
      expect(
        screen.getByLabelText(/SellerOfferCreate.shipping.postalCodeLabel/),
      ).toHaveValue("01310-100");

      expect(screen.getByText("98,5%")).toBeInTheDocument();
      expect(screen.getByText("48h")).toBeInTheDocument();

      await user.click(continueButton());

      expect(
        await screen.findByLabelText(
          /SellerOfferCreate.pricing.pricingModelLabel/,
        ),
      ).toBeVisible();
    });
  });

  describe("etapa Preço e disponibilidade", () => {
    it("exige modelo de preço, preço e condições de cancelamento", async () => {
      const { user } = await goToPricing();

      // BRL já vem selecionada.
      expect(
        screen.getByLabelText(/SellerOfferCreate.pricing.currencyLabel/),
      ).toHaveValue("BRL");

      await user.click(continueButton());

      expect(
        await screen.findByText(
          "SellerOfferCreate.errors.pricingModelRequired",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.priceRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.cancellationRequired"),
      ).toBeInTheDocument();
    });

    it("formata o preço como dinheiro e ignora letras", async () => {
      const { user } = await goToPricing();
      const price = screen.getByLabelText(
        /SellerOfferCreate.pricing.priceLabel/,
      );

      await user.type(price, "1a890");
      expect(price).toHaveValue("1.890");

      // Ao sair do campo, as casas decimais são completadas.
      await user.tab();
      expect(price).toHaveValue("1.890,00");
    });

    it("mostra o preço no preview, patrocina e avança para a revisão", async () => {
      const { user, paste } = await goToPricing();

      await user.selectOptions(
        screen.getByLabelText(/SellerOfferCreate.pricing.pricingModelLabel/),
        "monthly",
      );
      await paste(/SellerOfferCreate.pricing.priceLabel/, "1.890,00");
      await paste(
        /SellerOfferCreate.pricing.cancellationLabel/,
        "30 dias corridos sem multa",
      );

      expect(screen.getByText("BRL 1.890,00")).toBeInTheDocument();
      // O símbolo da moeda acompanha o campo.
      expect(screen.getByText("R$")).toBeInTheDocument();

      const sponsored = screen.getByRole("checkbox", {
        name: /SellerOfferCreate.pricing.sponsoredLabel/,
      });
      expect(sponsored).not.toBeChecked();
      await user.click(sponsored);
      expect(sponsored).toBeChecked();

      await user.click(continueButton());

      expect(
        await screen.findByText("SellerOfferCreate.review.truthfulnessNotice"),
      ).toBeInTheDocument();
    });
  });

  describe("revisão final e publicação", () => {
    const OFFERING = { id: "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c" };

    beforeEach(() => {
      vi.mocked(productCatalogService.listSpecifications).mockResolvedValue([]);
      vi.mocked(productCatalogService.getCatalog).mockResolvedValue({
        id: "catalog-1",
      } as never);
      vi.mocked(productCatalogService.createSpecification).mockResolvedValue({
        id: "spec-1",
      } as never);
      vi.mocked(productCatalogService.createOffering).mockResolvedValue(
        OFFERING as never,
      );
      vi.mocked(productCatalogService.transitionOffering).mockResolvedValue(
        OFFERING as never,
      );
    });

    const publishButton = () =>
      screen.getByRole("button", { name: /SellerOfferCreate.actions.publish/ });

    it("mostra o resumo do que foi preenchido", async () => {
      await goToReview();

      expect(screen.getAllByText("Zabbix gerenciado").length).toBeGreaterThan(
        0,
      );
      expect(
        screen.getAllByText("SellerOfferCreate.categories.software.label")
          .length,
      ).toBeGreaterThan(0);
      // Aparece também na opção do seletor da etapa 4 (montada, escondida).
      expect(
        screen.getAllByText("SellerOfferCreate.pricing.pricingModels.monthly")
          .length,
      ).toBeGreaterThan(1);
      expect(screen.getAllByText("BRL 1.890,00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("99,5%").length).toBeGreaterThan(0);
      expect(
        screen.getByText("SellerOfferCreate.review.validUntilOpen"),
      ).toBeInTheDocument();
    });

    it("cria o plano da categoria, cria a oferta e publica", async () => {
      const { user } = await goToReview();

      await user.click(publishButton());

      await waitFor(() =>
        expect(onPublished).toHaveBeenCalledWith(
          expect.objectContaining({
            offeringId: OFFERING.id,
            name: "Zabbix gerenciado",
            categoryLabel: "SellerOfferCreate.categories.software.label",
            price: expect.stringMatching(/^BRL\s1\.890,00$/),
            acceptanceSla: "48h",
            needsCoverage: false,
            warnings: [],
          }),
        ),
      );
      // Sem plano da categoria: garante o catálogo e cria o plano.
      expect(productCatalogService.getCatalog).toHaveBeenCalled();
      expect(productCatalogService.createSpecification).toHaveBeenCalledWith({
        name: "Softwares e Gerenciamento",
      });
      expect(productCatalogService.createOffering).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Zabbix gerenciado",
          specificationId: "spec-1",
          monthlyPrice: "1890.00",
          installationPrice: "0.00",
          speed: null,
          metadata: expect.objectContaining({
            shortDescription: "Monitoramento NMS gerenciado",
            technicalSlaPercent: 99.5,
            acceptanceSlaHours: 48,
            pricingModel: "monthly",
            currency: "BRL",
          }),
        }),
      );
      // Software não tem KMZ.
      expect(productCatalogService.bindCoverage).not.toHaveBeenCalled();
      expect(productCatalogService.transitionOffering).toHaveBeenCalledWith(
        OFFERING.id,
        "publish",
      );
    });

    it("reaproveita o plano que já existe com o nome da categoria", async () => {
      vi.mocked(productCatalogService.listSpecifications).mockResolvedValue([
        {
          id: "spec-existing",
          name: "softwares e gerenciamento",
          isActive: true,
        },
      ] as never);
      const { user } = await goToReview();

      await user.click(publishButton());

      await waitFor(() => expect(onPublished).toHaveBeenCalled());
      expect(productCatalogService.createSpecification).not.toHaveBeenCalled();
      expect(productCatalogService.createOffering).toHaveBeenCalledWith(
        expect.objectContaining({ specificationId: "spec-existing" }),
      );
    });

    it("sem KYC verificado, salva rascunho e a nova tentativa não duplica a oferta", async () => {
      vi.mocked(productCatalogService.transitionOffering).mockRejectedValueOnce(
        new ForbiddenError(403, [], "KYC", {
          metadata: { code: "MKT_KYC_NOT_VERIFIED" },
        }),
      );
      const { user } = await goToReview();

      await user.click(publishButton());

      expect(
        await screen.findByText("SellerOffers.errors.kycNotVerified"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.publish.savedAsDraft"),
      ).toBeInTheDocument();
      expect(onPublished).not.toHaveBeenCalled();
      // Criada, a oferta não volta mais às etapas.
      expect(
        screen.getByRole("button", { name: /SellerOfferCreate.actions.back/ }),
      ).toBeDisabled();

      await user.click(
        screen.getByRole("button", {
          name: /SellerOfferCreate.actions.retryPublish/,
        }),
      );

      await waitFor(() => expect(onPublished).toHaveBeenCalled());
      expect(productCatalogService.createOffering).toHaveBeenCalledTimes(1);
      expect(productCatalogService.transitionOffering).toHaveBeenCalledTimes(2);
    });

    it("não cria nada quando a organização ainda não foi aprovada", async () => {
      vi.mocked(productCatalogService.createOffering).mockRejectedValueOnce(
        new ForbiddenError(403, [], "not approved", {
          metadata: { code: "MKT_SELLER_NOT_APPROVED" },
        }),
      );
      const { user } = await goToReview();

      await user.click(publishButton());

      expect(
        await screen.findByText("SellerOffers.errors.sellerNotApproved"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("SellerOfferCreate.publish.savedAsDraft"),
      ).not.toBeInTheDocument();
      expect(productCatalogService.transitionOffering).not.toHaveBeenCalled();
    });
  });
});
