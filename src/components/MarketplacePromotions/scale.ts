/** Medida do Figma: 1:1 a partir de 1536px, reduzida pela variável --promo-s abaixo disso. */
export const s = (px: number) => `calc(${px}px * var(--promo-s, 1))`;
