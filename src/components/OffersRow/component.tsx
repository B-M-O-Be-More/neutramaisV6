"use client";

import { Box, Flex, Icon, IconButton } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { OffersRowProps } from "./interface";

/** Botão de rolagem nas pontas da faixa (Figma 2084-22546). */
function ScrollButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <IconButton
      position="absolute"
      top="50%"
      transform="translateY(-50%)"
      {...(side === "right"
        ? { right: 0, roundedLeft: "12px" }
        : { left: 0, roundedRight: "12px" })}
      zIndex={1}
      w="40px"
      h="120px"
      minW="40px"
      rounded="0"
      bg="white"
      borderWidth="1px"
      borderColor="#E5E8EE"
      color="#0F1729"
      boxShadow="0px 4px 12px rgba(15,23,41,0.12)"
      _hover={{ bg: "#F4F6F9" }}
      aria-label={label}
      onClick={onClick}
    >
      <Icon
        as={side === "right" ? LuChevronRight : LuChevronLeft}
        boxSize="18px"
      />
    </IconButton>
  );
}

/**
 * Faixa horizontal de cards da vitrine: rola com o toque/roda e pelos botões
 * nas pontas, que só aparecem quando há o que rolar naquele sentido.
 */
export function OffersRow({ label, tone = "plain", children }: OffersRowProps) {
  const { t } = useTranslation();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: true });

  const updateEdges = React.useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    setEdges({
      start: node.scrollLeft <= 1,
      end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 1,
    });
  }, []);

  const count = React.Children.count(children);

  React.useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    // Mede de novo quando a largura muda (sidebar, janela) ou os cards chegam.
    const frame = requestAnimationFrame(updateEdges);
    window.addEventListener("resize", updateEdges);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateEdges);
    observer?.observe(node);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateEdges);
      observer?.disconnect();
    };
  }, [updateEdges, count]);

  const scroll = (direction: 1 | -1) => {
    const node = scrollerRef.current;
    node?.scrollBy({
      left: direction * node.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const isDark = tone === "dark";

  return (
    <Box
      as="section"
      aria-label={label}
      position="relative"
      bg={isDark ? "#3C3B6E" : undefined}
      rounded={isDark ? "16px" : undefined}
      overflow="hidden"
    >
      <Flex
        ref={scrollerRef}
        role="list"
        gap="15px"
        px={isDark ? "24px" : "0"}
        py={isDark ? "18px" : "4px"}
        overflowX="auto"
        scrollSnapType="x mandatory"
        scrollPaddingX={isDark ? "24px" : "0"}
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
        onScroll={updateEdges}
      >
        {React.Children.map(children, (child) => (
          <Box
            role="listitem"
            flexShrink={0}
            scrollSnapAlign="start"
            display="flex"
          >
            {child}
          </Box>
        ))}
      </Flex>
      {!edges.start && (
        <ScrollButton
          side="left"
          label={t("Offers.row.previous")}
          onClick={() => scroll(-1)}
        />
      )}
      {!edges.end && (
        <ScrollButton
          side="right"
          label={t("Offers.row.next")}
          onClick={() => scroll(1)}
        />
      )}
    </Box>
  );
}
