"use client";

import React from "react";
import i18n from "@/i18n";
import {
  Language,
  LanguageContextProps,
  LanguageProviderProps,
} from "./interface";

const STORAGE_KEY = "languageSelected";

const LanguageContext = React.createContext<LanguageContextProps>({
  language: "pt",
  setLanguage: () => {},
});

/**
 * Converte o id de idioma vindo do backend (1=pt, 2=en, 3=es)
 * para o código usado pelo i18next. Mesma lógica do V5.
 */
export function verifyIdioma(idioma?: number): Language {
  if (idioma === 2) return "en";
  if (idioma === 3) return "es";
  return "pt";
}

const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Lê o idioma salvo no localStorage já na inicialização do estado (lazy init),
  // evitando chamar setState dentro de um efeito. No SSR não há window -> "pt".
  const [language, setLanguageState] = React.useState<Language>(() => {
    if (typeof window === "undefined") return "pt";
    return (localStorage.getItem(STORAGE_KEY) as Language) || "pt";
  });

  // Sincroniza o i18next (sistema externo) sempre que o idioma muda.
  React.useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const setLanguage = React.useCallback((lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export { LanguageProvider, useLanguage };
