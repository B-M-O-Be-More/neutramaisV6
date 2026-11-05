import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import FormSellerOffer from "@/components/Forms/FormSellerOffer";
import { clearCategoryTemplateCache } from "@/hooks/useCategoryTemplate";
import { ForbiddenError } from "@/services/errors";
import { mapboxGeocodingService } from "@/services/mapboxGeocoding.service";
import {
  productCatalogService,
  type ProductCategory,
} from "@/services/productCatalog.service";

import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../test-utils";

// A geo-api não lista versões: o assistente só mostra os KMZs enviados nele.
// As sugestões chegam depois da pausa da digitação e da busca: com a suíte
// inteira em paralelo, passam do 1 s padrão do findBy.
const OPTIONS_TIMEOUT = { timeout: 5_000 };

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
  },
}));

// Sugestões de endereço da localidade A (Conectividade e Infra Física).
vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn(),
  },
}));

const ADDRESS = {
  id: "addr-1",
  label: "Av. Dom Luís, 300, Fortaleza - CE",
  longitude: -38.4931,
  latitude: -3.7375,
};

// Marketplace-api da publicação: cada teste define as respostas.
vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: {
    listCategories: vi.fn(),
    getCategory: vi.fn(),
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

// Árvore da plataforma: as seis raízes conhecidas e uma subcategoria de
// Softwares com campos próprios no template.
const SOFTWARE_ID = "0193a000-0000-7000-8000-000000000c05";
const MONITORING_ID = "0193a000-0000-7000-8000-0000000000f1";
const root = (
  id: string,
  name: string,
  flags: Partial<ProductCategory> = {},
  children: ProductCategory[] | null = null,
): ProductCategory => ({
  id,
  parentId: null,
  name,
  description: null,
  templateVersion: 1,
  requiresCoverage: false,
  hasNumericStock: false,
  isActive: true,
  displayOrder: 0,
  template: null,
  rules: null,
  children,
  ...flags,
});
const MONITORING: ProductCategory = {
  ...root(MONITORING_ID, "Monitoramento"),
  parentId: SOFTWARE_ID,
};
// Subcategoria com regras condicionais: uma obrigatória e uma opcional.
const BACKUP_ID = "0193a000-0000-7000-8000-0000000000f2";
const BACKUP: ProductCategory = {
  ...root(BACKUP_ID, "Backup", { displayOrder: 1 }),
  parentId: SOFTWARE_ID,
};
const BACKUP_RULES: ProductCategory["rules"] = [
  {
    key: "fastActivation",
    name: "Ativação rápida",
    description: "Selo para quem ativa em até 48 horas.",
    required: true,
    valueFields: [
      {
        key: "maxAcceptanceHours",
        label: "Horas para aceitar",
        type: "number",
        required: true,
        min: 1,
        max: 72,
      },
    ],
  },
  {
    key: "extendedSupport",
    name: "Suporte estendido",
    required: false,
    valueFields: [
      { key: "months", label: "Meses", type: "number", required: true, min: 1 },
    ],
  },
];
const CATEGORY_TREE: ProductCategory[] = [
  root("0193a000-0000-7000-8000-000000000c01", "Conectividade", {
    requiresCoverage: true,
  }),
  root("0193a000-0000-7000-8000-000000000c02", "Infra física", {
    requiresCoverage: true,
    displayOrder: 1,
  }),
  root("0193a000-0000-7000-8000-000000000c03", "Hardware e CPE", {
    hasNumericStock: true,
    displayOrder: 2,
  }),
  root("0193a000-0000-7000-8000-000000000c04", "Recursos numéricos", {
    hasNumericStock: true,
    displayOrder: 3,
  }),
  root(SOFTWARE_ID, "Softwares e gerenciamento", { displayOrder: 4 }, [
    MONITORING,
    BACKUP,
  ]),
  root("0193a000-0000-7000-8000-000000000c06", "Protocolos e serviços", {
    displayOrder: 5,
  }),
];
const MONITORING_TEMPLATE: ProductCategory["template"] = [
  {
    key: "monitoredDevices",
    label: "Dispositivos monitorados",
    type: "number",
    required: true,
    min: 1,
  },
  {
    key: "tool",
    label: "Ferramenta",
    type: "single_choice",
    required: false,
    options: ["zabbix", "prtg"],
  },
];

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

/**
 * Escolhe a localidade A (obrigatória em Conectividade e Infra Física) e o
 * raio. O combobox do Chakra sincroniza o texto no tick seguinte: tecla a
 * tecla, letras se perdem no jsdom com a máquina carregada. O endereço entra
 * inteiro, menos a última letra, numa mudança só; a última vem do teclado,
 * porque o combobox decide abrir a lista pelo texto anterior à tecla.
 */
async function fillFirstLocation(user: ReturnType<typeof renderForm>["user"]) {
  const input = screen.getByRole("combobox", {
    name: /SellerOfferCreate.coverage.locationLabel/,
  });
  await user.click(input);
  fireEvent.change(input, { target: { value: "Av Dom Lui" } });
  await user.type(input, "s");
  await user.click(
    await screen.findByRole(
      "option",
      { name: /Av\. Dom Luís, 300/ },
      OPTIONS_TIMEOUT,
    ),
  );
  await user.type(
    await screen.findByLabelText(/SellerOfferCreate.coverage.radiusLabel/),
    "10",
  );
}

/** Escolhe o registro dos recursos numéricos (obrigatório na etapa 1). */
async function selectRegion(
  user: ReturnType<typeof renderForm>["user"],
  registry = "lacnic",
) {
  await user.selectOptions(
    screen.getByLabelText("SellerOfferCreate.coverage.regionLabel"),
    registry,
  );
}

beforeAll(() => {
  // O jsdom não implementa URLs de Blob (prévia da imagem).
  URL.createObjectURL = vi.fn(() => "blob:offer-image");
  URL.revokeObjectURL = vi.fn();
});

// Software não tem KMZ, velocidade obrigatória nem bloco extra: é o caminho
// mais curto até a etapa 4. `options` entra na subcategoria e nos campos
// genéricos do template.
async function goToPricing(
  options: {
    afterCategory?: (
      user: ReturnType<typeof renderForm>["user"],
    ) => Promise<void>;
    beforeTechnicalContinue?: (
      user: ReturnType<typeof renderForm>["user"],
    ) => Promise<void>;
  } = {},
) {
  const rendered = renderForm();
  const { user } = rendered;
  const paste = async (label: RegExp, text: string) => {
    await user.click(screen.getByLabelText(label));
    await user.paste(text);
  };

  await user.click(category("software"));
  await options.afterCategory?.(user);
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
  await options.beforeTechnicalContinue?.(user);
  await user.click(continueButton());

  await screen.findByLabelText(/SellerOfferCreate.pricing.pricingModelLabel/);
  return { ...rendered, paste };
}

/** Preenche a etapa 4 e chega à revisão final. */
async function goToReview(options: Parameters<typeof goToPricing>[0] = {}) {
  const rendered = await goToPricing(options);
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
// Fluxos de várias etapas: isolados levam 5 a 8 s; com a suíte inteira em
// paralelo, passam de 20 s.
describe("FormSellerOffer", { timeout: 90_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCategoryTemplateCache();
    vi.mocked(mapboxGeocodingService.search).mockResolvedValue([ADDRESS]);
    vi.mocked(productCatalogService.listCategories).mockResolvedValue(
      CATEGORY_TREE,
    );
    vi.mocked(productCatalogService.getCategory).mockImplementation(
      async (categoryId) => ({
        ...root(categoryId, "categoria"),
        template: categoryId === MONITORING_ID ? MONITORING_TEMPLATE : [],
        rules: categoryId === BACKUP_ID ? BACKUP_RULES : [],
      }),
    );
  });

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

  it("Conectividade avisa que a cobertura vem depois, exige a localidade A e avança", async () => {
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

    // A localidade A é obrigatória no template de Conectividade.
    await user.click(continueButton());
    expect(
      await screen.findByText("SellerOfferCreate.errors.locationRequired"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
    ).not.toBeVisible();

    await fillFirstLocation(user);
    await user.click(continueButton());

    expect(
      await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
    ).toBeVisible();
  });

  it("Infra Física também exige a localidade A", async () => {
    const { user } = renderForm();

    await user.click(category("physicalInfra"));
    await user.click(continueButton());

    expect(
      await screen.findByText("SellerOfferCreate.errors.locationRequired"),
    ).toBeInTheDocument();
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

  it("Recursos Numéricos exigem o registro dentro do card", async () => {
    const { user } = renderForm();

    await user.click(category("numberingResources"));

    expect(
      screen.getByLabelText("SellerOfferCreate.coverage.regionLabel"),
    ).toBeVisible();
    expect(
      screen.getByRole("option", {
        name: "SellerOfferCreate.coverage.registries.nic_br",
      }),
    ).toBeInTheDocument();

    await user.click(continueButton());
    expect(
      await screen.findByText("SellerOfferCreate.errors.regionRequired"),
    ).toBeInTheDocument();

    await selectRegion(user);
    await user.click(continueButton());

    expect(
      await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/),
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
    async function fillHardware(
      user: Awaited<ReturnType<typeof renderForm>>["user"],
    ) {
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
      await user.click(
        screen.getByLabelText(/SellerOfferCreate.hardware.warrantyLabel/),
      );
      await user.paste("12");
      await user.selectOptions(
        screen.getByLabelText(/SellerOfferCreate.hardware.serializationLabel/),
        "yes",
      );
    }

    async function goToTechnicalSpecs(categoryKey = "hardware") {
      const rendered = renderForm();
      const { user } = rendered;
      await user.click(category(categoryKey));
      // Campos obrigatórios da etapa 1 em cada categoria.
      if (categoryKey === "numberingResources") await selectRegion(user);
      if (categoryKey === "connectivity" || categoryKey === "physicalInfra") {
        await fillFirstLocation(user);
      }
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
      // O tipo é uma lista com as opções do template.
      expect(
        screen.getByRole("option", {
          name: "SellerOfferCreate.numbering.resourceTypes.asn",
        }),
      ).toBeInTheDocument();
    });

    it("Conectividade exige os IPs inclusos (só dígitos)", async () => {
      const { user } = await goToTechnicalSpecs("connectivity");
      const includedIps = screen.getByLabelText(
        /SellerOfferCreate.technicalSpecs.includedIpsLabel/,
      );

      await user.click(continueButton());

      expect(
        await screen.findByText("SellerOfferCreate.errors.includedIpsRequired"),
      ).toBeInTheDocument();

      await user.type(includedIps, "8a");
      expect(includedIps).toHaveValue("8");
      await waitFor(() =>
        expect(
          screen.queryByText("SellerOfferCreate.errors.includedIpsRequired"),
        ).not.toBeInTheDocument(),
      );
    });

    it("Infra Física exige capacidade, unidade vendida e energia/espaço/porta", async () => {
      const { user } = await goToTechnicalSpecs("physicalInfra");

      expect(
        screen.getByRole("group", { name: "SellerOfferCreate.infra.title" }),
      ).toBeVisible();
      // Fora de Conectividade não há IPs inclusos.
      expect(
        screen.queryByLabelText(
          /SellerOfferCreate.technicalSpecs.includedIpsLabel/,
        ),
      ).not.toBeInTheDocument();

      await user.click(continueButton());

      expect(
        await screen.findByText("SellerOfferCreate.errors.capacityRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.soldUnitRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.powerSpacePortRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", {
          name: "SellerOfferCreate.infra.soldUnits.rack_unit",
        }),
      ).toBeInTheDocument();
    });

    it("Hardware exige fabricante, modelo, condição, garantia e serialização", async () => {
      const { user } = await goToTechnicalSpecs();

      expect(
        screen.getByRole("group", {
          name: "SellerOfferCreate.hardware.title",
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
        screen.getByText("SellerOfferCreate.errors.warrantyRequired"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.serializationRequired"),
      ).toBeInTheDocument();
      // Usado é uma das condições do template.
      expect(
        screen.getByRole("option", {
          name: "SellerOfferCreate.hardware.conditions.used",
        }),
      ).toBeInTheDocument();
      // O envio é da etapa Logística, ainda não validada.
      expect(
        screen.queryByText("SellerOfferCreate.errors.weightRequired"),
      ).not.toBeInTheDocument();
    });

    it("não mostra o bloco de Hardware nem a etapa Logística nas outras categorias", async () => {
      await goToTechnicalSpecs("software");

      expect(
        screen.queryByRole("group", {
          name: "SellerOfferCreate.hardware.title",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("SellerOfferCreate.steps.logistics"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("SellerOfferCreate.logistics.rulesTitle"),
      ).not.toBeInTheDocument();
    });

    it("Atributos: linha começada exige os três campos; + e − somam e tiram linhas", async () => {
      const { user } = await goToTechnicalSpecs("software");
      const names = () =>
        screen.getAllByLabelText("SellerOfferCreate.attributes.nameLabel");

      expect(
        screen.getByRole("group", {
          name: "SellerOfferCreate.attributes.title",
        }),
      ).toBeInTheDocument();
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
      await user.paste("5 dias úteis");

      await user.click(names()[0]);
      await user.paste("Velocidade");
      await user.click(continueButton());

      expect(
        await screen.findByText(
          "SellerOfferCreate.errors.attributeTypeRequired",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("SellerOfferCreate.errors.attributeValuesRequired"),
      ).toBeInTheDocument();

      // O "+" acrescenta outra linha; o "−" a remove.
      await user.click(
        screen.getByRole("button", {
          name: "SellerOfferCreate.attributes.add",
        }),
      );
      expect(names()).toHaveLength(2);
      await user.click(
        screen.getAllByRole("button", {
          name: "SellerOfferCreate.attributes.remove",
        })[1],
      );
      expect(names()).toHaveLength(1);

      // O "×" limpa o campo: linha vazia não bloqueia o avanço.
      await user.click(
        screen.getByRole("button", {
          name: "SellerOfferCreate.attributes.clearName",
        }),
      );
      expect(names()[0]).toHaveValue("");
      await user.click(continueButton());

      expect(
        await screen.findByLabelText(
          /SellerOfferCreate.pricing.pricingModelLabel/,
        ),
      ).toBeInTheDocument();
    });

    // Preenche o bloco de Hardware inteiro (5 campos) antes de avançar.
    it(
      "mostra os SLAs no preview e avança para a Logística",
      {
        timeout: 90_000,
      },
      async () => {
        const { user } = await goToTechnicalSpecs();

        expect(
          screen.getByText("SellerOfferCreate.steps.logistics"),
        ).toBeInTheDocument();
        await user.type(
          screen.getByLabelText(
            /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
          ),
          "98,5",
        );
        expect(screen.getByText("98,5%")).toBeInTheDocument();
        expect(screen.getByText("48h")).toBeInTheDocument();

        await fillHardware(user);
        await user.click(continueButton());

        expect(
          await screen.findByText("SellerOfferCreate.logistics.rulesTitle"),
        ).toBeVisible();
      },
    );

    // Percorre três etapas antes de chegar à Logística: mais lento no jsdom.
    describe("etapa Logística (Hardware)", { timeout: 90_000 }, () => {
      async function goToLogistics() {
        const rendered = await goToTechnicalSpecs();
        const { user } = rendered;
        await user.click(
          screen.getByLabelText(
            /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
          ),
        );
        await user.paste("99,5");
        await fillHardware(user);
        await user.click(continueButton());
        await screen.findByText("SellerOfferCreate.logistics.rulesTitle");
        return rendered;
      }

      const weightInput = () =>
        screen.getByLabelText(/SellerOfferCreate.shipping.weightLabel/);
      const radio = (name: string) => screen.getByRole("radio", { name });

      it("começa com 1 dia útil e a Integração Neutra+ e exige origem e pacote", async () => {
        const { user } = await goToLogistics();

        expect(
          radio("SellerOfferCreate.logistics.dispatch.oneDay"),
        ).toBeChecked();
        expect(
          radio("SellerOfferCreate.logistics.modes.integration.title"),
        ).toBeChecked();
        expect(
          screen.getByText("SellerOfferCreate.logistics.recommended"),
        ).toBeVisible();

        await user.click(continueButton());

        expect(
          await screen.findByText(
            "SellerOfferCreate.errors.postalCodeRequired",
          ),
        ).toBeInTheDocument();
        expect(
          screen.getByText("SellerOfferCreate.errors.heightRequired"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("SellerOfferCreate.errors.weightRequired"),
        ).toBeInTheDocument();
      });

      it("o tamanho pronto preenche as medidas e o peso em gramas; simula e avança", async () => {
        const { user } = await goToLogistics();

        expect(
          radio("SellerOfferCreate.logistics.presets.custom"),
        ).toBeChecked();
        // Sem "Não sei o peso": a única caixa é o rastreio automático.
        expect(screen.getAllByRole("checkbox")).toHaveLength(1);

        await user.click(radio("SellerOfferCreate.logistics.presets.medium"));

        for (const label of [
          /SellerOfferCreate.shipping.heightLabel/,
          /SellerOfferCreate.shipping.widthLabel/,
          /SellerOfferCreate.shipping.lengthLabel/,
        ]) {
          expect(screen.getByLabelText(label)).toHaveValue("30");
        }
        expect(weightInput()).toHaveValue("3000");
        expect(
          screen.getByText("SellerOfferCreate.logistics.presetHints.medium"),
        ).toBeVisible();

        // Sem CEP, a simulação pede a origem.
        expect(
          screen.getByText("SellerOfferCreate.logistics.simulationPending"),
        ).toBeVisible();

        await user.type(
          screen.getByLabelText(/SellerOfferCreate.shipping.postalCodeLabel/),
          "60150161",
        );
        // A máscara põe o hífen do CEP.
        expect(
          screen.getByLabelText(/SellerOfferCreate.shipping.postalCodeLabel/),
        ).toHaveValue("60150-161");
        expect(
          screen.getByText("SellerOfferCreate.logistics.simulationTitle"),
        ).toBeVisible();
        expect(screen.getByText("Jadlog Package")).toBeVisible();
        expect(screen.getByText("R$ 28,40")).toBeVisible();

        // Ajuste dentro do tamanho: continua Médio.
        await user.clear(weightInput());
        await user.type(weightInput(), "4200");
        expect(
          radio("SellerOfferCreate.logistics.presets.medium"),
        ).toBeChecked();

        await user.click(continueButton());

        expect(
          await screen.findByLabelText(
            /SellerOfferCreate.pricing.pricingModelLabel/,
          ),
        ).toBeVisible();
      });

      it("sob encomenda pede de 4 a 30 dias úteis", async () => {
        const { user } = await goToLogistics();

        expect(
          screen.queryByLabelText(
            /SellerOfferCreate.logistics.onDemandDaysLabel/,
          ),
        ).not.toBeInTheDocument();

        await user.click(
          radio("SellerOfferCreate.logistics.dispatch.onDemand"),
        );
        await user.click(continueButton());

        expect(
          await screen.findByText("SellerOfferCreate.errors.onDemandDaysRange"),
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText(
            /SellerOfferCreate.logistics.onDemandDaysLabel/,
          ),
        ).toBeVisible();
      });

      it("pacote acima do limite de mercado troca as modalidades por carga e a combinar", async () => {
        const { user } = await goToLogistics();

        await user.click(radio("SellerOfferCreate.logistics.presets.cargo"));
        for (const [label, value] of [
          [/SellerOfferCreate.shipping.heightLabel/, "120"],
          [/SellerOfferCreate.shipping.widthLabel/, "60"],
          [/SellerOfferCreate.shipping.lengthLabel/, "60"],
          [/SellerOfferCreate.shipping.weightLabel/, "45000"],
        ] as const) {
          await user.type(screen.getByLabelText(label), value);
        }

        await waitFor(() =>
          expect(
            radio("SellerOfferCreate.logistics.modes.cargo.title"),
          ).toBeChecked(),
        );
        expect(
          radio("SellerOfferCreate.logistics.modes.toBeAgreed.title"),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("radio", {
            name: "SellerOfferCreate.logistics.modes.integration.title",
          }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByText("SellerOfferCreate.logistics.outOfLimitNote"),
        ).toBeVisible();
        // Valor e prazo do seller, para quando a integração não cotar.
        expect(
          screen.getByLabelText(/SellerOfferCreate.logistics.cargoPriceLabel/),
        ).toBeVisible();

        await user.click(
          radio("SellerOfferCreate.logistics.modes.toBeAgreed.title"),
        );
        expect(
          screen.getByText("SellerOfferCreate.logistics.toBeAgreedNote"),
        ).toBeVisible();
        expect(screen.queryByText("Jadlog Package")).not.toBeInTheDocument();
      });

      it("retirada no local pede endereço e horário, desliga acréscimo e rastreio e troca a simulação pelo aviso", async () => {
        const { user } = await goToLogistics();

        await user.click(
          radio("SellerOfferCreate.logistics.modes.pickup.title"),
        );

        expect(
          screen.getByLabelText(
            /SellerOfferCreate.logistics.pickupAddressLabel/,
          ),
        ).toBeVisible();
        expect(
          screen.getByLabelText(/SellerOfferCreate.logistics.pickupHoursLabel/),
        ).toBeVisible();
        expect(
          screen.getByLabelText(/SellerOfferCreate.logistics.extraFeeLabel/),
        ).toBeDisabled();
        expect(
          screen.getByRole("checkbox", {
            name: /SellerOfferCreate.logistics.trackingTitle/,
          }),
        ).toBeDisabled();
        expect(
          screen.getByText("SellerOfferCreate.logistics.pickupNote"),
        ).toBeVisible();
        expect(screen.queryByText("Jadlog Package")).not.toBeInTheDocument();
      });
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

      // Caixa de banco: cada dígito entra pela direita; letras são ignoradas.
      await user.type(price, "1a89000");
      expect(price).toHaveValue("1.890,00");

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
      // O símbolo da moeda acompanha o preço e o setup.
      expect(screen.getAllByText("R$")).toHaveLength(2);

      // Setup usa a máscara do preço: os dígitos entram em centavos.
      const setup = screen.getByLabelText(
        /SellerOfferCreate.pricing.setupLabel/,
      );
      await user.type(setup, "50000");
      expect(setup).toHaveValue("500,00");

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

    it("cria a especificação na categoria, cria a oferta e publica", async () => {
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
      // Uma especificação por oferta, na categoria da árvore da plataforma.
      expect(productCatalogService.createSpecification).toHaveBeenCalledWith({
        name: "Softwares e Gerenciamento",
        categoryId: "0193a000-0000-7000-8000-000000000c05",
        characteristics: {},
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

    // Percorre as cinco etapas com a documentação da categoria: mais lento.
    it(
      "cria uma especificação nova com os valores do template e o estoque na oferta (Recursos Numéricos)",
      {
        timeout: 90_000,
      },
      async () => {
        const { user } = renderForm();
        const paste = async (label: RegExp, text: string) => {
          await user.click(screen.getByLabelText(label));
          await user.paste(text);
        };

        await user.click(category("numberingResources"));
        await selectRegion(user, "nic_br");
        await user.click(continueButton());

        await screen.findByLabelText(/SellerOfferCreate.basicInfo.nameLabel/);
        await paste(/SellerOfferCreate.basicInfo.nameLabel/, "Bloco IPv6 /48");
        await paste(
          /SellerOfferCreate.basicInfo.shortDescriptionLabel/,
          "Bloco /48 via NIC.br",
        );
        await paste(
          /SellerOfferCreate.basicInfo.descriptionLabel/,
          "Bloco IPv6 /48 via NIC.br com transferência de titularidade e suporte.",
        );
        await user.click(continueButton());

        await screen.findByLabelText(
          /SellerOfferCreate.technicalSpecs.technicalSlaLabel/,
        );
        await paste(/SellerOfferCreate.technicalSpecs.technicalSlaLabel/, "99");
        await paste(
          /SellerOfferCreate.technicalSpecs.deliveryTimeLabel/,
          "5 dias úteis",
        );
        await user.selectOptions(
          screen.getByLabelText(
            /SellerOfferCreate.numbering.resourceTypeLabel/,
          ),
          "ipv6",
        );
        await paste(/SellerOfferCreate.numbering.blockLabel/, "1 bloco /48");
        await paste(
          /SellerOfferCreate.numbering.holderLabel/,
          "Transferência definitiva",
        );
        await user.click(continueButton());

        await screen.findByLabelText(
          /SellerOfferCreate.pricing.pricingModelLabel/,
        );
        await user.selectOptions(
          screen.getByLabelText(/SellerOfferCreate.pricing.pricingModelLabel/),
          "monthly",
        );
        await paste(/SellerOfferCreate.pricing.priceLabel/, "800,00");
        await paste(
          /SellerOfferCreate.pricing.cancellationLabel/,
          "30 dias corridos sem multa",
        );
        // Recursos Numéricos só publicam com o estoque.
        await user.click(continueButton());
        expect(
          await screen.findByText("SellerOfferCreate.errors.stockRequired"),
        ).toBeInTheDocument();
        await paste(/SellerOfferCreate.pricing.stockLabel/, "5");
        await user.click(continueButton());
        await screen.findByText("SellerOfferCreate.review.truthfulnessNotice");

        await user.click(publishButton());

        await waitFor(() => expect(onPublished).toHaveBeenCalled());
        // Não procura plano de mesmo nome: cada oferta tem a sua especificação.
        expect(productCatalogService.listSpecifications).not.toHaveBeenCalled();
        expect(productCatalogService.getCatalog).not.toHaveBeenCalled();
        expect(productCatalogService.createSpecification).toHaveBeenCalledTimes(
          1,
        );
        expect(productCatalogService.createSpecification).toHaveBeenCalledWith({
          name: "Recursos Numéricos",
          categoryId: "0193a000-0000-7000-8000-000000000c04",
          characteristics: {
            resourceType: "ipv6",
            block: "1 bloco /48",
            allowedUse: "Transferência definitiva",
            registry: "nic_br",
          },
        });
        expect(productCatalogService.createOffering).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Bloco IPv6 /48",
            specificationId: "spec-1",
            monthlyPrice: "800.00",
            stockQuantity: 5,
          }),
        );
      },
    );

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

    it("subcategoria: pede os campos próprios do template e cria a especificação nela", async () => {
      const chooseSubcategory = async (
        user: ReturnType<typeof renderForm>["user"],
      ) => {
        await user.selectOptions(
          await screen.findByLabelText(
            "SellerOfferCreate.coverage.subcategoryLabel",
          ),
          MONITORING_ID,
        );
      };
      const fillTemplate = async (
        user: ReturnType<typeof renderForm>["user"],
      ) => {
        // Obrigatório vazio segura a etapa.
        await user.click(continueButton());
        expect(
          await screen.findByText("SellerOfferCreate.errors.templateRequired"),
        ).toBeInTheDocument();
        await user.type(
          screen.getByLabelText(/Dispositivos monitorados/),
          "250",
        );
        await user.selectOptions(screen.getByLabelText(/Ferramenta/), "zabbix");
      };
      const { user } = await goToReview({
        afterCategory: chooseSubcategory,
        beforeTechnicalContinue: fillTemplate,
      });

      expect(
        screen.getAllByText(
          "SellerOfferCreate.categories.software.label › Monitoramento",
        ).length,
      ).toBeGreaterThan(0);

      await user.click(publishButton());

      await waitFor(() =>
        expect(productCatalogService.createSpecification).toHaveBeenCalledWith({
          name: "Monitoramento",
          categoryId: MONITORING_ID,
          characteristics: { monitoredDevices: 250, tool: "zabbix" },
        }),
      );
      expect(productCatalogService.getCategory).toHaveBeenCalledWith(
        MONITORING_ID,
        expect.anything(),
      );
    });

    it("regras da categoria: obrigatória trava a etapa, opcional ligada pede os valores e tudo vai em ruleValues", async () => {
      const chooseBackup = async (
        user: ReturnType<typeof renderForm>["user"],
      ) => {
        await user.selectOptions(
          await screen.findByLabelText(
            "SellerOfferCreate.coverage.subcategoryLabel",
          ),
          BACKUP_ID,
        );
      };
      const fillRules = async (user: ReturnType<typeof renderForm>["user"]) => {
        expect(
          await screen.findByText("SellerOfferCreate.rules.title"),
        ).toBeInTheDocument();
        // A obrigatória vazia segura a etapa.
        await user.click(continueButton());
        expect(
          await screen.findByText("SellerOfferCreate.errors.templateRequired"),
        ).toBeInTheDocument();
        await user.type(screen.getByLabelText(/Horas para aceitar/), "48");
        // A opcional só pede valor depois de ligada.
        expect(screen.queryByLabelText(/Meses/)).not.toBeInTheDocument();
        await user.click(
          screen.getByLabelText("SellerOfferCreate.rules.apply"),
        );
        await user.type(await screen.findByLabelText(/Meses/), "12");
      };
      const { user } = await goToReview({
        afterCategory: chooseBackup,
        beforeTechnicalContinue: fillRules,
      });

      await user.click(publishButton());

      await waitFor(() =>
        expect(productCatalogService.createOffering).toHaveBeenCalledWith(
          expect.objectContaining({
            ruleValues: {
              fastActivation: { maxAcceptanceHours: 48 },
              extendedSupport: { months: 12 },
            },
          }),
        ),
      );
    });
  });
});
