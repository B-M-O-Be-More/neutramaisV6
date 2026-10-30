import { beforeEach, describe, expect, it, vi } from "vitest";

import SellerCoveragePanel from "@/components/SellerCoveragePanel";
import { rememberKmzFileName } from "@/functions/kmzFileNames";
import { KmzParseError, parseKmz } from "@/functions/parseKmz";
import {
  ConflictError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from "@/services/errors";
import { geoCoverageService } from "@/services/geoCoverage.service";
import { geoStorageService } from "@/services/geoStorage.service";
import { productCatalogService } from "@/services/productCatalog.service";

import { renderWithProviders, screen, waitFor, within } from "../test-utils";

vi.mock("@/services/geoCoverage.service", () => ({
  geoCoverageService: {
    uploadKmz: vi.fn(),
    listFiles: vi.fn(),
    getVersion: vi.fn(),
    downloadOriginal: vi.fn(),
  },
}));

vi.mock("@/services/geoStorage.service", () => ({
  geoStorageService: { getStorage: vi.fn(), updateQuota: vi.fn() },
}));

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: { listOrganizationOfferings: vi.fn() },
}));

// O KMZ é lido no navegador antes do envio; aqui só a resposta importa.
vi.mock("@/functions/parseKmz", async (original) => ({
  ...(await original<typeof import("@/functions/parseKmz")>()),
  parseKmz: vi.fn(),
}));

const ORGANIZATION = "018f4c2a-9b31-7d64-a0e5-2f7c1b8d3e90";
const VERSION = "0193f1e2-7a6b-7c8d-9e0f-1a2b3c4d5e6f";

const CREATED = {
  id: VERSION,
  organizationId: ORGANIZATION,
  predecessorId: null,
  sourceSha256: "a".repeat(64),
  createdAt: "2026-04-28T12:00:00Z",
  logicalFileId: VERSION,
  originalAvailable: true,
  metadataAvailable: true,
};

const NO_FILES = { items: [], total: 0, offset: 0, limit: 200 };

const kmzFile = () =>
  new File([new Uint8Array([80, 75, 3, 4])], "russas.kmz", {
    type: "application/vnd.google-earth.kmz",
  });

function renderPanel(canUpload = true) {
  return renderWithProviders(
    <SellerCoveragePanel
      organizationId={ORGANIZATION}
      canUpload={canUpload}
      locale="pt-BR"
    />,
  );
}

const saveButton = () =>
  screen.getByRole("button", { name: /SellerCoverage.form.save/ });

const dropzone = () => screen.getByLabelText(/SellerCoverage.form.dropTitle/);

describe("SellerCoveragePanel (aba Cobertura)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(geoCoverageService.listFiles).mockResolvedValue(NO_FILES);
    vi.mocked(
      productCatalogService.listOrganizationOfferings,
    ).mockResolvedValue({
      data: [
        { id: "o1", coverageVersionId: VERSION },
        { id: "o2", coverageVersionId: VERSION },
        { id: "o3", coverageVersionId: null },
      ],
      metadata: null,
    } as never);
    vi.mocked(parseKmz).mockResolvedValue({
      geometry: { type: "FeatureCollection", features: [] },
      regionCount: 1,
      polygonCount: 3,
    } as never);
    vi.mocked(geoCoverageService.uploadKmz).mockResolvedValue(CREATED);
    vi.mocked(geoStorageService.getStorage).mockResolvedValue({
      organizationId: ORGANIZATION,
      quotaMb: 200,
      usedMb: 50,
      availableMb: 150,
      overQuota: false,
      originalsMb: 30,
      geometriesMb: 15,
      metadataMb: 5,
      defaultQuotaMb: 200,
      maxQuotaMb: 1000,
    });
  });

  it("mostra o uso da cota de armazenamento, sem alterar a cota", async () => {
    renderPanel();

    expect(await screen.findByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    expect(geoStorageService.getStorage).toHaveBeenCalledWith(
      ORGANIZATION,
      expect.anything(),
    );
    expect(
      screen.queryByRole("button", { name: /CoverageStorage.quota.edit/ }),
    ).not.toBeInTheDocument();
  });

  it("sem coberturas na organização, orienta a cadastrar", async () => {
    renderPanel();

    expect(
      await screen.findByText("SellerCoverage.list.emptyHint"),
    ).toBeInTheDocument();
    expect(geoCoverageService.listFiles).toHaveBeenCalledWith(
      ORGANIZATION,
      { offset: 0, limit: 200, activeOnly: true },
      expect.anything(),
    );
    expect(screen.getByText("SellerCoverage.ownerOnly")).toBeInTheDocument();
  });

  it("só pede o arquivo: o upload da geo-api não recebe nome nem descrição", async () => {
    const { user } = renderPanel();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(saveButton());

    expect(
      await screen.findByText("SellerCoverage.errors.fileRequired"),
    ).toBeInTheDocument();
    expect(geoCoverageService.uploadKmz).not.toHaveBeenCalled();
  });

  it("salva a cobertura, lista com as ofertas vinculadas e abre os detalhes", async () => {
    let respond!: (version: typeof CREATED) => void;
    vi.mocked(geoCoverageService.uploadKmz).mockReturnValue(
      new Promise((resolve) => (respond = resolve)),
    );
    const { user } = renderPanel();

    await user.upload(dropzone(), kmzFile());
    expect(screen.getByText("russas.kmz")).toBeInTheDocument();

    await user.click(saveButton());

    // Enquanto a geo-api importa, avisa que pode levar minutos.
    expect(
      await screen.findByText("SellerOfferCreate.kmz.processing"),
    ).toBeInTheDocument();
    respond(CREATED);
    await waitFor(() =>
      expect(geoCoverageService.uploadKmz).toHaveBeenCalledWith({
        organizationId: ORGANIZATION,
        file: expect.any(File),
      }),
    );

    // A linha da lista (o nome também passa pela área de envio).
    const row = await waitFor(() => {
      const item = screen
        .getAllByText("russas.kmz")
        .map((element) => element.closest("li"))
        .find(Boolean);
      expect(item).toBeTruthy();
      return item!;
    });
    expect(
      within(row).getByText("SellerCoverage.list.offers"),
    ).toBeInTheDocument();
    // O KMZ novo entrou no consumo e na lista: ambos são lidos de novo.
    await waitFor(() =>
      expect(geoStorageService.getStorage).toHaveBeenCalledTimes(2),
    );
    expect(geoCoverageService.listFiles).toHaveBeenCalledTimes(2);
    // O formulário volta vazio para a próxima cobertura.
    expect(
      screen.getByText("SellerCoverage.form.dropTitle"),
    ).toBeInTheDocument();

    await user.click(
      within(row).getByRole("button", {
        name: "SellerCoverage.list.detailsOf",
      }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText("SellerCoverage.details.fields.polygons"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("3")).toBeInTheDocument();
    // A geometria lida no envio dispensa baixar o original.
    expect(geoCoverageService.downloadOriginal).not.toHaveBeenCalled();
  });

  describe("coberturas já enviadas (GET /coverageFile)", () => {
    const FILE = "0193f1e2-0000-7c8d-9e0f-1a2b3c4d5e6f";
    const LISTED = { ...CREATED, logicalFileId: FILE };

    const openDetails = async (user: { click: (el: Element) => unknown }) => {
      await user.click(
        await screen.findByRole("button", {
          name: "SellerCoverage.list.detailsOf",
        }),
      );
      return screen.findByRole("dialog");
    };

    beforeEach(() => {
      vi.mocked(geoCoverageService.listFiles).mockResolvedValue({
        items: [
          {
            fileId: FILE,
            activeVersionId: VERSION,
            archived: false,
            revision: 0,
          },
        ],
        total: 1,
        offset: 0,
        limit: 200,
      });
      vi.mocked(geoCoverageService.getVersion).mockResolvedValue(LISTED);
    });

    it("lista os KMZs da organização com o nome lembrado no navegador", async () => {
      rememberKmzFileName(VERSION, "KMZ Geral.kmz");
      renderPanel();

      const row = (await screen.findByText("KMZ Geral.kmz")).closest("li")!;
      expect(
        within(row).getByText("SellerCoverage.list.offers"),
      ).toBeInTheDocument();
      expect(geoCoverageService.getVersion).toHaveBeenCalledWith(
        VERSION,
        expect.anything(),
      );
    });

    it("sem o nome lembrado, mostra o início do id", async () => {
      renderPanel();

      expect(
        await screen.findByText(`KMZ ${VERSION.slice(0, 8)}`),
      ).toBeInTheDocument();
    });

    it("nos detalhes, baixa o KMZ original e o lê para o mapa", async () => {
      vi.mocked(geoCoverageService.downloadOriginal).mockResolvedValue(
        new Blob([new Uint8Array(2048)]),
      );
      const { user } = renderPanel();

      const dialog = await openDetails(user);

      await waitFor(() =>
        expect(geoCoverageService.downloadOriginal).toHaveBeenCalledWith(
          FILE,
          ORGANIZATION,
          { versionId: VERSION, signal: expect.anything() },
        ),
      );
      expect(parseKmz).toHaveBeenCalledWith(expect.any(File));
      // Contagens lidas do original.
      expect(await within(dialog).findByText("3")).toBeInTheDocument();
      expect(
        within(dialog).queryByText(/SellerOfferCreate.coverage.preview/),
      ).not.toBeInTheDocument();
    });

    it("versão sem original retido explica a falta do mapa sem baixar", async () => {
      vi.mocked(geoCoverageService.getVersion).mockResolvedValue({
        ...LISTED,
        originalAvailable: false,
      });
      const { user } = renderPanel();

      const dialog = await openDetails(user);

      expect(
        await within(dialog).findByText(
          "SellerOfferCreate.coverage.preview.noOriginal",
        ),
      ).toBeInTheDocument();
      expect(geoCoverageService.downloadOriginal).not.toHaveBeenCalled();
    });

    it("original ausente na geo-api (404) também explica a falta do mapa", async () => {
      vi.mocked(geoCoverageService.downloadOriginal).mockRejectedValue(
        new NotFoundError(404),
      );
      const { user } = renderPanel();

      const dialog = await openDetails(user);

      expect(
        await within(dialog).findByText(
          "SellerOfferCreate.coverage.preview.noOriginal",
        ),
      ).toBeInTheDocument();
    });

    it("falha da listagem mostra o erro e tenta de novo", async () => {
      vi.mocked(geoCoverageService.listFiles).mockRejectedValueOnce(
        new ServerError(502),
      );
      const { user } = renderPanel();

      expect(
        await screen.findByText("SellerCoverage.list.errors.failed"),
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "SellerCoverage.list.retry" }),
      );

      expect(
        await screen.findByText(`KMZ ${VERSION.slice(0, 8)}`),
      ).toBeInTheDocument();
    });
  });

  it("KMZ grande demais para pré-visualizar ainda é enviado", async () => {
    vi.mocked(parseKmz).mockResolvedValue({ geometry: null });
    const { user } = renderPanel();

    await user.upload(dropzone(), kmzFile());
    await user.click(saveButton());

    expect(
      (await screen.findByText("russas.kmz")).closest("li"),
    ).toBeInTheDocument();
    expect(geoCoverageService.uploadKmz).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro de leitura do KMZ e não envia", async () => {
    vi.mocked(parseKmz).mockRejectedValue(new KmzParseError("noGeometry"));
    const { user } = renderPanel();

    await user.upload(dropzone(), kmzFile());
    await user.click(saveButton());

    expect(
      await screen.findByText("SellerOfferCreate.kmz.errors.noGeometry"),
    ).toBeInTheDocument();
    expect(geoCoverageService.uploadKmz).not.toHaveBeenCalled();
  });

  it.each([
    ["cota de armazenamento esgotada (409)", new ConflictError(409), "quota"],
    ["outra importação em curso (429)", new RateLimitError(429), "busy"],
    ["importação além do tempo de espera", new TimeoutError("t"), "timeout"],
    ["geo-api fora do ar (502)", new ServerError(502), "unavailable"],
  ])("explica %s", async (_case, error, key) => {
    vi.mocked(geoCoverageService.uploadKmz).mockRejectedValue(error);
    const { user } = renderPanel();

    await user.upload(dropzone(), kmzFile());
    await user.click(saveButton());

    expect(
      await screen.findByText(`SellerOfferCreate.kmz.errors.${key}`),
    ).toBeInTheDocument();
  });

  it("quem não é Dono vê o aviso e não consegue enviar", async () => {
    renderPanel(false);

    expect(
      await screen.findByText("SellerCoverage.notOwner"),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });
});
