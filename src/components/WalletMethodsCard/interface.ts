import type { WalletHintTone } from "@/components/WalletHint";

export interface WalletMethodsCardProps {
  title: string;
  /** Destino do "Adicionar" do cabeçalho e do botão tracejado. */
  addHref: string;
  /** Texto da lista vazia. */
  emptyLabel: string;
  /** Dica no rodapé do card. */
  hint: { tone: WalletHintTone; title: string; description: string };
}
