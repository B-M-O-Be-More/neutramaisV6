import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  offerImagesChanged,
  syncOfferingImages,
} from "@/functions/syncOfferingImages";
import type { OfferImageItem } from "@/schemas/sellerOffer";
import { ApiError, ServerError } from "@/services/errors";
import { objectStorageService } from "@/services/objectStorage.service";
import { productCatalogService } from "@/services/productCatalog.service";

vi.mock("@/services/productCatalog.service", () => ({
  productCatalogService: {
    requestImageUpload: vi.fn(),
    confirmImage: vi.fn(),
    reorderImages: vi.fn(),
    deleteImage: vi.fn(),
  },
}));

vi.mock("@/services/objectStorage.service", () => ({
  objectStorageService: { uploadToSignedForm: vi.fn() },
}));

const OFFERING = "offering-1";
const file = (name: string, type = "image/png") =>
  new File([name], name, { type });
const added = (name: string): OfferImageItem => ({
  kind: "new",
  file: file(name),
});
const saved = (id: string): OfferImageItem => ({
  kind: "saved",
  id,
  url: null,
});

const upload = (imageId: string) => ({
  imageId,
  upload: {
    url: "https://storage.test/bucket",
    fields: { key: `offering-images/${imageId}` },
    expiresAt: "2026-10-29T12:15:00Z",
    maxBytes: 3,
    contentType: "image/png" as const,
  },
});

describe("syncOfferingImages", () => {
  let nextId = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    nextId = 0;
    vi.mocked(productCatalogService.requestImageUpload).mockImplementation(
      async () => upload(`new-${(nextId += 1)}`),
    );
  });

  it("na criação, autoriza, envia ao storage e confirma cada imagem na ordem, sem reordenar", async () => {
    const items = [added("capa.png"), added("b.png")];

    const warnings = await syncOfferingImages(OFFERING, items);

    expect(warnings).toEqual([]);
    expect(productCatalogService.requestImageUpload).toHaveBeenNthCalledWith(
      1,
      OFFERING,
      { contentType: "image/png", sizeBytes: "capa.png".length },
    );
    expect(objectStorageService.uploadToSignedForm).toHaveBeenNthCalledWith(
      1,
      upload("new-1").upload,
      (items[0] as { file: File }).file,
    );
    expect(productCatalogService.confirmImage).toHaveBeenNthCalledWith(
      1,
      OFFERING,
      "new-1",
    );
    expect(productCatalogService.confirmImage).toHaveBeenNthCalledWith(
      2,
      OFFERING,
      "new-2",
    );
    // Autoriza → envia → confirma, uma imagem por vez.
    const order = [
      vi.mocked(productCatalogService.requestImageUpload).mock
        .invocationCallOrder[0],
      vi.mocked(objectStorageService.uploadToSignedForm).mock
        .invocationCallOrder[0],
      vi.mocked(productCatalogService.confirmImage).mock.invocationCallOrder[0],
      vi.mocked(productCatalogService.requestImageUpload).mock
        .invocationCallOrder[1],
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(productCatalogService.reorderImages).not.toHaveBeenCalled();
  });

  it("na edição, remove as que saíram, envia as novas e reordena pela lista", async () => {
    const items = [added("nova.png"), saved("b")];

    const warnings = await syncOfferingImages(OFFERING, items, ["a", "b"]);

    expect(warnings).toEqual([]);
    expect(productCatalogService.deleteImage).toHaveBeenCalledWith(
      OFFERING,
      "a",
    );
    // No servidor ficou [b, new-1]; a lista pede a nova como capa.
    expect(productCatalogService.reorderImages).toHaveBeenCalledWith(OFFERING, [
      "new-1",
      "b",
    ]);
  });

  it("só reordena quando a ordem mudou", async () => {
    await syncOfferingImages(OFFERING, [saved("a"), saved("b")], ["a", "b"]);
    expect(productCatalogService.reorderImages).not.toHaveBeenCalled();

    await syncOfferingImages(OFFERING, [saved("b"), saved("a")], ["a", "b"]);
    expect(productCatalogService.reorderImages).toHaveBeenCalledWith(OFFERING, [
      "b",
      "a",
    ]);
  });

  it("imagem recusada (422) vira aviso e as outras seguem", async () => {
    vi.mocked(productCatalogService.confirmImage).mockRejectedValueOnce(
      new ApiError(422),
    );

    const warnings = await syncOfferingImages(OFFERING, [
      added("ruim.png"),
      added("boa.png"),
    ]);

    expect(warnings).toEqual(["SellerOfferImages.warnings.imagesInvalid"]);
    expect(productCatalogService.confirmImage).toHaveBeenCalledTimes(2);
  });

  it("storage indisponível (503) para os envios seguintes", async () => {
    vi.mocked(productCatalogService.requestImageUpload).mockRejectedValue(
      new ServerError(503),
    );

    const warnings = await syncOfferingImages(OFFERING, [
      added("a.png"),
      added("b.png"),
    ]);

    expect(warnings).toEqual(["SellerOfferImages.warnings.imagesUnavailable"]);
    expect(productCatalogService.requestImageUpload).toHaveBeenCalledTimes(1);
  });

  it("remoção que falha mantém a imagem no fim da nova ordem", async () => {
    vi.mocked(productCatalogService.deleteImage).mockRejectedValue(
      new ServerError(500),
    );

    const warnings = await syncOfferingImages(
      OFFERING,
      [saved("b"), saved("c")],
      ["a", "b", "c"],
    );

    expect(warnings).toEqual(["SellerOfferImages.warnings.imagesDeleteFailed"]);
    expect(productCatalogService.reorderImages).toHaveBeenCalledWith(OFFERING, [
      "b",
      "c",
      "a",
    ]);
  });
});

describe("offerImagesChanged", () => {
  it("compara ids e ordem; arquivo novo é sempre mudança", () => {
    expect(offerImagesChanged([], [])).toBe(false);
    expect(offerImagesChanged([saved("a"), saved("b")], ["a", "b"])).toBe(
      false,
    );
    expect(offerImagesChanged([saved("b"), saved("a")], ["a", "b"])).toBe(true);
    expect(offerImagesChanged([saved("a")], ["a", "b"])).toBe(true);
    expect(offerImagesChanged([saved("a"), added("x.png")], ["a"])).toBe(true);
  });
});
