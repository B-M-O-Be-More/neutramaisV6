/**
 * Idioma para moeda e datas. O idioma ainda não existe no primeiro render
 * (i18n carrega via HTTP): até lá, e em português, usa "pt-BR".
 */
export function currencyLocale(language: string | undefined): string {
  if (!language || language.startsWith("pt")) return "pt-BR";
  return language;
}
