import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerOfferCoverageStep from "@/components/SellerOfferCoverageStep";
import {
  SELLER_OFFER_DEFAULTS,
  type SellerOfferValues,
} from "@/schemas/sellerOffer";
import { NotFoundError } from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";

import { renderWithProviders, screen, within } from "../test-utils";

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
    getVersion: vi.fn(),
    listFiles: vi.fn(),
    downloadOriginal: vi.fn(),
  },
}));

vi.mock("@/services/mapboxGeocoding.service", () => ({
  mapboxGeocodingService: {
    isAvailable: vi.fn(() => true),
    search: vi.fn().mockResolvedValue([]),
  },
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
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

const kmzGroup = () =>
  screen.findByRole("radiogroup", { name: /SellerOfferCreate.kmz.label/ });

function Harness({ boundVersionId }: { boundVersionId: string | null }) {
  const {
    control,
    register,
    formState: { errors },
  } = useForm<SellerOfferValues>({
    defaultValues: {
      ...SELLER_OFFER_DEFAULTS,
      category: "connectivity",
      coverageVersionId: boundVersionId ?? "",
    },
  });
  return (
    <SellerOfferCoverageStep
      control={control}
      register={register}
      errors={errors}
      organizationId={ORGANIZATION}
      boundVersionId={boundVersionId}
      locale="pt-BR"
    />
  );
}

describe("SellerOfferCoverageStep — versão vinculada na edição", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoCoverageService.listFiles).mockResolvedValue(NO_FILES);
    // O mapa baixa o original; aqui o download não termina.
    vi.mocked(geoCoverageService.downloadOriginal).mockReturnValue(
      new Promise(() => {}),
    );
  });

  it("busca a versão vinculada e a mostra selecionada com o selo", async () => {
    vi.mocked(geoCoverageService.getVersion).mockResolvedValue(VERSION);
    renderWithProviders(<Harness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.bound"),
    ).toBeInTheDocument();
    expect(geoCoverageService.getVersion).toHaveBeenCalledWith(
      BOUND,
      expect.anything(),
    );
    const group = screen.getByRole("radiogroup", {
      name: /SellerOfferCreate.kmz.label/,
    });
    expect(within(group).getByRole("radio")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("sem acesso à versão, cai na orientação de enviar um KMZ", async () => {
    vi.mocked(geoCoverageService.getVersion).mockRejectedValue(
      new NotFoundError(404),
    );
    renderWithProviders(<Harness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.listEmpty"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: /SellerOfferCreate.kmz.label/ }),
    ).not.toBeInTheDocument();
  });

  it("na criação só lista os KMZs da organização", async () => {
    renderWithProviders(<Harness boundVersionId={null} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.listEmpty"),
    ).toBeInTheDocument();
    expect(geoCoverageService.listFiles).toHaveBeenCalledWith(
      ORGANIZATION,
      { offset: 0, limit: 200, activeOnly: true },
      expect.anything(),
    );
    expect(geoCoverageService.getVersion).not.toHaveBeenCalled();
  });
});

describe("SellerOfferCoverageStep — KMZs já enviados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(geoCoverageService.listFiles).mockResolvedValue({
      items: [
        { fileId: FILE, activeVersionId: BOUND, archived: false, revision: 0 },
      ],
      total: 1,
      offset: 0,
      limit: 200,
    });
    vi.mocked(geoCoverageService.getVersion).mockResolvedValue(VERSION);
    vi.mocked(geoCoverageService.downloadOriginal).mockReturnValue(
      new Promise(() => {}),
    );
  });

  it("lista o KMZ da organização e, ao escolher, carrega o mapa do original", async () => {
    const { user } = renderWithProviders(<Harness boundVersionId={null} />);

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

  it("na edição, a versão vinculada que está na lista aparece uma vez só", async () => {
    renderWithProviders(<Harness boundVersionId={BOUND} />);

    expect(
      await screen.findByText("SellerOfferCreate.kmz.bound"),
    ).toBeInTheDocument();
    expect(within(await kmzGroup()).getAllByRole("radio")).toHaveLength(1);
  });
});
