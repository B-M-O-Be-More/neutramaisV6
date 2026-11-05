import type { ServiceOrderItem } from "@/types/serviceOrders";

export interface ServiceOrderEvidencesProps {
  item: ServiceOrderItem;
  /** Em execução: os slots pendentes mostram "Registrar". */
  canRegister: boolean;
  /** Slot enviando agora; null quando nenhum. */
  registeringIndex: number | null;
  /** Arquivo escolhido para o slot `index`. */
  onRegister: (index: number, file: File) => void;
}
