"use client";

import { Stack } from "@chakra-ui/react";
import React from "react";
import { MainLayoutProps } from "./interface";

function MainLayout({ children }: MainLayoutProps) {
  return (
    <Stack position="relative" w="full" minH="100dvh" bg="bg.page">
      <Stack position="relative" zIndex={1} w="full" flex={1}>
        {children}
      </Stack>
    </Stack>
  );
}

export { MainLayout };
