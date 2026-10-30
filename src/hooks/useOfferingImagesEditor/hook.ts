"use client";

import React from "react";

import {
  offerImagesChanged,
  syncOfferingImages,
} from "@/functions/syncOfferingImages";
import { offerImageErrorKey, type OfferImageItem } from "@/schemas/sellerOffer";
import {
  productCatalogService,
  type OfferingImage,
} from "@/services/productCatalog.service";

import type {
  OfferingImagesNotice,
  UseOfferingImagesEditorReturn,
} from "./interface";

const toItems = (images: readonly OfferingImage[]): OfferImageItem[] =>
  images.map((image) => ({ kind: "saved", id: image.id, url: image.url }));

const savedIdsOf = (images: readonly OfferingImage[]) =>
  images.map((image) => image.id);

/**
 * Área de fotos de uma oferta já criada. As fotos não seguem o "Salvar
 * alterações": o botão "Confirmar fotos" aplica a lista na hora
 * (`syncOfferingImages`) e recarrega as confirmadas, com os ids e URLs do
 * servidor. `images` são as confirmadas, na ordem da oferta.
 */
export function useOfferingImagesEditor(
  offeringId: string,
  images: readonly OfferingImage[],
): UseOfferingImagesEditorReturn {
  const [items, setItemsState] = React.useState(() => toItems(images));
  const [savedIds, setSavedIds] = React.useState(() => savedIdsOf(images));
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [notice, setNotice] = React.useState<OfferingImagesNotice | null>(null);
  // Sem a lista recarregada, não se sabe o que está salvo: novo envio poderia
  // duplicar fotos. Fica bloqueado até recarregar a página.
  const [isStale, setIsStale] = React.useState(false);

  const itemErrors = items.map(offerImageErrorKey);
  const isDirty = offerImagesChanged(items, savedIds);
  const canConfirm =
    isDirty && !isConfirming && !isStale && !itemErrors.some(Boolean);

  const setItems = React.useCallback((next: OfferImageItem[]) => {
    setItemsState(next);
    setNotice(null);
  }, []);

  const confirm = async () => {
    if (!canConfirm) return;
    setIsConfirming(true);
    setNotice(null);
    try {
      const warnings = await syncOfferingImages(offeringId, items, savedIds);
      try {
        const current = (
          (await productCatalogService.listImages(offeringId)) ?? []
        )
          .filter((image) => image.status === "ready")
          .sort((a, b) => a.position - b.position);
        setItemsState(toItems(current));
        setSavedIds(savedIdsOf(current));
      } catch {
        setIsStale(true);
        warnings.push("SellerOfferImages.errors.reloadFailed");
      }
      setNotice(
        warnings.length
          ? { tone: "warning", messages: warnings }
          : { tone: "success", messages: ["SellerOfferImages.confirmed"] },
      );
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    items,
    setItems,
    itemErrors,
    isDirty,
    isConfirming,
    canConfirm,
    notice,
    confirm,
  };
}
