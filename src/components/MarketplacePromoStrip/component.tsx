"use client";

import { Box, Flex, Grid, Icon, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import {
  LuArrowRight,
  LuCreditCard,
  LuRadio,
  LuServer,
  LuShieldCheck,
} from "react-icons/lu";

import { MarketplacePromoStripProps } from "./interface";
import { s } from "./scale";

// Faixa de campanhas do Figma (Neutra+ MP, nó 3300:59345): 5 cards de mesma
// largura e 400px de altura (492,6 no Figma). Os valores abaixo são o Figma
// ÷ 1,2316; a partir de 1536px a variável --strip-s devolve o valor 1:1.
const ASSETS = "/assets/promo-strip";
const PT = "promoStrip";

const titleStyle = {
  fontWeight: 900,
  color: "white",
  whiteSpace: "nowrap",
} as const;

function StripCard({
  href,
  label,
  children,
  ...rest
}: {
  href: string;
  label: string;
  children: ReactNode;
} & React.ComponentProps<typeof Box>) {
  return (
    <Box
      asChild
      position="relative"
      display="flex"
      flexDirection="column"
      minW={0}
      h={s(400)}
      overflow="hidden"
      rounded={s(16)}
      scrollSnapAlign="start"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
      _focusVisible={{ outline: "2px solid #1F5AFF", outlineOffset: "2px" }}
      {...rest}
    >
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Box>
  );
}

function Pill({
  icon,
  children,
  bg = "white",
  borderColor,
  color = "#0F1729",
}: {
  icon?: IconType;
  children: ReactNode;
  bg?: string;
  borderColor?: string;
  color?: string;
}) {
  return (
    <Flex
      align="center"
      gap={s(4)}
      w="fit-content"
      h={s(26.5)}
      px={s(8)}
      bg={bg}
      border={borderColor ? `1px solid ${borderColor}` : undefined}
      rounded={s(10)}
      color={color}
      fontSize={s(11)}
      fontWeight={700}
      lineHeight={s(16.5)}
      whiteSpace="nowrap"
    >
      {icon && <Icon as={icon} boxSize={s(12)} flexShrink={0} />}
      {children}
    </Flex>
  );
}

function MiniTile({
  src,
  icon,
  iconColor,
  discount,
}: {
  src?: string;
  icon?: IconType;
  iconColor?: string;
  discount?: string;
}) {
  return (
    <Flex
      position="relative"
      align="center"
      justify="center"
      overflow="hidden"
      bg="white"
      rounded={s(14)}
      boxShadow="0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
    >
      {src ? (
        <Image src={src} alt="" w="full" h="full" objectFit="cover" />
      ) : (
        icon && <Icon as={icon} boxSize={s(34)} color={iconColor} />
      )}
      {discount && (
        <Text
          position="absolute"
          left={s(6)}
          bottom={s(7)}
          px={s(6)}
          bg="#F59E0B"
          rounded={s(8)}
          color="white"
          fontSize={s(11)}
          fontWeight={700}
          lineHeight={s(18)}
          whiteSpace="nowrap"
        >
          {discount}
        </Text>
      )}
    </Flex>
  );
}

function CardLink({ children, color }: { children: ReactNode; color: string }) {
  return (
    <Flex
      align="center"
      gap={s(4)}
      pt={s(12)}
      color={color}
      fontSize={s(12)}
      fontWeight={700}
      lineHeight={s(18)}
    >
      {children}
      <Icon as={LuArrowRight} boxSize={s(13)} />
    </Flex>
  );
}

export function MarketplacePromoStrip({
  href = "/offers",
}: MarketplacePromoStripProps) {
  const { t } = useTranslation();
  const k = (key: string, options?: Record<string, unknown>) =>
    t(`Marketplace.${PT}.${key}`, options);

  return (
    <Grid
      as="section"
      aria-label={k("ariaLabel")}
      css={{
        "--strip-s": "1",
        "@media (min-width: 1536px)": { "--strip-s": "1.2316" },
      }}
      templateColumns={{
        base: "repeat(5, 260px)",
        lg: "repeat(5, minmax(0, 1fr))",
      }}
      gap={s(12)}
      pb={s(4)}
      overflowX={{ base: "auto", lg: "visible" }}
      scrollSnapType={{ base: "x mandatory", lg: "none" }}
    >
      {/* Saldão de Conectividade */}
      <StripCard
        href={href}
        label={`${k("saldao.eyebrow")}: ${k("saldao.titleLine1")} ${k("saldao.titleLine2")}`}
        bg="linear-gradient(180deg, #1F5AFF 0%, #0B2FA8 100%)"
      >
        <Image
          src={`${ASSETS}/fibra-optica.jpg`}
          alt=""
          position="absolute"
          inset={0}
          w="full"
          h="full"
          objectFit="cover"
          objectPosition="18% center"
          opacity={0.9}
        />
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(-3.83deg, rgba(11, 47, 168, 0) 60.46%, rgba(11, 47, 168, 0.1) 79.29%, #0B2FA8 98.12%)"
        />
        <Stack position="relative" gap={0} p={s(20)} pt={s(49.6)}>
          <Text
            color="rgba(255, 255, 255, 0.8)"
            fontSize={s(15)}
            fontWeight={500}
            lineHeight={s(22.5)}
          >
            {k("saldao.eyebrow")}
          </Text>
          <Text
            {...titleStyle}
            pt={s(8)}
            fontSize={s(34)}
            lineHeight={s(35.7)}
            letterSpacing={s(-0.85)}
          >
            {k("saldao.titleLine1")}
            <br />
            {k("saldao.titleLine2")}
          </Text>
          <Stack gap={s(6)} pt={s(16)}>
            {(["setup", "installments"] as const).map((tag) => (
              <Text
                key={tag}
                w="fit-content"
                h={s(26)}
                px={s(10)}
                py={s(4)}
                bg="white"
                rounded={s(10)}
                color="#1F5AFF"
                fontSize={s(12)}
                fontWeight={800}
                lineHeight={s(18)}
                whiteSpace="nowrap"
              >
                {k(`saldao.tags.${tag}`)}
              </Text>
            ))}
          </Stack>
        </Stack>
      </StripCard>

      {/* Em alta na Neutra+ */}
      <StripCard
        href={href}
        label={`${k("trends.titleLine1")} ${k("trends.titleLine2")}`}
        p={s(16)}
        bg="linear-gradient(180deg, #7337FD 1.65%, #9374E2 100%)"
      >
        <Text
          color="rgba(255, 255, 255, 0.8)"
          fontSize={s(13)}
          lineHeight={s(19.5)}
        >
          {k("trends.eyebrow")}
        </Text>
        <Text
          {...titleStyle}
          fontSize={s(26)}
          lineHeight={s(32.5)}
          letterSpacing={s(-0.65)}
        >
          {k("trends.titleLine1")}
          <br />
          {k("trends.titleLine2")}
        </Text>
        <Grid
          mt="auto"
          templateColumns="repeat(2, minmax(0, 1fr))"
          templateRows={`repeat(2, ${s(101.6)})`}
          gap={s(8)}
        >
          <MiniTile src={`${ASSETS}/roteador.jpg`} />
          <MiniTile src={`${ASSETS}/rack-cabos.jpg`} />
          <Image
            src={`${ASSETS}/datacenter.jpg`}
            alt=""
            w="full"
            h="full"
            objectFit="cover"
            roundedTop={s(16)}
          />
          <MiniTile src={`${ASSETS}/patch-cabos.jpg`} />
        </Grid>
        <CardLink color="rgba(255, 255, 255, 0.9)">{k("trends.cta")}</CardLink>
      </StripCard>

      {/* Semana do Link Dedicado */}
      <StripCard
        href={href}
        label={`${k("linkWeek.title")}: ${k("linkWeek.offersUpTo")} ${k("linkWeek.value")}% ${k("linkWeek.off")}`}
        bg="linear-gradient(180deg, #9FDFF9 15.81%, #00B0F8 43.82%)"
      >
        <Image
          src={`${ASSETS}/datacenter.jpg`}
          alt=""
          position="absolute"
          left={s(17.6)}
          top={s(200)}
          w={s(201)}
          h={s(220)}
          objectFit="cover"
          roundedTop={s(16)}
        />
        <Stack position="relative" gap={0} p={s(20)} pt={s(23.6)}>
          <Text
            maxW={s(194)}
            color="#0F1729"
            fontSize={s(17)}
            fontWeight={800}
            lineHeight={s(21.25)}
          >
            {k("linkWeek.title")}
          </Text>
          <Flex align="flex-end" gap={s(4)} pt={s(8)} color="#0F1729">
            <Text
              maxW={s(56)}
              pb={s(12)}
              fontSize={s(13)}
              fontWeight={700}
              lineHeight={s(16.25)}
            >
              {k("linkWeek.offersUpTo")}
            </Text>
            <Text
              fontSize={s(84)}
              fontWeight={900}
              lineHeight={s(75.6)}
              letterSpacing={s(-4.2)}
            >
              {k("linkWeek.value")}
            </Text>
            <Stack gap={0} pb={s(4)}>
              <Text
                color="#1F5AFF"
                fontSize={s(40)}
                fontWeight={900}
                lineHeight={s(40)}
              >
                %
              </Text>
              <Text fontSize={s(20)} fontWeight={800} lineHeight={s(20)}>
                {k("linkWeek.off")}
              </Text>
            </Stack>
          </Flex>
          <Flex h={s(35)} align="center" justify="center">
            <Pill icon={LuShieldCheck} borderColor="#BFE6F7">
              {k("linkWeek.badge")}
            </Pill>
          </Flex>
        </Stack>
      </StripCard>

      {/* ONT Wi-Fi 6 */}
      <StripCard
        href={href}
        label={`${k("ont.titleLine1")} ${k("ont.titleLine2")}`}
        bg="#0F1729"
      >
        <Image
          src={`${ASSETS}/cto-fundo.png`}
          alt=""
          position="absolute"
          left={s(-31)}
          top={0}
          w={s(287)}
          h={s(481)}
          maxW="none"
          objectFit="cover"
          opacity={0.1}
        />
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(180deg, #0F1729 0%, rgba(15, 23, 41, 0.5) 8.73%, rgba(15, 23, 41, 0) 17.44%)"
        />
        <Stack position="relative" gap={s(12)} p={s(20)} pt={s(118.6)}>
          <Text
            {...titleStyle}
            maxW={s(194)}
            whiteSpace="normal"
            fontSize={s(26)}
            lineHeight={s(32.5)}
            letterSpacing={s(-0.65)}
          >
            {k("ont.titleLine1")}
            <br />
            {k("ont.titleLine2")}
          </Text>
          <Pill
            icon={LuCreditCard}
            bg="rgba(255, 255, 255, 0.1)"
            borderColor="rgba(255, 255, 255, 0.2)"
            color="white"
          >
            {k("ont.badge")}
          </Pill>
        </Stack>
        <Text
          position="absolute"
          left={s(20)}
          bottom={s(16)}
          px={s(12)}
          py={s(4)}
          bg="#10B981"
          rounded="full"
          color="white"
          fontSize={s(11)}
          fontWeight={700}
          lineHeight={s(16.5)}
          whiteSpace="nowrap"
        >
          {k("ont.stock", { count: 23 })}
        </Text>
      </StripCard>

      {/* Ofertas pra você */}
      <StripCard
        href={href}
        label={`${k("highlights.titleLine1")} ${k("highlights.titleLine2")}`}
        p={s(16)}
        bg="linear-gradient(-0.64deg, #F9E2CA 6.37%, #FFAD5C 102.65%)"
      >
        <Text
          color="rgba(15, 23, 41, 0.7)"
          fontSize={s(13)}
          lineHeight={s(19.5)}
        >
          {k("highlights.eyebrow")}
        </Text>
        <Text
          {...titleStyle}
          pb={s(12)}
          color="#0F1729"
          fontSize={s(26)}
          lineHeight={s(32.5)}
          letterSpacing={s(-0.65)}
        >
          {k("highlights.titleLine1")}
          <br />
          {k("highlights.titleLine2")}
        </Text>
        <Grid
          mt="auto"
          templateColumns="repeat(2, minmax(0, 1fr))"
          templateRows={`repeat(2, ${s(101.6)})`}
          gap={s(8)}
        >
          <MiniTile
            src={`${ASSETS}/ont-wifi.jpg`}
            discount={k("highlights.discount", { value: 30 })}
          />
          <MiniTile
            src={`${ASSETS}/switch-cabos.jpg`}
            discount={k("highlights.discount", { value: 33 })}
          />
          <MiniTile
            icon={LuServer}
            iconColor="#7C3AED"
            discount={k("highlights.discount", { value: 20 })}
          />
          <MiniTile
            icon={LuRadio}
            iconColor="#10B981"
            discount={k("highlights.discount", { value: 14 })}
          />
        </Grid>
        <CardLink color="#0F1729">{k("highlights.cta")}</CardLink>
      </StripCard>
    </Grid>
  );
}
