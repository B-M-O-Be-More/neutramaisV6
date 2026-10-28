"use client";

import { useState } from "react";
import { Box, Button, Flex, Grid, Image, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const VIDEOS = [
  { key: "escrow", duration: "0:42" },
  { key: "fiber", duration: "1:05" },
  { key: "kyc", duration: "0:58" },
] as const;

type VideoKey = (typeof VIDEOS)[number]["key"];

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
      rounded="20px"
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
        gap={{ base: "28px", md: "24px" }}
        p={{ base: "22px", md: "32px" }}
        templateColumns={{
          base: "minmax(0, 1fr)",
          md: "minmax(0, 0.74fr) minmax(0, 1fr)",
        }}
      >
        <Stack align="flex-start" gap={0} minW={0}>
          <Flex
            align="center"
            gap="8px"
            mb="14px"
            py="4px"
            pl="6px"
            pr="12px"
            rounded="full"
            bg="#1F5AFF"
          >
            <Flex
              align="center"
              justify="center"
              boxSize="22px"
              rounded="full"
              bg="white"
            >
              <Image
                src="/images/marketplace/video-showcase/tv-icon.svg"
                alt=""
                aria-hidden
                boxSize="12px"
              />
            </Flex>
            <Text fontSize="11px" fontWeight={800} lineHeight="18px">
              Neutra+ TV
            </Text>
          </Flex>

          <Text
            id="marketplace-video-showcase-title"
            as="h2"
            fontSize={{ base: "30px", md: "32px" }}
            fontWeight={900}
            lineHeight={{ base: "32px", md: "34px" }}
            letterSpacing="-0.8px"
          >
            {t("Marketplace.videoShowcase.title")}
          </Text>

          <Text
            mt="12px"
            maxW="390px"
            color="rgba(255, 255, 255, 0.7)"
            fontSize="12px"
            lineHeight="18px"
          >
            {t("Marketplace.videoShowcase.description")}
          </Text>

          <Text
            mt="12px"
            px="10px"
            py="3px"
            rounded="full"
            bg="#10B981"
            fontSize="9px"
            fontWeight={800}
            letterSpacing="0.2px"
            lineHeight="14px"
          >
            {t("Marketplace.videoShowcase.freeForBusiness")}
          </Text>

          <Stack
            as="ul"
            gap="6px"
            w="full"
            mt="10px"
            p={0}
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
                    h="42px"
                    justifyContent="flex-start"
                    gap="10px"
                    px="9px"
                    rounded="12px"
                    borderWidth="1px"
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
                      boxSize="24px"
                      flexShrink={0}
                      rounded="full"
                      bg={isSelected ? "white" : "rgba(255, 255, 255, 0.1)"}
                    >
                      <Image
                        src={`/images/marketplace/video-showcase/${isSelected ? "pause-icon" : "play-icon"}.svg`}
                        alt=""
                        aria-hidden
                        boxSize="11px"
                      />
                    </Flex>
                    <Text
                      flex="1"
                      overflow="hidden"
                      fontSize="10px"
                      fontWeight={600}
                      lineHeight="16px"
                      textAlign="left"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {t(`${translationKey}.title`)}
                    </Text>
                    <Text
                      flexShrink={0}
                      color="rgba(255, 255, 255, 0.5)"
                      fontSize="9px"
                      fontWeight={500}
                      lineHeight="14px"
                    >
                      {video.duration}
                    </Text>
                  </Button>
                </Box>
              );
            })}
          </Stack>

          <Button
            asChild
            mt="14px"
            h="38px"
            px="16px"
            gap="8px"
            rounded="12px"
            bg="white"
            color="#0F1729"
            fontSize="10px"
            fontWeight={700}
            _hover={{ bg: "#E8EDF7" }}
          >
            <Link href="/marketplace">
              {t("Marketplace.videoShowcase.cta")}
              <Image
                src="/images/marketplace/video-showcase/arrow-right.svg"
                alt=""
                aria-hidden
                boxSize="13px"
              />
            </Link>
          </Button>
        </Stack>

        <Box
          position="relative"
          w="full"
          overflow="hidden"
          rounded="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          bg="black"
          aspectRatio="900 / 529"
          boxShadow="0 24px 48px -12px rgba(0, 0, 0, 0.25)"
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
            top="12px"
            left="12px"
            maxW="calc(100% - 24px)"
            overflow="hidden"
            borderLeft="2px solid white"
            pl="7px"
            fontSize="10px"
            fontWeight={600}
            lineHeight="16px"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {t(`${videoTranslationKey}.title`)}
          </Text>

          <Text
            position="absolute"
            right="20px"
            bottom="44px"
            left="20px"
            color="white"
            fontSize={{ base: "14px", md: "16px" }}
            fontWeight={700}
            lineHeight="1.25"
            textAlign="center"
            textShadow="0 2px 6px rgba(0, 0, 0, 0.8)"
          >
            {t(`${videoTranslationKey}.caption`)}
          </Text>

          <Flex
            position="absolute"
            right="12px"
            bottom="12px"
            left="12px"
            align="center"
            gap="8px"
          >
            <Image
              src="/images/marketplace/video-showcase/player-pause.svg"
              alt=""
              aria-hidden
              boxSize="14px"
              flexShrink={0}
            />
            <Box
              h="3px"
              flex="1"
              overflow="hidden"
              rounded="full"
              bg="rgba(255, 255, 255, 0.25)"
            >
              <Box h="full" w="12%" bg="#1F5AFF" />
            </Box>
            <Text
              flexShrink={0}
              color="rgba(255, 255, 255, 0.8)"
              fontSize="9px"
              lineHeight="14px"
            >
              0:01
            </Text>
            <Image
              src="/images/marketplace/video-showcase/player-mute.svg"
              alt=""
              aria-hidden
              boxSize="14px"
              flexShrink={0}
            />
          </Flex>
        </Box>
      </Grid>
    </Box>
  );
}
