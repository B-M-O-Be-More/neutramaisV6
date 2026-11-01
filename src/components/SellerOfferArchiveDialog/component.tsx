"use client";

import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { SellerOfferArchiveDialogProps } from "./interface";

/**
 * Confirmação antes de arquivar uma oferta: o arquivamento é terminal — a
 * oferta sai do marketplace e não pode mais ser editada nem republicada.
 */
export function SellerOfferArchiveDialog({
  offeringName,
  isPending,
  onConfirm,
  onClose,
}: SellerOfferArchiveDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      role="alertdialog"
      open={offeringName !== null}
      onOpenChange={(details) => {
        if (!details.open && !isPending) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="440px" w="calc(100% - 32px)" rounded="14px">
            <Dialog.Header>
              <Dialog.Title fontSize="15px" fontWeight={700} color="#0F1729">
                {t("SellerOffers.archive.title")}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text color="#5A6478" fontSize="13px" lineHeight="20px">
                {t("SellerOffers.archive.description", {
                  name: offeringName ?? "",
                })}
              </Text>
            </Dialog.Body>

            <Dialog.Footer gap="8px">
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  h="36px"
                  rounded="10px"
                  borderColor="#E5E8EE"
                  color="#5A6478"
                  fontSize="13px"
                  disabled={isPending}
                >
                  {t("SellerOffers.archive.cancel")}
                </Button>
              </Dialog.ActionTrigger>
              <Button
                h="36px"
                rounded="10px"
                bg="#EF4444"
                color="white"
                fontSize="13px"
                fontWeight={600}
                loading={isPending}
                onClick={onConfirm}
              >
                {t("SellerOffers.archive.confirm")}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild disabled={isPending}>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
