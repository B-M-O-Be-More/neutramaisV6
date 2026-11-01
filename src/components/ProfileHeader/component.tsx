"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCamera, LuPencil } from "react-icons/lu";

import { nameInitials } from "@/functions/profile";

import { ProfileHeaderProps } from "./interface";

const COVER = "linear-gradient(90deg, #1F5AFF 0%, #4B7FFF 50%, #8B5CF6 100%)";
const AVATAR = "linear-gradient(135deg, #1F5AFF 0%, #6B9FFF 100%)";

/**
 * Cabeçalho do Meu Perfil (Figma 2205-19800): capa em degradê, avatar com as
 * iniciais e a câmera, nome, cargo · organização, biografia e "Editar perfil".
 */
export function ProfileHeader({
  name,
  subtitle,
  bio,
  onEdit,
  onPhotoSelect,
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <Box
      position="relative"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      rounded="16px"
      overflow="hidden"
    >
      <Box h="112px" bgImage={COVER} />

      <Box position="absolute" top="64px" left={{ base: "20px", md: "32px" }}>
        <Flex
          align="center"
          justify="center"
          boxSize="96px"
          bgImage={AVATAR}
          borderWidth="4px"
          borderColor="white"
          rounded="16px"
          boxShadow="0 10px 8px rgba(0,0,0,0.1), 0 4px 3px rgba(0,0,0,0.1)"
          color="white"
          fontSize="30px"
          fontWeight={800}
          lineHeight="45px"
          aria-hidden
        >
          {nameInitials(name)}
        </Flex>
        <IconButton
          position="absolute"
          top="64px"
          left="64px"
          boxSize="32px"
          minW="32px"
          bg="white"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="14px"
          color="#5A6478"
          boxShadow="0 1px 1.5px rgba(0,0,0,0.1), 0 1px 1px rgba(0,0,0,0.1)"
          aria-label={t("Profile.header.photo")}
          onClick={() => fileRef.current?.click()}
        >
          <Icon as={LuCamera} boxSize="14px" />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onPhotoSelect(file);
          }}
        />
      </Box>

      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "flex-end" }}
        justify="space-between"
        gap="16px"
        pt="64px"
        pb="24px"
        px={{ base: "20px", md: "32px" }}
      >
        <Stack gap="0" minW={0}>
          <Text
            as="h1"
            color="#0F1729"
            fontSize="22px"
            fontWeight={800}
            lineHeight="33px"
          >
            {name}
          </Text>
          {subtitle && (
            <Text color="#8A9AB5" fontSize="14px" lineHeight="21px">
              {subtitle}
            </Text>
          )}
          {bio && (
            <Text pt="8px" color="#5A6478" fontSize="13px" lineHeight="19.5px">
              {bio}
            </Text>
          )}
        </Stack>
        {onEdit && (
          <Button
            variant="outline"
            flexShrink={0}
            h="36px"
            px="16px"
            gap="6px"
            borderColor="#E5E8EE"
            rounded="14px"
            color="#0F1729"
            fontSize="13px"
            fontWeight={600}
            onClick={onEdit}
          >
            <Icon as={LuPencil} boxSize="13px" />
            {t("Profile.header.edit")}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
