/**
 * Medida do Figma (nó 3300:58901) escrita na base reduzida: a partir de 1536px
 * a variável --cat-s (definida na raiz da seção) vale 1,2316 e reproduz os
 * valores do Figma 1:1; abaixo disso vale 1.
 */
export const s = (px: number) => `calc(${px}px * var(--cat-s, 1))`;
