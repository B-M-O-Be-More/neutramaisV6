"use client";

import { Flex, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { MarketplaceFooterLinkKey } from "./interface";

// Links institucionais, na ordem do design. As páginas ainda não existem —
// ajuste os destinos quando forem criadas.
const LINKS: { key: MarketplaceFooterLinkKey; href: string }[] = [
  { key: "terms", href: "/terms" },
  { key: "privacy", href: "/privacy" },
  { key: "compliance", href: "/compliance" },
  { key: "support", href: "/support" },
];

/**
 * Rodapé da home do marketplace.
 * Aviso de copyright/público-alvo à esquerda e links institucionais à direita.
 */
export function MarketplaceFooter() {
  const { t } = useTranslation();

  return (
    <Flex
      as="footer"
      direction={{ base: "column", md: "row" }}
      align={{ base: "flex-start", md: "center" }}
      justify="space-between"
      gap="12px"
      mt={{ base: "20px", md: "44px" }}
      pt="21px"
      pb="20px"
      borderTopWidth="1px"
      borderColor="#E5E8EE"
    >
      <Text fontSize="12px" lineHeight="18px" color="#A0ABB8">
        {t("Marketplace.footer.copyright", {
          year: new Date().getFullYear(),
        })}
      </Text>

      <Flex as="nav" align="center" gap="20px" wrap="wrap">
        {LINKS.map((link) => (
          <Link key={link.key} href={link.href}>
            <Text
              fontSize="12px"
              fontWeight={500}
              lineHeight="18px"
              color="#A0ABB8"
              transition="color 0.15s ease"
              _hover={{ color: "#5A6478" }}
            >
              {t(`Marketplace.footer.links.${link.key}`)}
            </Text>
          </Link>
        ))}
      </Flex>
    </Flex>
  );
}
