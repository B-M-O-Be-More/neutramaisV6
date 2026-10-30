import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerOfferCoverageSection from "@/components/SellerOfferCoverageSection";
import SellerOfferCoverageStep from "@/components/SellerOfferCoverageStep";
import { useOfferingCoverageEditor } from "@/hooks/useOfferingCoverageEditor";
import {
  SELLER_OFFER_DEFAULTS,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";
import { ForbiddenError, NotFoundError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import {
  productCatalogService,
  type ProductOffering,
} from "@/services/productCatalog.service";

import { renderWithProviders, screen, within } from "../test-utils";

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
    getVersion: vi.fn(),
    getOfferCoverage: vi.fn(),
    listFiles: vi.fn(),
    downloadOriginal: vi.fn(),
  },
}));

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: { bindCoverage: vi.fn() },
}));

vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn().mockResolvedValue([]),
  },
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const OFFERING_ID = "0192a0b1-d4e5-7f60-8a9b-0c1d2e3f4a5c";
const BOUND = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";
const FILE = "0193f1e2-0000-7c8d-9e0f-1a2b3c4d5e6f";

const VERSION = {
  id: BOUND,
  organizationId: ORGANIZATION,
  predecessorId: null,
  sourceSha256: "a".repeat(64),
  createdAt: "2026-04-28T12:00:00Z",
  logicalFileId: FILE,
  originalAvailable: true,
  metadataAvailable: true,
};

const NO_FILES = { items: [], total: 0, offset: 0, limit: 200 };
// Arquivo da organização: o `activeVersionId` é a versão vinculada.
const ONE_FILE = {
  items: [
    { fileId: FILE, activeVersionId: BOUND, archived: false, revision: 0 },
  ],
  total: 1,
  offset: 0,
  limit: 200,
};

const kmzGroup = () =>
  screen.findByRole("radiogroup", { name: /SellerOfferCreate.kmz.label/ });
const confirmButton = () =>
  screen.getByRole("button", { name: /SellerOfferCoverage.confirm/ });

/** Etapa no assistente; com `offering`, como na edição. */
function StepHarness({
  category,
  offering,
}: {
  category: SellerOfferValues["category"];
  offering?: ProductOffering;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useForm<SellerOfferValues>({
    defaultValues: { ...SELLER_OFFER_DEFAULTS, category },
  });
  const editor = useOfferingCoverageEditor(offering ?? null);
  return (
    <SellerOfferCoverageStep
      control={control}
      register={register}
      errors={errors}
      organizationId={ORGANIZATION}
      coverageEditor={offering ? editor : undefined}
      locale="pt-BR"
    />
  );
}

/** Área de cobertura de uma oferta já criada. */
function SectionHarness({ boundVersionId }: { boundVersionId: string | null }) {
  const editor = useOfferingCoverageEditor({
    id: OFFERING_ID,
    coverageVersionId: boundVersionId,
  } as ProductOffering);
  return (
    <SellerOfferCoverageSection
      editor={editor}
      organizationId={ORGANIZATION}
      locale="pt-BR"
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(geoCoverageService.listFiles).mockResolvedValue(NO_FILES);
  vi.mocked(geoCoverageService.getVersion).mockResolvedValue(VERSION);
  // Vínculo salvo com o KMZ inteiro (sem recorte).
  vi.mocked(geoCoverageService.getOfferCoverage).mockResolvedValue({
    offeringId: "",
    coverageVersionId: "",
    publicGeometry: null,
  });
  // O mapa baixa o original; aqui o download não termina.
  vi.mocked(geoCoverageService.downloadOriginal).mockReturnValue(
    new Promise(() => {}),
  );
});

describe("SellerOfferCoverageStep", () => {
  it("na criação, categoria com KMZ avisa que a cobertura vem depois", () => {
    renderWithProviders(<StepHarness category="connectivity" />);

    expect(
      screen.getByText("SellerOfferCreate.coverage.afterCreateTitle"),
    ).toBeVisible();
    expect(
      screen.queryByText("SellerOfferCreate.kmz.label"),
    ).not.toBeInTheDocument();
    expect(geoCoverageService.listFiles).not.toHaveBeenCalled();
    // A localidade de atendimento continua no assistente.
    expect(
      screen.getByRole("combobox", {
        name: /SellerOfferCreate.coverage.locationLabel/,
      }),
    ).toBeVisible();
  });

  it("na edição, categoria com KMZ abre a área de cobertura", async () => {
    renderWithProviders(
      <StepHarness
        category="physicalInfra"
        offering={{ id: OFFERING_ID, coverageVersionId: null } as never}
      />,
    );

    expect(
      screen.getByRole("region", { name: "SellerOfferCoverage.title" }),
    ).toBeVisible();
    expect(
      screen.queryByText("SellerOfferCreate.coverage.afterCreateTitle"),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText("SellerOfferCreate.kmz.listEmpty"),
    ).toBeInTheDocument();
  });

  it("categoria sem KMZ mostra 'Cobertura não aplicável'", () => {
    renderWithProviders(
      <StepHarness
        category="software"
        offering={{ id: OFFERING_ID, coverageVersionId: null } as never}
      />,
    );

    expect(
      screen.getByText("SellerOfferCreate.coverage.notApplicableTitle"),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "SellerOfferCoverage.title" }),
    ).not.toBeInTheDocument();
  });
});

describe("SellerOfferCoverageSection — versão vinculada", () => {
  it("busca a versão vinculada e a mostra selecionada com o selo", async () => {
    renderWithProviders(<SectionHarness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.bound"),
    ).toBeInTheDocument();
    expect(geoCoverageService.getVersion).toHaveBeenCalledWith(
      BOUND,
      expect.anything(),
    );
    expect(within(await kmzGroup()).getByRole("radio")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("SellerOfferCoverage.upToDate")).toBeVisible();
    expect(confirmButton()).toBeDisabled();
  });

  it("sem acesso à versão, cai na orientação de enviar um KMZ", async () => {
    vi.mocked(geoCoverageService.getVersion).mockRejectedValue(
      new NotFoundError(404),
    );
    renderWithProviders(<SectionHarness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.listEmpty"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: /SellerOfferCreate.kmz.label/ }),
    ).not.toBeInTheDocument();
  });

  it("sem cobertura, lista só os KMZs da organização e avisa que falta", async () => {
    renderWithProviders(<SectionHarness boundVersionId={null} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.listEmpty"),
    ).toBeInTheDocument();
    expect(geoCoverageService.listFiles).toHaveBeenCalledWith(
      ORGANIZATION,
      { offset: 0, limit: 200, activeOnly: true },
      expect.anything(),
    );
    expect(geoCoverageService.getVersion).not.toHaveBeenCalled();
    expect(screen.getByText("SellerOfferCoverage.missing")).toBeVisible();
    expect(confirmButton()).toBeDisabled();
  });
});

describe("SellerOfferCoverageSection — KMZs da organização", () => {
  beforeEach(() => {
    vi.mocked(geoCoverageService.listFiles).mockResolvedValue(ONE_FILE);
  });

  it("ao escolher o KMZ, carrega o mapa do original", async () => {
    const { user } = renderWithProviders(
      <SectionHarness boundVersionId={null} />,
    );

    const radio = within(await kmzGroup()).getByRole("radio");
    expect(radio).toHaveAttribute("aria-checked", "false");
    expect(geoCoverageService.downloadOriginal).not.toHaveBeenCalled();

    await user.click(radio);

    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(
      await screen.findByText("SellerOfferCreate.coverage.preview.loading"),
    ).toBeInTheDocument();
    expect(geoCoverageService.downloadOriginal).toHaveBeenCalledWith(
      FILE,
      ORGANIZATION,
      { versionId: BOUND, signal: expect.anything() },
    );
  });

  it("'Confirmar cobertura' vincula na hora a cobertura total (activeVersionId, sem polígono)", async () => {
    vi.mocked(productCatalogService.bindCoverage).mockResolvedValue({
      offeringId: OFFERING_ID,
      coverageVersionId: BOUND,
    });
    const { user } = renderWithProviders(
      <SectionHarness boundVersionId={null} />,
    );

    await user.click(within(await kmzGroup()).getByRole("radio"));
    expect(screen.getByText("SellerOfferCoverage.pending")).toBeVisible();
    await user.click(confirmButton());

    expect(productCatalogService.bindCoverage).toHaveBeenCalledWith(
      OFFERING_ID,
      BOUND,
      null,
      [],
    );
    expect(
      await screen.findByText("SellerOfferCoverage.confirmed"),
    ).toBeVisible();
    expect(screen.getByText("SellerOfferCoverage.upToDate")).toBeVisible();
    expect(
      await screen.findByText("SellerOfferCreate.kmz.bound"),
    ).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  it("sem permissão, mostra o erro e deixa tentar de novo", async () => {
    vi.mocked(productCatalogService.bindCoverage).mockRejectedValue(
      new ForbiddenError(403),
    );
    const { user } = renderWithProviders(
      <SectionHarness boundVersionId={null} />,
    );

    await user.click(within(await kmzGroup()).getByRole("radio"));
    await user.click(confirmButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "SellerOfferCreate.publish.errors.coveragePermission",
    );
    expect(confirmButton()).toBeEnabled();
  });

  it("na oferta com a versão vinculada, ela aparece uma vez só", async () => {
    renderWithProviders(<SectionHarness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.bound"),
    ).toBeInTheDocument();
    expect(within(await kmzGroup()).getAllByRole("radio")).toHaveLength(1);
  });
});
