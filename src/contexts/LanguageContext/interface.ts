export type Language = "pt" | "en" | "es";

export interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export interface LanguageProviderProps {
  children: React.ReactNode;
}
