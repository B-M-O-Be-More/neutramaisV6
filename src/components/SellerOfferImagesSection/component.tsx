"use client";

import { Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCircleAlert, LuCircleCheck, LuUpload } from "react-icons/lu";

import OfferImagePicker from "@/components/OfferImagePicker";

import { SellerOfferImagesSectionProps } from "./interface";

const NOTICE_STYLES = {
  success: { bg: "#EDFBF5", border: "#A7F3D0", color: "#047857" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", color: "#92400E" },
  error: { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C" },
} as const;

/**
 * Área de fotos da oferta já criada: escolha, ordem e remoção, com o botão
 * próprio "Confirmar fotos", que envia na hora. "Salvar alterações" não leva
 * as fotos.
 */
export function SellerOfferImagesSection({
  editor,
}: SellerOfferImagesSectionProps) {
  const { t } = useTranslation();
  const { notice, isDirty, isConfirming, canConfirm } = editor;
  const noticeStyle = notice ? NOTICE_STYLES[notice.tone] : null;

  return (
    <Stack
      as="section"
      aria-labelledby="offer-images-title"
      gap="14px"
      p="17px"
      bg="#FCFBFF"
      borderWidth="1px"
      borderColor="#E9E3FD"
      rounded="14px"
    >
      <Stack gap="2px">
        <Text
          id="offer-images-title"
          as="h3"
          color="#0F1729"
          fontSize="15px"
          fontWeight={700}
          lineHeight="22px"
        >
          {t("SellerOfferImages.title")}
        </Text>
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("SellerOfferImages.subtitle")}
        </Text>
      </Stack>

      <OfferImagePicker
        value={editor.items}
        onChange={editor.setItems}
        itemErrors={editor.itemErrors.map((key) => (key ? t(key) : undefined))}
        disabled={isConfirming}
      />

      {notice && noticeStyle && (
        <Stack
          gap="4px"
          px="14px"
          py="11px"
          bg={noticeStyle.bg}
          borderWidth="1px"
          borderColor={noticeStyle.border}
          rounded="12px"
          role={notice.tone === "success" ? "status" : "alert"}
        >
          {notice.messages.map((key) => (
            <Flex key={key} align="flex-start" gap="8px">
              <Icon
                as={notice.tone === "success" ? LuCircleCheck : LuCircleAlert}
                boxSize="13px"
                color={noticeStyle.color}
                mt="2px"
                flexShrink={0}
              />
              <Text color={noticeStyle.color} fontSize="12px" lineHeight="18px">
                {t(key)}
              </Text>
            </Flex>
          ))}
        </Stack>
      )}

      <Flex
        align={{ base: "stretch", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        gap="12px"
      >
        <Text
          color={isDirty ? "#D97706" : "#8A9AB5"}
          fontSize="12px"
          lineHeight="18px"
        >
          {isDirty
            ? t("SellerOfferImages.pending")
            : t("SellerOfferImages.upToDate")}
        </Text>
        <Button
          type="button"
          loading={isConfirming}
          loadingText={t("SellerOfferImages.confirming")}
          disabled={!canConfirm}
          onClick={() => void editor.confirm()}
          h="40px"
          px="18px"
          gap="8px"
          rounded="12px"
          bg="#8B5CF6"
          color="white"
          fontSize="13px"
          fontWeight={700}
          flexShrink={0}
          _hover={{ bg: "#7C4DEB" }}
          _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          <Icon as={LuUpload} boxSize="14px" />
          {t("SellerOfferImages.confirm")}
        </Button>
      </Flex>
    </Stack>
  );
}
