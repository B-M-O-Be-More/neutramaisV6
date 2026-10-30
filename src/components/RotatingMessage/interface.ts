import type { TextProps } from "@chakra-ui/react";

export interface RotatingMessageProps extends Omit<TextProps, "children"> {
  /** Mensagens, na ordem em que aparecem. */
  messages: string[];
  /** Tempo de cada mensagem na tela, em ms. Padrão: 3000. */
  intervalMs?: number;
  /** Duração do esmaecer entre uma mensagem e a próxima, em ms. Padrão: 300. */
  fadeMs?: number;
  /**
   * Depois da última, volta para esta (índice). Padrão: 0. Use para não
   * repetir as do começo ("Carregando...") depois das do fim ("Quase lá").
   */
  loopFrom?: number;
}
