import type { ContractSignAction } from "@/functions/contractFormat";

export interface UseContractActionsParams {
  /** Relê o contrato depois de pedir a assinatura. */
  onChanged: () => void;
}

/** Props de ação que o card e o detalhe recebem. */
export interface ContractActionHandlers {
  /** O que o usuário pode fazer na assinatura deste contrato. */
  signAction: ContractSignAction;
  isSigning: boolean;
  isDownloading: boolean;
  /** Há PDF (o pedido não foi cancelado antes do contrato). */
  canDownload: boolean;
  /** Pede o link da Autentique e o abre em nova aba. */
  onSign: () => void;
  /** Baixa o PDF do contrato. */
  onDownload: () => void;
}
