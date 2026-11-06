"use client";

import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowRight,
  LuHardDrive,
  LuHash,
  LuMonitorCog,
  LuRoute,
  LuServer,
  LuWifi,
} from "react-icons/lu";

import MarketplaceCategoryCard from "@/components/MarketplaceCategoryCard";
import { MarketplaceCategoryTone } from "@/components/MarketplaceCategoryCard/interface";

import {
  MarketplaceCategoriesProps,
  MarketplaceCategoryKey,
  MarketplaceCategoryShowcaseKey,
} from "./interface";

// Categorias na ordem do Figma (nó 3300:59082). Ícone e paleta ficam aqui; os
// textos vêm do i18n (Marketplace.categories.items.<key>). Só as quatro
// categorias do MVP têm contagem da API; as demais exibem o rodapé sem número.
const CATEGORIES: {
  key: MarketplaceCategoryShowcaseKey;
  icon: typeof LuWifi;
  tone: MarketplaceCategoryTone;
}[] = [
  { key: "connectivity", icon: LuWifi, tone: "blue" },
  { key: "infrastructure", icon: LuServer, tone: "violet" },
  { key: "hardware", icon: LuHardDrive, tone: "emerald" },
  { key: "protocols", icon: LuRoute, tone: "pink" },
  { key: "software", icon: LuMonitorCog, tone: "cyan" },
  { key: "numbering", icon: LuHash, tone: "amber" },
];

const COUNTED: readonly string[] = [
  "connectivity",
  "infrastructure",
  "hardware",
  "numbering",
] satisfies MarketplaceCategoryKey[];

const AUTOPLAY_MS = 3000;
const SLIDE_MS = 600;
const CARD_GAP = 20;

/**
 * Carrossel infinito: a lista é renderizada duas vezes e a faixa avança um
 * card a cada 3s. Ao chegar ao início da cópia, volta sem animação para o
 * primeiro card, que está na mesma posição visual — o laço não aparece.
 * Pausa com o mouse ou o foco na faixa, com a aba em segundo plano e quando o
 * sistema pede menos movimento.
 */
function useInfiniteCarousel(total: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Passo = largura de um card + gap, medido para acompanhar o breakpoint.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const card = track.firstElementChild as HTMLElement | null;
      if (card) setStep(card.offsetWidth + CARD_GAP);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || !step) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setAnimate(true);
      setIndex((current) => current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, step]);

  // Reativa a transição no quadro seguinte ao salto de volta.
  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  // Ao entrar na cópia, espera a animação terminar e volta sem transição para
  // o card equivalente da lista original. Usa um timer em vez de
  // `transitionend`, que não dispara se a animação for interrompida.
  useEffect(() => {
    if (index < total) return;
    const timer = window.setTimeout(() => {
      setAnimate(false);
      setIndex((current) => current % total);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, total]);

  return {
    trackRef,
    offset: index * step,
    animate: animate && !reducedMotion,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
  };
}

/**
 * Seção "Explore por categoria" da home do marketplace: cabeçalho com o atalho
 * para o catálogo completo e a galeria infinita das seis categorias, que ocupa
 * a largura toda da seção — do título até "Ver todas as categorias".
 */
export function MarketplaceCategories({
  counts,
  isLoading,
}: MarketplaceCategoriesProps) {
  const { t } = useTranslation();
  const loading = isLoading ?? !counts;
  const { trackRef, offset, animate, pause, resume } = useInfiniteCarousel(
    CATEGORIES.length,
  );

  const renderCard = (category: (typeof CATEGORIES)[number], copy: number) => {
    const base = `Marketplace.categories.items.${category.key}`;
    const tags = t(`${base}.tags`, { returnObjects: true });
    const counted = COUNTED.includes(category.key);
    const total = counted
      ? counts?.[category.key as MarketplaceCategoryKey]
      : undefined;
    const isClone = copy > 0;

    return (
      <Box
        key={`${copy}-${category.key}`}
        w={{ base: "280px", sm: "300px" }}
        flexShrink={0}
        aria-hidden={isClone || undefined}
        // A cópia só existe para fechar o laço: fica fora do foco e do
        // leitor de tela.
        {...(isClone ? { inert: true } : {})}
      >
        <MarketplaceCategoryCard
          icon={category.icon}
          tone={category.tone}
          href={`/marketplace?category=${category.key}`}
          title={t(`${base}.title`)}
          description={t(`${base}.description`)}
          badge={t(`${base}.badge`)}
          tags={Array.isArray(tags) ? (tags as string[]) : []}
          footerLabel={total ? t(`${base}.footer`, { total }) : ""}
          isLoading={counted && loading}
        />
      </Box>
    );
  };

  return (
    // Figma 1:1 (nó 3300:59074): cabeçalho de 54px, 20px de gap e a faixa de
    // cards com 320px de altura — 394px no total.
    <Stack gap="20px">
      <Flex
        align={{ base: "flex-start", md: "flex-end" }}
        justify="space-between"
        gap="12px"
        direction={{ base: "column", md: "row" }}
      >
        <Stack gap={0}>
          <Text
            as="h2"
            fontSize="20px"
            fontWeight={700}
            lineHeight="30px"
            color="#0F1729"
          >
            {t("Marketplace.categories.title")}
          </Text>
          <Text pt="4px" fontSize="13px" lineHeight="19.5px" color="#8A9AB5">
            {t("Marketplace.categories.subtitle")}
          </Text>
        </Stack>

        <Link href="/marketplace">
          <Flex align="center" gap="6px" flexShrink={0}>
            <Text
              fontSize="13px"
              fontWeight={600}
              lineHeight="19.5px"
              color="#1F5AFF"
            >
              {t("Marketplace.categories.seeAll")}
            </Text>
            <Icon as={LuArrowRight} boxSize="14px" color="#1F5AFF" />
          </Flex>
        </Link>
      </Flex>

      {/* Faixa "Cards / Contêiner responsivo" (nó 3300:59082): ocupa toda a
          largura da seção, 320px de altura, cards de 300px com 20px de gap e
          cortados nas pontas, como no Figma. */}
      <Box
        role="region"
        aria-roledescription="carrossel"
        aria-label={t("Marketplace.categories.title")}
        position="relative"
        display="flex"
        alignItems="center"
        minH={{ base: "auto", md: "320px" }}
        py={{ base: "4px", md: 0 }}
        overflow="hidden"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
      >
        <Flex
          ref={trackRef}
          gap={`${CARD_GAP}px`}
          align="stretch"
          w="max-content"
          style={{
            transform: `translate3d(-${offset}px, 0, 0)`,
            transition: animate
              ? `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
              : "none",
          }}
        >
          {CATEGORIES.map((category) => renderCard(category, 0))}
          {CATEGORIES.map((category) => renderCard(category, 1))}
        </Flex>
      </Box>
    </Stack>
  );
}
