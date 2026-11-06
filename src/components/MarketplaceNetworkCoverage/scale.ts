/** Medida do Figma: 1:1 a partir de 1536px, reduzida pela variável --cov-s abaixo disso. */
export const s = (px: number) => `calc(${px}px * var(--cov-s, 1))`;
