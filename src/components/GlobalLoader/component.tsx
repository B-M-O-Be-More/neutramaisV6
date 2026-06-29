"use client";

import { Flex, Spinner } from "@chakra-ui/react";
import { useApp } from "@/contexts/AppContext";

export default function GlobalLoader() {
  const { isLoadingPages } = useApp();

  if (!isLoadingPages) return null;

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={9999}
      bg="blackAlpha.800"
      align="center"
      justify="center"
      backdropFilter="blur(8px)"
    >
      <Spinner size="xl" color="brand.500" />
    </Flex>
  );
}
