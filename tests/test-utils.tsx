import { ChakraProvider } from "@chakra-ui/react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

import { ColorModeProvider } from "@/components/ui/color-mode";
import { system } from "@/themes/system";

/**
 * Provider mínimo para testes de componente: tema Chakra + color mode.
 * Não inclui contextos de negócio (Auth/App) nem GlobalLoader/Toaster — os
 * componentes de feature recebem dados via props ou hooks isolados.
 */
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme="dark">{children}</ColorModeProvider>
    </ChakraProvider>
  );
}

/** render() do Testing Library já embrulhado nos providers do app. */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

// Re-exporta a API do Testing Library para um import único nos testes.
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
