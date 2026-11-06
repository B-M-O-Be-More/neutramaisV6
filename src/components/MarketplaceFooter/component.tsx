"use client";

import { Box, Flex, Grid, Image, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { MarketplaceFooterLinkKey } from "./interface";

const FOOTER_LINKS: { key: MarketplaceFooterLinkKey; href: string }[] = [
  { key: "terms", href: "/terms" },
  { key: "privacy", href: "/privacy" },
  { key: "compliance", href: "/compliance" },
];

// Meios de pagamento aceitos pela plataforma: Pix, cartão de crédito e
// Crédito Neutra+ (como no Figma).
const PAYMENT_METHODS = [
  { key: "pix", icon: "pix.svg" },
  { key: "creditCard", icon: "credit-card.svg" },
  { key: "credit", icon: "credit.svg" },
] as const;

const FOOTER_ASSETS = "/images/marketplace/footer";

const navLinkStyles = {
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "24px",
  color: "#A0ABB8",
  transition: "color 0.15s ease",
  _hover: { color: "white" },
};

function FooterNavLink({
  href,
  children,
}: {
  href?: string;
  children: string;
}) {
  if (!href) {
    return <Text {...navLinkStyles}>{children}</Text>;
  }

  return (
    <Link href={href}>
      <Text {...navLinkStyles}>{children}</Text>
    </Link>
  );
}

export function MarketplaceFooter() {
  const { t } = useTranslation();
  const navLabel = t("Marketplace.footer.navLabel");

  return (
    <Box pt="10px" bg="white">
      <Flex as="footer" direction="column" bg="#0F1729" color="white">
        <Grid
          gridTemplateColumns={{
            base: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr)) minmax(160px, 0.5fr)",
          }}
          gap={{ base: "32px", xl: "24px" }}
          minH={{ xl: "367px" }}
          px={{ base: "16px", md: "24px", xl: "48px" }}
          pt={{ base: "32px", xl: "49px" }}
          pb={{ base: "32px", xl: "40px" }}
        >
          <Box>
            <Image
              src={`${FOOTER_ASSETS}/logo.svg`}
              alt="Neutra+"
              width="159px"
              height="auto"
            />
            <Text
              mt="10px"
              maxW="373px"
              fontSize="17px"
              fontWeight={600}
              lineHeight="26px"
              color="rgba(255,255,255,0.8)"
            >
              {t("Marketplace.footer.brandDescription")}
            </Text>

            <Flex direction="column" gap="10px" mt="32px">
              <Link href="tel:+551127550435">
                <Flex
                  align="center"
                  gap="8px"
                  color="#A0ABB8"
                  fontSize="15px"
                  lineHeight="23px"
                >
                  <Image
                    src={`${FOOTER_ASSETS}/phone.svg`}
                    alt=""
                    width="17px"
                    height="17px"
                  />
                  <Text>(11) 2755-0435</Text>
                </Flex>
              </Link>
              <Link href="mailto:suporte@neutramais.com">
                <Flex
                  align="center"
                  gap="8px"
                  color="#A0ABB8"
                  fontSize="15px"
                  lineHeight="23px"
                >
                  <Image
                    src={`${FOOTER_ASSETS}/email.svg`}
                    alt=""
                    width="17px"
                    height="17px"
                  />
                  <Text>suporte@neutramais.com</Text>
                </Flex>
              </Link>
              <Flex align="center" gap="8px" color="#A0ABB8" fontSize="15px">
                <Image
                  src={`${FOOTER_ASSETS}/company.svg`}
                  alt=""
                  width="17px"
                  height="17px"
                />
                <Text>CNPJ 51.632.725/0001-33</Text>
              </Flex>
              <Flex
                align="flex-start"
                gap="8px"
                color="#A0ABB8"
                fontSize="15px"
                lineHeight="23px"
              >
                <Image
                  src={`${FOOTER_ASSETS}/location.svg`}
                  alt=""
                  width="17px"
                  height="17px"
                  mt="2px"
                />
                <Text>
                  Calçada das Margaridas, 163 · Sala 02 Cond. Centro Comercial
                  Alpha Barueri, SP · CEP 06453-038
                </Text>
              </Flex>
            </Flex>
          </Box>

          <Box as="nav" aria-label={navLabel}>
            <Text fontSize="16px" fontWeight={700} lineHeight="24px">
              {t("Marketplace.footer.columns.payments")}
            </Text>
            <Flex direction="column" gap="8px" mt="14px">
              <FooterNavLink>
                {t("Marketplace.footer.links.paymentMethods")}
              </FooterNavLink>
              <FooterNavLink href="#marketplace-credit-banner">
                {t("Marketplace.footer.links.credit")}
              </FooterNavLink>
            </Flex>
          </Box>

          <Box as="nav" aria-label={navLabel}>
            <Text fontSize="16px" fontWeight={700} lineHeight="24px">
              {t("Marketplace.footer.columns.help")}
            </Text>
            <Flex direction="column" gap="8px" mt="14px">
              <FooterNavLink href="/login">
                {t("Marketplace.footer.links.account")}
              </FooterNavLink>
              <FooterNavLink href="/compliance">
                {t("Marketplace.footer.links.security")}
              </FooterNavLink>
              <FooterNavLink href="/support">
                {t("Marketplace.footer.links.faq")}
              </FooterNavLink>
              <FooterNavLink href="/support">
                {t("Marketplace.footer.links.help")}
              </FooterNavLink>
            </Flex>
          </Box>

          <Box as="nav" aria-label={navLabel}>
            <Text fontSize="16px" fontWeight={700} lineHeight="24px">
              {t("Marketplace.footer.columns.about")}
            </Text>
            <Flex direction="column" gap="8px" mt="14px">
              <FooterNavLink href="/">
                {t("Marketplace.footer.links.neutra")}
              </FooterNavLink>
              <FooterNavLink>{t("Marketplace.footer.links.bmo")}</FooterNavLink>
              <FooterNavLink>
                {t("Marketplace.footer.links.community")}
              </FooterNavLink>
            </Flex>
          </Box>

          <Box>
            <Text fontSize="16px" fontWeight={700} lineHeight="24px" mb="14px">
              {t("Marketplace.footer.columns.support")}
            </Text>
            <Link href="mailto:suporte@neutramais.com">
              <Flex
                as="span"
                align="center"
                gap="8px"
                w="fit-content"
                px="15px"
                py="10px"
                borderRadius="10px"
                bg="#1F5AFF"
                fontSize="14px"
                fontWeight={600}
                lineHeight="22px"
                whiteSpace="nowrap"
              >
                <Image
                  src={`${FOOTER_ASSETS}/support.svg`}
                  alt=""
                  width="16px"
                  height="16px"
                />
                {t("Marketplace.footer.contactSupport")}
              </Flex>
            </Link>
            <Flex gap="10px" mt="18px" aria-hidden="true">
              {[
                "social-1.svg",
                "social-2.svg",
                "social-3.svg",
                "social-4.svg",
              ].map((icon) => (
                <Flex
                  key={icon}
                  align="center"
                  justify="center"
                  width="39px"
                  height="39px"
                  borderRadius="10px"
                  bg="rgba(255,255,255,0.05)"
                >
                  <Image
                    src={`${FOOTER_ASSETS}/${icon}`}
                    alt=""
                    width="17px"
                    height="17px"
                  />
                </Flex>
              ))}
            </Flex>
          </Box>
        </Grid>

        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "flex-start", lg: "center" }}
          justify="space-between"
          gap="20px"
          borderTopWidth="1px"
          borderColor="rgba(255,255,255,0.1)"
          minH={{ xl: "131px" }}
          px={{ base: "16px", md: "24px", xl: "48px" }}
          py={{ base: "20px", xl: "25px" }}
        >
          <Box>
            <Text
              mb="12px"
              fontSize="13px"
              fontWeight={700}
              lineHeight="20px"
              letterSpacing="1.2px"
              color="#8A9AB5"
            >
              {t("Marketplace.footer.paymentHeading")}
            </Text>
            <Flex gap="8px" wrap="wrap">
              {PAYMENT_METHODS.map(({ key, icon }) => (
                <Flex
                  key={key}
                  align="center"
                  gap="7px"
                  px="15px"
                  py="7px"
                  border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="10px"
                  bg="rgba(255,255,255,0.1)"
                >
                  <Image
                    src={`${FOOTER_ASSETS}/${icon}`}
                    alt=""
                    width="17px"
                    height="17px"
                  />
                  <Text
                    fontSize="14px"
                    fontWeight={600}
                    lineHeight="22px"
                    color="rgba(255,255,255,0.85)"
                    whiteSpace="nowrap"
                  >
                    {t(`Marketplace.footer.paymentMethods.${key}`)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
          <Flex
            align="center"
            gap="8px"
            color="#8A9AB5"
            fontSize="14px"
            lineHeight="22px"
          >
            <Image
              src={`${FOOTER_ASSETS}/security.svg`}
              alt=""
              width="17px"
              height="17px"
            />
            <Text>{t("Marketplace.footer.securityNotice")}</Text>
          </Flex>
        </Flex>

        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "flex-start", lg: "center" }}
          justify="space-between"
          gap="12px"
          minH={{ xl: "69px" }}
          px={{ base: "16px", md: "24px", xl: "48px" }}
          py="20px"
          bg="rgba(0,0,0,0.25)"
        >
          <Text fontSize="14px" lineHeight="21px" color="#6B7A94">
            {t("Marketplace.footer.copyright", {
              year: new Date().getFullYear(),
            })}
          </Text>

          <Flex as="nav" aria-label={navLabel} gap="24px" wrap="wrap">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.key} href={link.href}>
                <Text
                  fontSize="14px"
                  fontWeight={500}
                  lineHeight="21px"
                  color="#6B7A94"
                  transition="color 0.15s ease"
                  _hover={{ color: "white" }}
                >
                  {t(`Marketplace.footer.links.${link.key}`)}
                </Text>
              </Link>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
