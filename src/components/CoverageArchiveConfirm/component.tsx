"use client";

import {
  Button,
  Flex,
  IconButton,
  NativeSelect,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuTrash2 } from "react-icons/lu";

import { useCoverageReplacements } from "@/hooks/useCoverageReplacements";

import { CoverageArchiveConfirmProps } from "./interface";

/**
 * Lixeira do KMZ atual e a confirmação "Excluir kmz" (Figma 3009-73771).
 * Excluir arquiva o arquivo na geo-api (o histórico fica retido). Com ofertas
 * vinculadas, a geo-api exige outro arquivo ativo para recebê-las.
 */
export function CoverageArchiveConfirm({
  organizationId,
  fileId,
  label,
  linkedOfferCount,
  isPending = false,
  disabled = false,
  onConfirm,
}: CoverageArchiveConfirmProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [replacementId, setReplacementId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const hasOffers = linkedOfferCount > 0;
  const replacements = useCoverageReplacements(
    organizationId,
    fileId,
    open && hasOffers,
  );
  const selectId = React.useId();

  const noReplacement =
    hasOffers && !replacements.isLoading && !replacements.options.length;
  const canConfirm = !isPending && (!hasOffers || !!replacementId);

  const close = () => {
    setOpen(false);
    setError(null);
    setReplacementId("");
  };

  const handleConfirm = async () => {
    setError(null);
    const failure = await onConfirm(hasOffers ? replacementId : undefined);
    if (failure) setError(failure);
    else close();
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => (details.open ? setOpen(true) : close())}
      positioning={{ placement: "bottom-end" }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <IconButton
          variant="plain"
          size="xs"
          minW="24px"
          h="24px"
          color="#8A9AB5"
          disabled={disabled}
          aria-label={t("SellerCoverage.detail.history.archive", {
            name: label,
          })}
          _hover={{ color: "#EF4444" }}
        >
          <LuTrash2 />
        </IconButton>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="392px"
            maxW="calc(100vw - 32px)"
            bg="white"
            borderWidth="1px"
            borderColor="#E5E8EE"
            rounded="14px"
            overflow="hidden"
            boxShadow="0 16px 48px rgba(15,23,41,0.12)"
          >
            <Flex
              px="16px"
              py="12px"
              borderBottomWidth="1px"
              borderColor="#F4F6F9"
            >
              <Popover.Title
                color="#0F1729"
                fontSize="12px"
                fontWeight={700}
                lineHeight="18px"
              >
                {t(
                  hasOffers
                    ? "SellerCoverage.detail.archive.titleWithOffers"
                    : "SellerCoverage.detail.archive.title",
                )}
              </Popover.Title>
            </Flex>
            <Stack gap="8px" p="16px">
              <Text
                color="#EF4444"
                fontSize="12px"
                fontWeight={700}
                lineHeight="18px"
              >
                {t("SellerCoverage.detail.archive.question")}
              </Text>
              <Popover.Description
                color="#991B1B"
                fontSize="11px"
                lineHeight="16.5px"
              >
                {hasOffers
                  ? t("SellerCoverage.detail.archive.linkedOffers", {
                      count: linkedOfferCount,
                    })
                  : t("SellerCoverage.detail.archive.noOffers")}
              </Popover.Description>

              {hasOffers && (
                <Stack gap="4px">
                  <Text
                    asChild
                    color="#5A6478"
                    fontSize="11px"
                    fontWeight={600}
                    lineHeight="16.5px"
                  >
                    <label htmlFor={selectId}>
                      {t("SellerCoverage.detail.archive.replacement")}
                    </label>
                  </Text>
                  <NativeSelect.Root
                    size="sm"
                    disabled={replacements.isLoading || noReplacement}
                  >
                    <NativeSelect.Field
                      id={selectId}
                      value={replacementId}
                      onChange={(event) => setReplacementId(event.target.value)}
                      h="36px"
                      bg="white"
                      borderWidth="1px"
                      borderColor="#E5E8EE"
                      rounded="10px"
                      fontSize="12px"
                    >
                      <option value="">
                        {t(
                          replacements.isLoading
                            ? "SellerCoverage.detail.archive.replacementsLoading"
                            : "SellerCoverage.detail.archive.replacementPlaceholder",
                        )}
                      </option>
                      {replacements.options.map((option) => (
                        <option key={option.fileId} value={option.fileId}>
                          {option.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator>
                      <LuChevronDown color="#98A6B3" />
                    </NativeSelect.Indicator>
                  </NativeSelect.Root>
                  {(noReplacement || replacements.error) && (
                    <Text color="#B91C1C" fontSize="11px" lineHeight="16.5px">
                      {t(
                        replacements.error ??
                          "SellerCoverage.detail.archive.noReplacement",
                      )}
                    </Text>
                  )}
                </Stack>
              )}

              {error && (
                <Text
                  role="alert"
                  color="#B91C1C"
                  fontSize="11px"
                  lineHeight="16.5px"
                >
                  {t(error)}
                </Text>
              )}

              <Flex gap="8px" pt="4px">
                <Button
                  variant="outline"
                  flex="1"
                  h="36px"
                  rounded="10px"
                  borderColor="#E5E8EE"
                  color="#5A6478"
                  fontSize="12px"
                  fontWeight={500}
                  disabled={isPending}
                  onClick={close}
                >
                  {t("SellerCoverage.detail.archive.cancel")}
                </Button>
                <Button
                  flex="1"
                  h="36px"
                  rounded="10px"
                  bg="#EF4444"
                  color="white"
                  fontSize="12px"
                  fontWeight={700}
                  disabled={!canConfirm}
                  loading={isPending}
                  _hover={{ bg: "#DC2626" }}
                  onClick={handleConfirm}
                >
                  {t("SellerCoverage.detail.archive.confirm")}
                </Button>
              </Flex>
            </Stack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
