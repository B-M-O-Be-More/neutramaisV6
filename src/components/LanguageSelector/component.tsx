"use client";

import { NativeSelect } from "@chakra-ui/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/contexts/LanguageContext/interface";
import { LanguageSelectorProps } from "./interface";

const LanguageSelector = ({ width = "140px" }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();

  return (
    <NativeSelect.Root w={width} variant="outline">
      <NativeSelect.Field
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        <option value="pt">PT-BR</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
};

export default LanguageSelector;
