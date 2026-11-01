import type { SellerRfq, SellerRfqProposalDraft } from "@/types/sellerRfqs";

export interface SellerRfqCardProps {
  rfq: SellerRfq;
  locale: string;
  /** Agora (ms), para as horas restantes do prazo. */
  now: number;
  /** Envio da proposta ou da recusa em andamento. */
  isPending: boolean;
  /** Envia a proposta (ou a próxima versão); true fecha o formulário. */
  onSendProposal: (draft: SellerRfqProposalDraft) => Promise<boolean>;
  /** Recusa com justificativa; true fecha o painel. */
  onDecline: (reason: string) => Promise<boolean>;
  /** "Ver OS" do pedido gerado. */
  onViewOrder: () => void;
}
