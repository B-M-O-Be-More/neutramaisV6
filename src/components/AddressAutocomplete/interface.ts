import type { GeocodingResult } from "@/services/mapboxGeocoding.service";

import type React from "react";

export interface AddressAutocompleteProps {
  /** `id` do campo — liga o rótulo e as mensagens a ele. */
  id: string;
  label: string;
  /** Complemento cinza ao lado do rótulo (ex.: "(quando aplicável)"). */
  labelHint?: string;
  placeholder?: string;
  /**
   * Texto inicial do campo (o endereço já escolhido). Depois de montado, o
   * texto é do próprio campo — mudanças chegam por `onInputChange`/`onSelect`.
   */
  inputValue: string;
  /** Mudança digitada pelo usuário (ou campo limpo) — desfaz a escolha. */
  onInputChange: (text: string) => void;
  /** Endereço escolhido na lista. */
  onSelect: (result: GeocodingResult) => void;
  /** Mensagem de erro (já traduzida). */
  error?: string;
  /** Ações ao lado do campo, na mesma linha (ex.: botões + / −). */
  endAction?: React.ReactNode;
  /** Dica cinza abaixo do campo (some quando há aviso da busca). */
  hint?: string;
  /**
   * Lista de sugestões em portal (padrão). Dentro de um Dialog, `false`: o
   * portal fica fora da área de foco do modal.
   */
  portalled?: boolean;
}
