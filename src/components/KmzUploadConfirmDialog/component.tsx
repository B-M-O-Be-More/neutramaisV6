"use client";

import {
  Button,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { KmzUploadConfirmDialogProps } from "./interface";

/**
 * Confirmação antes de enviar um KMZ (`/kmz/preview`): tamanho do arquivo,
 * espaço que a importação vai ocupar e o saldo da cota antes e depois.
 * Sem espaço, o envio fica travado e o diálogo diz quanto falta. A prévia
 * não reserva espaço: a cota pode mudar até o envio.
 */
export function KmzUploadConfirmDialog({
  pending,
  isUploading,
  locale,
  onConfirm,
  onClose,
}: KmzUploadConfirmDialogProps) {
  const { t } = useTranslation();
  const preview = pending?.preview;
  const mb = (value: number | undefined) =>
    t("SellerOfferCreate.kmz.confirm.mb", {
      value: new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
      }).format(value ?? 0),
    });

  const rows = preview
    ? [
        { key: "fileSize", value: mb(preview.fileSizeMb) },
        { key: "required", value: mb(preview.requiredMb) },
        {
          key: "usage",
          value: t("SellerOfferCreate.kmz.confirm.usageValue", {
            used: mb(preview.currentUsageMb),
            quota: mb(preview.quotaMb),
          }),
        },
        { key: "availableAfter", value: mb(preview.availableAfterUploadMb) },
      ]
    : [];

  return (
    <Dialog.Root
      open={pending !== null}
      onOpenChange={(details) => {
        if (!details.open && !isUploading) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="440px" w="calc(100% - 32px)" rounded="14px">
            <Dialog.Header>
              <Dialog.Title fontSize="15px" fontWeight={700} color="#0F1729">
                {t("SellerOfferCreate.kmz.confirm.title")}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="14px">
                <Text
                  color="#5A6478"
                  fontSize="13px"
                  lineHeight="20px"
                  wordBreak="break-all"
                >
                  {pending?.file.name}
                </Text>

                <Stack as="dl" gap="8px" m={0}>
                  {rows.map((row) => (
                    <Flex key={row.key} justify="space-between" gap="12px">
                      <Text as="dt" color="#8A9AB5" fontSize="13px">
                        {t(`SellerOfferCreate.kmz.confirm.${row.key}`)}
                      </Text>
                      <Text
                        as="dd"
                        m={0}
                        color="#0F1729"
                        fontSize="13px"
                        fontWeight={600}
                        textAlign="end"
                        fontVariantNumeric="tabular-nums"
                      >
                        {row.value}
                      </Text>
                    </Flex>
                  ))}
                </Stack>

                {preview?.alreadyImported && (
                  <Text color="#5A6478" fontSize="12px" lineHeight="18px">
                    {t("SellerOfferCreate.kmz.confirm.alreadyImported")}
                  </Text>
                )}
                {preview && !preview.canUpload ? (
                  <Text
                    role="alert"
                    color="#EF4444"
                    fontSize="12px"
                    lineHeight="18px"
                  >
                    {t("SellerOfferCreate.kmz.confirm.shortfall", {
                      value: mb(preview.shortfallMb),
                    })}
                  </Text>
                ) : (
                  <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
                    {t("SellerOfferCreate.kmz.confirm.notReserved")}
                  </Text>
                )}
              </Stack>
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
                  disabled={isUploading}
                >
                  {t("SellerOfferCreate.kmz.confirm.cancel")}
                </Button>
              </Dialog.ActionTrigger>
              <Button
                h="36px"
                rounded="10px"
                bg="#1F5AFF"
                color="white"
                fontSize="13px"
                fontWeight={600}
                disabled={!preview?.canUpload}
                loading={isUploading}
                loadingText={t("SellerOfferCreate.kmz.uploading")}
                onClick={onConfirm}
                _hover={{ bg: "#1646CC" }}
              >
                {t("SellerOfferCreate.kmz.confirm.submit")}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild disabled={isUploading}>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
