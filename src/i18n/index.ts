"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(initReactI18next)
    .init({
      fallbackLng: "pt",
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      backend: {
        loadPath: "/locales/{{lng}}/translation.json",
      },
      ns: ["translation"],
      defaultNS: "translation",
      // Evita problemas de hidratação/SSR no App Router do Next.js.
      // (No V5/Vite isso não era necessário por ser SPA puro.)
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
