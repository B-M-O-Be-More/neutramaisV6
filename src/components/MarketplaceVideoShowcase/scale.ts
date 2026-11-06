/** Medida do Figma: 1:1 a partir de 1536px, reduzida pela variável --vs-s abaixo disso. */
export const s = (px: number) => `calc(${px}px * var(--vs-s, 1))`;
