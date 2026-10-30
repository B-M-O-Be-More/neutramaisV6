"use client";

import {
  Box,
  chakra,
  Flex,
  Grid,
  Icon,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LuChevronLeft,
  LuChevronRight,
  LuImage,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";

import { useObjectUrl } from "@/hooks/useObjectUrl";
import {
  OFFER_IMAGE_TYPES,
  OFFER_IMAGES_MAX,
  type OfferImageItem,
} from "@/schemas/sellerOffer";

import { OfferImagePickerProps } from "./interface";

// Chave estável para arquivos novos (não têm id até serem enviados).
const fileKeys = new WeakMap<File, string>();
let nextFileKey = 0;
function itemKey(item: OfferImageItem): string {
  if (item.kind === "saved") return item.id;
  let key = fileKeys.get(item.file);
  if (!key) {
    key = `new-${(nextFileKey += 1)}`;
    fileKeys.set(item.file, key);
  }
  return key;
}

const ACTION_STYLES = {
  size: "2xs",
  minW: "24px",
  h: "24px",
  rounded: "8px",
  bg: "white",
  color: "#5A6478",
  boxShadow: "0px 1px 2px rgba(0,0,0,0.1)",
  _disabled: { opacity: 0.4, cursor: "not-allowed" },
} as const;

function Thumbnail({ item, alt }: { item: OfferImageItem; alt: string }) {
  const objectUrl = useObjectUrl(item.kind === "new" ? item.file : null);
  const src = item.kind === "new" ? objectUrl : item.url;

  return src ? (
    <Image src={src} alt={alt} w="full" h="full" objectFit="cover" />
  ) : (
    // URL assinada indisponível: a imagem existe, só não dá para mostrar.
    <Flex w="full" h="full" align="center" justify="center" aria-label={alt}>
      <Icon as={LuImage} boxSize="20px" color="#C4CDD8" />
    </Flex>
  );
}

/**
 * Fotos da oferta (até 10): escolha de JPG/PNG/WEBP, miniaturas com a capa
 * marcada e as ações de mover e remover. Só edita a lista — quem envia é a
 * área de fotos (`SellerOfferImagesSection`).
 */
export function OfferImagePicker({
  value,
  onChange,
  itemErrors = [],
  disabled = false,
}: OfferImagePickerProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Arquivos que não couberam no limite da última escolha.
  const [skipped, setSkipped] = React.useState(0);
  const remaining = OFFER_IMAGES_MAX - value.length;

  const openPicker = () => inputRef.current?.click();

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Limpa para os mesmos arquivos poderem ser escolhidos de novo.
    event.target.value = "";
    if (!files.length) return;
    const accepted = files.slice(0, Math.max(remaining, 0));
    setSkipped(files.length - accepted.length);
    onChange([
      ...value,
      ...accepted.map((file) => ({ kind: "new" as const, file })),
    ]);
  };

  const move = (index: number, offset: -1 | 1) => {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };

  const remove = (index: number) => {
    setSkipped(0);
    onChange(value.filter((_, position) => position !== index));
  };

  const altFor = (item: OfferImageItem, index: number) =>
    item.kind === "new"
      ? t("SellerOfferCreate.basicInfo.imageAlt", { name: item.file.name })
      : t("SellerOfferCreate.basicInfo.imageSavedAlt", { index: index + 1 });

  return (
    <Stack gap="8px">
      <Flex align="baseline" justify="space-between" gap="12px">
        <Text
          id="offer-image-label"
          color="#0F1729"
          fontSize="14px"
          fontWeight={700}
          lineHeight="21px"
        >
          {t("SellerOfferCreate.basicInfo.imageLabel")}
        </Text>
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("SellerOfferCreate.basicInfo.imageCounter", {
            count: value.length,
            max: OFFER_IMAGES_MAX,
          })}
        </Text>
      </Flex>

      {value.length ? (
        <Grid
          role="list"
          aria-labelledby="offer-image-label"
          templateColumns="repeat(auto-fill, minmax(120px, 1fr))"
          gap="10px"
        >
          {value.map((item, index) => (
            <Box
              key={itemKey(item)}
              role="listitem"
              position="relative"
              h="96px"
              rounded="12px"
              overflow="hidden"
              borderWidth="1px"
              borderColor={itemErrors[index] ? "#FECACA" : "#E5E8EE"}
              bg="#F8F9FB"
            >
              <Thumbnail item={item} alt={altFor(item, index)} />
              {index === 0 && (
                <Text
                  position="absolute"
                  top="6px"
                  left="6px"
                  px="7px"
                  py="2px"
                  bg="#8B5CF6"
                  color="white"
                  fontSize="10px"
                  fontWeight={700}
                  lineHeight="15px"
                  rounded="6px"
                >
                  {t("SellerOfferCreate.basicInfo.imageCover")}
                </Text>
              )}
              <Flex position="absolute" bottom="6px" right="6px" gap="4px">
                <IconButton
                  type="button"
                  aria-label={t("SellerOfferCreate.basicInfo.imageMoveLeft", {
                    index: index + 1,
                  })}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  {...ACTION_STYLES}
                >
                  <Icon as={LuChevronLeft} boxSize="12px" />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label={t("SellerOfferCreate.basicInfo.imageMoveRight", {
                    index: index + 1,
                  })}
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                  {...ACTION_STYLES}
                >
                  <Icon as={LuChevronRight} boxSize="12px" />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label={t("SellerOfferCreate.basicInfo.imageRemove", {
                    index: index + 1,
                  })}
                  disabled={disabled}
                  onClick={() => remove(index)}
                  {...ACTION_STYLES}
                  color="#EF4444"
                >
                  <Icon as={LuTrash2} boxSize="12px" />
                </IconButton>
              </Flex>
            </Box>
          ))}

          {remaining > 0 && (
            <chakra.button
              type="button"
              aria-describedby="offer-image-hint"
              disabled={disabled}
              onClick={openPicker}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="4px"
              h="96px"
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="#C4CDD8"
              rounded="12px"
              color="#8A9AB5"
              fontSize="12px"
              fontWeight={600}
              cursor="pointer"
              transition="border-color 0.15s, background 0.15s"
              _hover={{ borderColor: "#8B5CF6", bg: "#FAF8FF" }}
              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
              _focusVisible={{
                outline: "2px solid #1F5AFF",
                outlineOffset: "2px",
              }}
            >
              <Icon as={LuPlus} boxSize="18px" />
              {t("SellerOfferCreate.basicInfo.imageAdd")}
            </chakra.button>
          )}
        </Grid>
      ) : (
        <chakra.button
          type="button"
          aria-labelledby="offer-image-label"
          aria-describedby="offer-image-hint"
          disabled={disabled}
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
          borderColor="#C4CDD8"
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
        </chakra.button>
      )}

      <Text
        id="offer-image-hint"
        color="#A0ABB8"
        fontSize="11px"
        lineHeight="16.5px"
      >
        {t("SellerOfferCreate.basicInfo.imageHint", { max: OFFER_IMAGES_MAX })}
      </Text>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={OFFER_IMAGE_TYPES.join(",")}
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFiles}
      />

      {skipped > 0 && (
        <Text color="#D97706" fontSize="12px" lineHeight="18px" role="status">
          {t("SellerOfferCreate.basicInfo.imageSkipped", {
            count: skipped,
            max: OFFER_IMAGES_MAX,
          })}
        </Text>
      )}

      {itemErrors.map((message, index) =>
        message ? (
          <Text
            key={index}
            color="#EF4444"
            fontSize="12px"
            lineHeight="18px"
            role="alert"
          >
            {t("SellerOfferCreate.basicInfo.imageError", {
              index: index + 1,
              message,
            })}
          </Text>
        ) : null,
      )}
    </Stack>
  );
}
