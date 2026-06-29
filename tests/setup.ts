import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, vi } from "vitest";

// ---------------------------------------------------------------------------
// i18n para testes
// Inicializa o singleton do i18next SEM backend HTTP. Sem recursos carregados,
// t("Chave") devolve a própria chave — assertivas ficam determinísticas e
// independentes dos arquivos de tradução (que carregam via HTTP em runtime).
// ---------------------------------------------------------------------------
beforeAll(() => {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      lng: "pt",
      fallbackLng: "pt",
      resources: {},
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  }
});

// ---------------------------------------------------------------------------
// Polyfills do jsdom exigidos pelo Chakra UI v3 / next-themes / zag-js.
// O jsdom não implementa matchMedia, ResizeObserver nem scroll*.
// ---------------------------------------------------------------------------
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);

  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

// Garante DOM limpo entre os testes.
afterEach(() => {
  cleanup();
});
