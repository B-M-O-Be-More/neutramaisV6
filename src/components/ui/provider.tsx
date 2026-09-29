"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { AppProvider } from "@/contexts/AppContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "./toaster";
import { system } from "@/themes/system";
import GlobalLoader from "../GlobalLoader/component";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme="light">
        <LanguageProvider>
          <AppProvider>
            <GlobalLoader />
            {children}
            <Toaster />
          </AppProvider>
        </LanguageProvider>
      </ColorModeProvider>
    </ChakraProvider>
  );
}
