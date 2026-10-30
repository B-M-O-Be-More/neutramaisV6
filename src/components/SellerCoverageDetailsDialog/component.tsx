"use client";

import {
  Box,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import CoverageMap from "@/components/CoverageMap";
import { coverageVersionLabel } from "@/functions/coverageVersionLabel";
import { formatDateTime } from "@/functions/formatDateTime";
import { formatFileSize } from "@/functions/formatFileSize";

import { SellerCoverageDetailsDialogProps } from "./interface";

/**
 * Detalhes de uma cobertura: mapa da área e os dados da versão. O mapa usa a
 * geometria lida do KMZ (no envio ou do original baixado) — a geo-api não a
 * devolve.
 */
export function SellerCoverageDetailsDialog({
  version,
  geometry,
  isLoadingMap = false,
  mapError = null,
  offerCount,
  locale,
  onClose,
}: SellerCoverageDetailsDialogProps) {
  const { t } = useTranslation();

  const rows = version
    ? [
        {
          key: "offers",
          value:
            offerCount === null
              ? undefined
              : t("SellerCoverage.list.offers", { count: offerCount }),
        },
        {
          key: "size",
          value:
            version.sizeBytes !== undefined
              ? formatFileSize(version.sizeBytes, locale)
              : undefined,
        },
        {
          key: "polygons",
          value:
            version.polygonCount !== undefined
              ? String(version.polygonCount)
              : undefined,
        },
        {
          key: "createdAt",
          value: version.createdAt
            ? formatDateTime(version.createdAt, locale)
            : undefined,
        },
        { key: "version", value: version.id },
        { key: "sha", value: version.sourceSha256.slice(0, 16) || undefined },
      ].filter((row): row is { key: string; value: string } => !!row.value)
    : [];

  return (
    <Dialog.Root
      open={version !== null}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="640px"
            w="calc(100% - 32px)"
            rounded="16px"
            boxShadow="0 16px 48px rgba(15,23,41,0.12)"
          >
            <Dialog.Header
              pe="56px"
              borderBottomWidth="1px"
              borderColor="#E5E8EE"
            >
              <Dialog.Title
                color="#0F1729"
                fontSize="18px"
                fontWeight={700}
                lineHeight="27px"
              >
                {version ? coverageVersionLabel(version) : ""}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body py="20px">
              <Stack gap="16px">
                <Box rounded="12px" overflow="hidden">
                  <CoverageMap
                    geometry={geometry}
                    height="300px"
                    label={t("SellerCoverage.details.map")}
                    isLoading={!geometry && isLoadingMap}
                  />
                </Box>
                {!geometry && !isLoadingMap && (
                  <Text
                    role="status"
                    color="#A0ABB8"
                    fontSize="11px"
                    lineHeight="16.5px"
                  >
                    {t(
                      mapError ??
                        "SellerOfferCreate.coverage.previewUnavailable",
                    )}
                  </Text>
                )}
                <Stack
                  as="dl"
                  gap={0}
                  bg="#F8F9FB"
                  borderWidth="1px"
                  borderColor="#E5E8EE"
                  rounded="14px"
                  overflow="hidden"
                >
                  {rows.map((row, index) => (
                    <Flex
                      key={row.key}
                      justify="space-between"
                      gap="16px"
                      px="16px"
                      py="12px"
                      borderBottomWidth={index < rows.length - 1 ? "1px" : 0}
                      borderColor="#F4F6F9"
                    >
                      <Text
                        as="dt"
                        color="#8A9AB5"
                        fontSize="12px"
                        lineHeight="18px"
                        flexShrink={0}
                      >
                        {t(`SellerCoverage.details.fields.${row.key}`)}
                      </Text>
                      <Text
                        as="dd"
                        color="#0F1729"
                        fontSize="12px"
                        fontWeight={600}
                        lineHeight="18px"
                        textAlign="right"
                        wordBreak="break-word"
                        minW={0}
                      >
                        {row.value}
                      </Text>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </Dialog.Body>

            <Dialog.CloseTrigger asChild top="16px" insetEnd="16px">
              <CloseButton
                size="sm"
                aria-label={t("SellerCoverage.details.close")}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
