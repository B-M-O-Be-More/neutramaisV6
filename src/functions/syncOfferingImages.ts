import type { OfferImageItem } from "@/schemas/sellerOffer";
import { ApiError, upstreamErrorCode } from "@/services/errors";
import { objectStorageService } from "@/services/objectStorage.service";
import {
  productCatalogService,
  type OfferingImageType,
} from "@/services/productCatalog.service";

const WARNINGS = "SellerOfferImages.warnings";

/** Aviso de uma imagem que não subiu; `stop` = as próximas também falhariam. */
function uploadFailure(error: unknown): { key: string; stop: boolean } {
  const code = upstreamErrorCode(error);
  if (code === "MKT_IMAGE_LIMIT_REACHED") {
    return { key: `${WARNINGS}.imagesLimit`, stop: true };
  }
  if (error instanceof ApiError && error.status === 503) {
    return { key: `${WARNINGS}.imagesUnavailable`, stop: true };
  }
  if (error instanceof ApiError && error.status === 422) {
    return { key: `${WARNINGS}.imagesInvalid`, stop: false };
  }
  return { key: `${WARNINGS}.imagesFailed`, stop: false };
}

/**
 * Envia uma imagem para uma oferta que já existe: autoriza na API, manda os
 * bytes direto ao storage e confirma (só então ela aparece na oferta).
 * Devolve o id da imagem confirmada.
 */
export async function uploadOfferingImage(
  offeringId: string,
  file: File,
): Promise<string> {
  const { imageId, upload } = (await productCatalogService.requestImageUpload(
    offeringId,
    { contentType: file.type as OfferingImageType, sizeBytes: file.size },
  ))!;
  await objectStorageService.uploadToSignedForm(upload, file);
  await productCatalogService.confirmImage(offeringId, imageId);
  return imageId;
}

/**
 * Deixa as imagens da oferta como a lista do assistente:
 * 1. remove as salvas que saíram da lista;
 * 2. envia as novas, uma por vez e na ordem da lista (a confirmação põe cada
 *    uma no fim);
 * 3. reordena só se a ordem final não for a que ficou no servidor.
 *
 * Falhas não interrompem: voltam como chaves de aviso (sem repetir).
 * `savedIds` são as imagens confirmadas antes, na ordem da oferta.
 */
export async function syncOfferingImages(
  offeringId: string,
  items: readonly OfferImageItem[],
  savedIds: readonly string[] = [],
): Promise<string[]> {
  const warnings = new Set<string>();
  const kept = new Set(
    items.flatMap((item) => (item.kind === "saved" ? [item.id] : [])),
  );

  // Ordem atual no servidor, acompanhada a cada passo.
  const server: string[] = [];
  for (const id of savedIds) {
    if (kept.has(id)) {
      server.push(id);
      continue;
    }
    try {
      await productCatalogService.deleteImage(offeringId, id);
    } catch {
      warnings.add(`${WARNINGS}.imagesDeleteFailed`);
      server.push(id);
    }
  }

  const desired: string[] = [];
  let stopped = false;
  for (const item of items) {
    if (item.kind === "saved") {
      desired.push(item.id);
      continue;
    }
    if (stopped) continue;
    try {
      const id = await uploadOfferingImage(offeringId, item.file);
      desired.push(id);
      server.push(id);
    } catch (error) {
      const failure = uploadFailure(error);
      warnings.add(failure.key);
      stopped = failure.stop;
    }
  }

  // A API exige todas as confirmadas no reordenamento: as que não saíram
  // (remoção falhou) vão para o fim.
  for (const id of server) if (!desired.includes(id)) desired.push(id);
  const reordered = desired.some((id, index) => id !== server[index]);
  if (desired.length && reordered) {
    try {
      await productCatalogService.reorderImages(offeringId, desired);
    } catch {
      warnings.add(`${WARNINGS}.imagesOrderFailed`);
    }
  }

  return [...warnings];
}

/** A lista do assistente mudou em relação às imagens salvas? */
export function offerImagesChanged(
  items: readonly OfferImageItem[],
  savedIds: readonly string[],
): boolean {
  return (
    items.length !== savedIds.length ||
    items.some((item, index) =>
      item.kind === "new" ? true : item.id !== savedIds[index],
    )
  );
}
