"use client";

import {
  Box,
  Button,
  chakra,
  Flex,
  Icon,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuImage, LuRefreshCw, LuTrash2 } from "react-icons/lu";

import { useObjectUrl } from "@/hooks/useObjectUrl";
import { OFFER_IMAGE_TYPES } from "@/schemas/sellerOffer";

import { OfferImagePickerProps } from "./interface";

/**
 * Imagem da oferta: área clicável para escolher JPG/PNG e, depois de
 * escolhida, a prévia com as ações de trocar e remover. Tipo e tamanho são
 * validados pelo schema do formulário.
 */
export function OfferImagePicker({
  value,
  onChange,
  error,
}: OfferImagePickerProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewUrl = useObjectUrl(value);

  const openPicker = () => inputRef.current?.click();

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Limpa para o mesmo arquivo poder ser escolhido de novo.
    event.target.value = "";
    if (file) onChange(file);
  };

  return (
    <Stack gap="8px">
      <Text
        id="offer-image-label"
        color="#0F1729"
        fontSize="14px"
        fontWeight={700}
        lineHeight="21px"
      >
        {t("SellerOfferCreate.basicInfo.imageLabel")}
      </Text>

      {value && previewUrl ? (
        <Box
          position="relative"
          h="144px"
          rounded="14px"
          overflow="hidden"
          borderWidth="1px"
          borderColor={error ? "#FECACA" : "#E5E8EE"}
          bg="#F8F9FB"
        >
          <Image
            src={previewUrl}
            alt={t("SellerOfferCreate.basicInfo.imageAlt", {
              name: value.name,
            })}
            w="full"
            h="full"
            objectFit="cover"
          />
          <Flex position="absolute" top="10px" right="10px" gap="6px">
            <Button
              type="button"
              size="xs"
              h="30px"
              px="10px"
              gap="6px"
              rounded="10px"
              bg="white"
              color="#5A6478"
              fontSize="12px"
              fontWeight={600}
              boxShadow="0px 1px 2px rgba(0,0,0,0.1)"
              onClick={openPicker}
            >
              <Icon as={LuRefreshCw} boxSize="12px" />
              {t("SellerOfferCreate.basicInfo.imageReplace")}
            </Button>
            <Button
              type="button"
              size="xs"
              h="30px"
              px="10px"
              gap="6px"
              rounded="10px"
              bg="white"
              color="#EF4444"
              fontSize="12px"
              fontWeight={600}
              boxShadow="0px 1px 2px rgba(0,0,0,0.1)"
              onClick={() => onChange(null)}
            >
              <Icon as={LuTrash2} boxSize="12px" />
              {t("SellerOfferCreate.basicInfo.imageRemove")}
            </Button>
          </Flex>
        </Box>
      ) : (
        <chakra.button
          type="button"
          aria-labelledby="offer-image-label"
          aria-describedby="offer-image-hint"
          onClick={openPicker}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="8px"
          h="144px"
          p="2px"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor={error ? "#FECACA" : "#C4CDD8"}
          rounded="14px"
          cursor="pointer"
          transition="border-color 0.15s, background 0.15s"
          _hover={{ borderColor: "#8B5CF6", bg: "#FAF8FF" }}
          _focusVisible={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
        >
          <Icon as={LuImage} boxSize="24px" color="#C4CDD8" />
          <Text color="#8A9AB5" fontSize="13px" lineHeight="19.5px">
            {t("SellerOfferCreate.basicInfo.imageCta")}
          </Text>
          <Text
            id="offer-image-hint"
            color="#A0ABB8"
            fontSize="11px"
            lineHeight="16.5px"
          >
            {t("SellerOfferCreate.basicInfo.imageHint")}
          </Text>
        </chakra.button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={OFFER_IMAGE_TYPES.join(",")}
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFile}
      />

      {error && (
        <Text color="#EF4444" fontSize="12px" lineHeight="18px" role="alert">
          {error}
        </Text>
      )}
    </Stack>
  );
}
