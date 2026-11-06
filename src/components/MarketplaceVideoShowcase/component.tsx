"use client";

import { useState } from "react";
import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { s } from "./scale";

const VIDEOS = [
  { key: "escrow", duration: "0:42" },
  { key: "fiber", duration: "1:05" },
  { key: "kyc", duration: "0:58" },
] as const;

type VideoKey = (typeof VIDEOS)[number]["key"];

// Medidas do Figma (Neutra+ MP, nó 3300:59578). A partir de 1536px a seção
// usa os valores do Figma 1:1 (--vs-s = 1,2316 sobre a base escrita aqui);
// abaixo disso, a mesma proporção reduzida. No Figma o bloco tem 1612px e
// sangra 57px de cada lado da coluna de 1498px: só aplicamos isso quando a
// janela comporta (≥ 1632px), para nunca gerar rolagem horizontal.
export function MarketplaceVideoShowcase() {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = useState<VideoKey>("escrow");
  const activeVideo =
    VIDEOS.find((video) => video.key === selectedVideo) ?? VIDEOS[0];
  const videoTranslationKey = `Marketplace.videoShowcase.videos.${activeVideo.key}`;

  return (
    <Box
      as="section"
      aria-labelledby="marketplace-video-showcase-title"
      position="relative"
      overflow="hidden"
      css={{
        "--vs-s": "1",
        "@media (min-width: 1536px)": { "--vs-s": "1.2316" },
        "@media (min-width: 1632px)": { marginInline: s(-46.45) },
      }}
      rounded={s(16)}
      bg="#0F1729"
      color="white"
    >
      <Image
        src="/images/marketplace/video-showcase/ambient.png"
        alt=""
        aria-hidden
        position="absolute"
        inset={0}
        w="full"
        h="full"
        objectFit="cover"
        objectPosition="left center"
        opacity={0.25}
      />
      <Box
        aria-hidden
        position="absolute"
        inset={0}
        bgImage="linear-gradient(90deg, #0F1729 0%, rgba(15, 23, 41, 0.9) 50%, rgba(15, 23, 41, 0.4) 100%)"
      />

      <Grid
        position="relative"
        alignItems="center"
        gap={{ base: "28px", lg: s(32) }}
        p={{ base: "22px", md: "32px" }}
        pt={{ lg: s(39) }}
        pb={{ lg: s(39) }}
        pl={{ lg: s(40) }}
        pr={{ lg: s(46.45) }}
        templateColumns={{
          base: "minmax(0, 1fr)",
          lg: "minmax(0, 0.74fr) minmax(0, 1fr)",
          xl: `${s(460)} minmax(0, 1fr)`,
        }}
      >
        <Stack align="flex-start" gap={s(16)} minW={0}>
          <Flex
            align="center"
            gap={s(8)}
            py={s(6)}
            pl={s(8)}
            pr={s(16)}
            rounded="full"
            bg="#1F5AFF"
          >
            <Flex
              align="center"
              justify="center"
              boxSize={s(24)}
              rounded="full"
              bg="white"
            >
              <Image
                src="/images/marketplace/video-showcase/tv-icon.svg"
                alt=""
                aria-hidden
                boxSize={s(13)}
              />
            </Flex>
            <Text fontSize={s(13)} fontWeight={800} lineHeight={s(19.5)}>
              Neutra+ TV
            </Text>
          </Flex>

          <Text
            id="marketplace-video-showcase-title"
            as="h2"
            maxW={s(376)}
            fontSize={{ base: "30px", md: s(40) }}
            fontWeight={900}
            lineHeight={{ base: "32px", md: s(42) }}
            letterSpacing={{ base: "-0.8px", md: s(-1) }}
          >
            {t("Marketplace.videoShowcase.title")}
          </Text>

          <Text
            maxW={s(384)}
            color="rgba(255, 255, 255, 0.7)"
            fontSize={s(14)}
            lineHeight={s(21)}
          >
            {t("Marketplace.videoShowcase.description")}
          </Text>

          <Text
            px={s(12)}
            py={s(4)}
            rounded="full"
            bg="#10B981"
            fontSize={s(11)}
            fontWeight={800}
            letterSpacing={s(0.275)}
            lineHeight={s(16.5)}
          >
            {t("Marketplace.videoShowcase.freeForBusiness")}
          </Text>

          <Stack
            as="ul"
            gap={s(6)}
            w="full"
            m={0}
            pt={s(4)}
            px={0}
            pb={0}
            listStyleType="none"
          >
            {VIDEOS.map((video) => {
              const isSelected = selectedVideo === video.key;
              const translationKey = `Marketplace.videoShowcase.videos.${video.key}`;

              return (
                <Box as="li" key={video.key}>
                  <Button
                    type="button"
                    variant="plain"
                    w="full"
                    h={s(50)}
                    minH={0}
                    justifyContent="flex-start"
                    gap={s(12)}
                    px={s(12)}
                    py={0}
                    rounded={s(14)}
                    borderWidth={s(1)}
                    borderStyle="solid"
                    borderColor={
                      isSelected
                        ? "rgba(255, 255, 255, 0.3)"
                        : "rgba(255, 255, 255, 0.1)"
                    }
                    bg={
                      isSelected
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(255, 255, 255, 0.05)"
                    }
                    color="white"
                    _hover={{ bg: "rgba(255, 255, 255, 0.15)" }}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedVideo(video.key)}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      boxSize={s(28)}
                      flexShrink={0}
                      rounded="full"
                      bg={isSelected ? "white" : "rgba(255, 255, 255, 0.1)"}
                    >
                      <Image
                        src={`/images/marketplace/video-showcase/${isSelected ? "pause-icon" : "play-icon"}.svg`}
                        alt=""
                        aria-hidden
                        boxSize={s(12)}
                        ml={isSelected ? 0 : s(2)}
                      />
                    </Flex>
                    <Text
                      flex="1"
                      overflow="hidden"
                      fontSize={s(13)}
                      fontWeight={600}
                      lineHeight={s(17.875)}
                      textAlign="left"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {t(`${translationKey}.title`)}
                    </Text>
                    <Text
                      flexShrink={0}
                      color="rgba(255, 255, 255, 0.5)"
                      fontSize={s(11)}
                      fontWeight={500}
                      lineHeight={s(16.5)}
                    >
                      {video.duration}
                    </Text>
                  </Button>
                </Box>
              );
            })}
          </Stack>

          <Box pt={s(4)}>
            <Button
              asChild
              h={s(40.3)}
              minH={0}
              px={s(20)}
              gap={s(8)}
              rounded={s(14)}
              bg="white"
              color="#0F1729"
              fontSize={s(13)}
              fontWeight={700}
              lineHeight={s(19.5)}
              _hover={{ bg: "#E8EDF7" }}
            >
              <Link href="/marketplace">
                {t("Marketplace.videoShowcase.cta")}
                <Image
                  src="/images/marketplace/video-showcase/arrow-right.svg"
                  alt=""
                  aria-hidden
                  boxSize={s(14)}
                />
              </Link>
            </Button>
          </Box>
        </Stack>

        <Box
          position="relative"
          w="full"
          overflow="hidden"
          rounded={s(14)}
          borderWidth={s(1)}
          borderStyle="solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          bg="black"
          aspectRatio="900 / 529"
          boxShadow={`0 ${s(25)} ${s(50)} ${s(-12)} rgba(0, 0, 0, 0.25)`}
          aria-label={t(`${videoTranslationKey}.title`)}
        >
          <Image
            src="/images/marketplace/video-showcase/escrow-video-poster.png"
            alt=""
            aria-hidden
            position="absolute"
            inset={0}
            w="full"
            h="full"
            objectFit="cover"
          />
          <Box
            aria-hidden
            position="absolute"
            inset={0}
            bgImage="linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.85) 100%)"
          />

          <Text
            position="absolute"
            top={s(12)}
            left={s(16)}
            maxW={`calc(100% - ${s(32)})`}
            overflow="hidden"
            borderLeftWidth={s(2)}
            borderLeftStyle="solid"
            borderLeftColor="white"
            pl={s(8)}
            fontSize={s(13)}
            fontWeight={600}
            lineHeight={s(19.5)}
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {t(`${videoTranslationKey}.title`)}
          </Text>

          <Text
            position="absolute"
            right={s(16)}
            bottom={{ base: "44px", md: s(60.3) }}
            left={s(16)}
            color="white"
            fontSize={{ base: "14px", md: s(19) }}
            fontWeight={700}
            lineHeight={{ base: "1.25", md: s(28.5) }}
            textAlign="center"
            textShadow={`0 ${s(2)} ${s(6)} rgba(0, 0, 0, 0.8)`}
          >
            {t(`${videoTranslationKey}.caption`)}
          </Text>

          <Flex
            position="absolute"
            right={{ base: "12px", md: s(60) }}
            bottom={{ base: "12px", md: s(25) }}
            left={{ base: "12px", md: s(60) }}
            align="center"
            gap={s(12)}
          >
            <Image
              src="/images/marketplace/video-showcase/player-pause.svg"
              alt=""
              aria-hidden
              boxSize={s(16)}
              flexShrink={0}
            />
            <Box
              h={s(4)}
              flex="1"
              overflow="hidden"
              rounded="full"
              bg="rgba(255, 255, 255, 0.25)"
            >
              <Box h="full" w="11.6%" bg="#1F5AFF" />
            </Box>
            <Text
              flexShrink={0}
              color="rgba(255, 255, 255, 0.8)"
              fontSize={s(11)}
              lineHeight={s(16.5)}
            >
              0:01
            </Text>
            <Image
              src="/images/marketplace/video-showcase/player-mute.svg"
              alt=""
              aria-hidden
              boxSize={s(16)}
              flexShrink={0}
            />
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}
