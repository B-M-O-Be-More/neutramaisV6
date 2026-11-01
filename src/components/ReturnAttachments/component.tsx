"use client";

import { Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { LuCamera, LuFileText } from "react-icons/lu";

import type { ReturnAttachmentKind } from "@/types/returns";

import { ReturnAttachmentsProps } from "./interface";

// Foto e vídeo usam a câmera; documentos, a folha (Figma 2943-31559).
const KIND_ICONS: Record<ReturnAttachmentKind, IconType> = {
  image: LuCamera,
  video: LuCamera,
  document: LuFileText,
};

/** "Fotos e comprovações" enviadas com a solicitação (Figma 2943-31555). */
export function ReturnAttachments({ attachments }: ReturnAttachmentsProps) {
  const { t } = useTranslation();

  return (
    <Stack
      as="section"
      gap="12px"
      p="20px"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="12px"
    >
      <Text
        as="h2"
        color="#0F1729"
        fontSize="13px"
        fontWeight={700}
        lineHeight="19.5px"
      >
        {t("Returns.detail.attachments")}
      </Text>
      {attachments.length === 0 ? (
        <Text color="#8A9AB5" fontSize="12px" lineHeight="18px">
          {t("Returns.detail.noAttachments")}
        </Text>
      ) : (
        <SimpleGrid as="ul" columns={{ base: 2, md: 3 }} gap="12px">
          {attachments.map((attachment) => (
            <Stack
              as="li"
              key={attachment.id}
              gap="8px"
              p="16px"
              bg="#F8F9FB"
              borderWidth="1px"
              borderColor="#E5E8EE"
              rounded="12px"
              minW={0}
              listStyleType="none"
            >
              <Flex
                h="80px"
                align="center"
                justify="center"
                bg="white"
                rounded="8px"
              >
                <Icon
                  as={KIND_ICONS[attachment.kind]}
                  boxSize="24px"
                  color="#8A9AB5"
                  aria-hidden
                />
              </Flex>
              <Text
                truncate
                color="#5A6478"
                fontSize="10px"
                fontWeight={600}
                lineHeight="15px"
                title={attachment.name}
              >
                {attachment.name}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
