"use client";

import {
  Box,
  Button,
  Flex,
  Icon,
  Image,
  Input,
  InputGroup,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LuChevronDown, LuGlobe, LuSearch } from "react-icons/lu";

import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/contexts/LanguageContext/interface";

// Rótulo curto de cada idioma exibido no seletor compacto do cabeçalho.
const LANGUAGE_LABELS: Record<Language, string> = {
  pt: "PT-BR",
  en: "EN",
  es: "ES",
};

/**
 * Cabeçalho do marketplace público (home sem autenticação).
 * Reúne a marca, a busca rápida, o seletor de idioma e as ações de conta.
 */
export function MarketplaceHeader() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <Flex
      as="header"
      w="full"
      h="80px"
      align="center"
      gap={{ base: "8px", md: "16px" }}
      px={{ base: 4, md: "24px" }}
      bg="white"
      borderBottomWidth="1px"
      borderColor="#E5E8EE"
    >
      {/* Marca + seção atual */}
      <Flex align="center" gap="4px" flexShrink={0}>
        <Link href="/">
          <Image
            src="/assets/logo-wordmark-dark.svg"
            alt={t("Marketplace.header.logoAlt")}
            objectFit="contain"
            w={{ base: "120px", md: "159px" }}
            h={{ base: "28px", md: "37px" }}
          />
        </Link>
        <Text
          display={{ base: "none", md: "block" }}
          color="#A0ABB8"
          fontSize="16.181px"
          lineHeight="19.721px"
          whiteSpace="nowrap"
        >
          / {t("Marketplace.header.section")}
        </Text>
      </Flex>

      <Box flex="1" />

      {/* Busca rápida */}
      <InputGroup
        display={{ base: "none", lg: "flex" }}
        flexShrink={0}
        w="256px"
        startElement={<Icon as={LuSearch} boxSize="13px" color="#A0ABB8" />}
        startElementProps={{ ps: "12px", w: "33px" }}
      >
        <Input
          h="33.5px"
          ps="33px"
          pe="13px"
          bg="#F4F6F9"
          borderWidth="1px"
          borderColor="#E5E8EE"
          rounded="10px"
          fontSize="13px"
          color="fg.default"
          placeholder={t("Marketplace.header.searchPlaceholder")}
          _placeholder={{ color: "#A0ABB8" }}
        />
      </InputGroup>

      {/* Seletor de idioma */}
      <Menu.Root
        onSelect={(details) => setLanguage(details.value as Language)}
        positioning={{ placement: "bottom-end" }}
      >
        <Menu.Trigger asChild>
          <Button
            variant="plain"
            h="30px"
            px="8px"
            py="6px"
            gap="6px"
            rounded="10px"
            color="#5A6478"
            aria-label={t("Marketplace.header.language")}
            _hover={{ bg: "#F4F6F9" }}
          >
            <Icon as={LuGlobe} boxSize="14px" />
            <Text
              display={{ base: "none", sm: "block" }}
              fontSize="12px"
              fontWeight={500}
              lineHeight="18px"
            >
              {LANGUAGE_LABELS[language]}
            </Text>
            <Icon as={LuChevronDown} boxSize="11px" />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="120px">
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                <Menu.Item key={lang} value={lang} fontSize="12px">
                  {LANGUAGE_LABELS[lang]}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <Box
        display={{ base: "none", md: "block" }}
        w="1px"
        h="20px"
        bg="#E5E8EE"
        flexShrink={0}
      />

      {/* Ações de conta */}
      <Flex align="center" gap="8px" flexShrink={0}>
        <Button
          asChild
          variant="plain"
          display={{ base: "none", md: "inline-flex" }}
          h="36px"
          w="105px"
          rounded="6px"
          bg="white"
          borderWidth="0.5px"
          borderColor="#30363D"
          color="#141921"
          fontSize="14.21px"
          fontWeight={500}
          _hover={{ bg: "#F4F6F9" }}
        >
          <Link href="/login">{t("Marketplace.header.login")}</Link>
        </Button>

        <Button
          asChild
          h="36px"
          px={{ base: "12px", md: "18.942px" }}
          rounded="6px"
          fontSize="14.21px"
          fontWeight={500}
        >
          <Link href="/register">{t("Marketplace.header.register")}</Link>
        </Button>
      </Flex>
    </Flex>
  );
}
