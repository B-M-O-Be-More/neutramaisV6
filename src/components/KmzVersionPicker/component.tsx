"use client";

import { Box, Button, chakra, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuUpload } from "react-icons/lu";

import { coverageVersionLabel } from "@/functions/coverageVersionLabel";
import { formatFileSize } from "@/functions/formatFileSize";
import type { CoverageVersionSummary } from "@/services/geoCoverage.service";

import { KmzVersionPickerProps } from "./interface";

/**
 * Escolha da versão de KMZ vinculada à oferta (radio group), com envio de um
 * KMZ novo. Uma versão nova não atualiza ofertas existentes.
 */
export function KmzVersionPicker({
  versions,
  isLoadingList = false,
  selectedId,
  boundId = null,
  onSelect,
  onUpload,
  isUploading,
  uploadError,
  error,
  locale,
}: KmzVersionPickerProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const title = (version: CoverageVersionSummary) => {
    if (version.fileName) return version.fileName;
    const date = new Date(version.createdAt);
    // Sem os metadados da versão, só o id.
    if (Number.isNaN(date.getTime())) return coverageVersionLabel(version);
    return t("SellerOfferCreate.kmz.unnamed", {
      date: new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
        date,
      ),
    });
  };

  const details = (version: CoverageVersionSummary) =>
    [
      version.sizeBytes !== undefined &&
        formatFileSize(version.sizeBytes, locale),
      version.regionCount !== undefined &&
        t("SellerOfferCreate.kmz.regions", { count: version.regionCount }),
      version.polygonCount !== undefined &&
        t("SellerOfferCreate.kmz.polygons", { count: version.polygonCount }),
    ]
      .filter(Boolean)
      .join(" · ");

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpa para o mesmo arquivo poder ser escolhido de novo após um erro.
    event.target.value = "";
    if (file) onUpload(file);
  };

  let list: React.ReactNode;

  if (versions.length === 0) {
    list = (
      <Text
        px="18px"
        py="14px"
        bg="#F8F9FB"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={error ? "#FECACA" : "#E5E8EE"}
        rounded="14px"
        color="#5A6478"
        fontSize="12px"
        lineHeight="18px"
      >
        {t(
          isLoadingList
            ? "SellerOfferCreate.kmz.listLoading"
            : "SellerOfferCreate.kmz.listEmpty",
        )}
      </Text>
    );
  } else {
    list = (
      <Stack
        role="radiogroup"
        aria-labelledby="kmz-version-label"
        aria-invalid={!!error}
        gap="12px"
      >
        {versions.map((version) => {
          const isSelected = version.id === selectedId;
          const info = details(version);
          return (
            <chakra.button
              key={version.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(version.id)}
              display="flex"
              alignItems="center"
              gap="12px"
              p="18px"
              textAlign="start"
              bg={isSelected ? "#F3EEFF" : "white"}
              borderWidth="2px"
              borderColor={isSelected ? "#8B5CF6" : "#E5E8EE"}
              rounded="14px"
              cursor="pointer"
              _hover={isSelected ? undefined : { borderColor: "#C4CDD8" }}
              _focusVisible={{
                outline: "2px solid #1F5AFF",
                outlineOffset: "2px",
              }}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="20px"
                flexShrink={0}
                rounded="full"
                borderWidth="2px"
                borderColor={isSelected ? "#8B5CF6" : "#C4CDD8"}
                bg={isSelected ? "#8B5CF6" : "white"}
              >
                {isSelected && <Box boxSize="8px" rounded="full" bg="white" />}
              </Flex>
              <Stack gap={0} flex="1" minW={0}>
                <Text
                  color={isSelected ? "#8B5CF6" : "#0F1729"}
                  fontSize="13px"
                  fontWeight={700}
                  lineHeight="19.5px"
                  truncate
                >
                  {title(version)}
                </Text>
                {info && (
                  <Text
                    color="#8A9AB5"
                    fontSize="11px"
                    fontWeight={500}
                    lineHeight="16.5px"
                  >
                    {info}
                  </Text>
                )}
              </Stack>
              {version.id === boundId && (
                <Text
                  as="span"
                  px="9px"
                  py="3px"
                  flexShrink={0}
                  bg="#EDFBF5"
                  borderWidth="1px"
                  borderColor="#AAECD5"
                  rounded="8px"
                  color="#10B981"
                  fontSize="9px"
                  fontWeight={700}
                  lineHeight="13.5px"
                  textTransform="uppercase"
                >
                  {t("SellerOfferCreate.kmz.bound")}
                </Text>
              )}
            </chakra.button>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack gap="12px">
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <Text
          id="kmz-version-label"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("SellerOfferCreate.kmz.label")}
        </Text>
        <Button
          variant="outline"
          h="34px"
          px="12px"
          gap="6px"
          rounded="10px"
          borderColor="#D3BFFD"
          color="#8B5CF6"
          fontSize="12px"
          fontWeight={600}
          loading={isUploading}
          loadingText={t("SellerOfferCreate.kmz.uploading")}
          onClick={() => inputRef.current?.click()}
        >
          <Icon as={LuUpload} boxSize="12px" />
          {t("SellerOfferCreate.kmz.upload")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".kmz,application/vnd.google-earth.kmz"
          hidden
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleFile}
        />
      </Flex>

      {list}

      {isUploading && (
        <Text color="#5A6478" fontSize="12px" lineHeight="18px" role="status">
          {t("SellerOfferCreate.kmz.processing")}
        </Text>
      )}

      {(uploadError || error) && (
        <Text color="#EF4444" fontSize="12px" lineHeight="18px" role="alert">
          {uploadError ?? error}
        </Text>
      )}

      <Text color="#A0ABB8" fontSize="11px" lineHeight="16.5px">
        {t("SellerOfferCreate.kmz.hint")}
      </Text>
    </Stack>
  );
}
