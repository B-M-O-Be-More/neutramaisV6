import type { ReactNode } from "react";

import type {
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderPostponement,
  ServiceOrderTechnician,
  ServiceOrderTechnicianDraft,
} from "@/types/serviceOrders";

export interface SellerServiceOrdersContextProps {
  orders: ServiceOrder[];
  /** Equipe própria do seller, para "Selecionar cadastrado". */
  technicians: ServiceOrderTechnician[];
  /** Momento da leitura, base dos prazos ("47h restantes"). */
  now: number;
  /** Demanda com ação em andamento; null quando nenhuma. */
  pendingId: string | null;
  /** Ordem e demanda pelo pedido e pelo ID da OS. */
  findItem: (
    orderId: string,
    itemId: string,
  ) => { order: ServiceOrder; item: ServiceOrderItem } | null;
  /**
   * Põe o técnico (cadastrado, pelo ID, ou novo) na demanda; com `start`,
   * já inicia a execução.
   */
  assignTechnician: (
    itemId: string,
    technician: string | ServiceOrderTechnicianDraft,
    start: boolean,
  ) => Promise<ServiceOrderItem | null>;
  /** Pendente → em execução (exige técnico). */
  startItem: (itemId: string) => Promise<ServiceOrderItem | null>;
  /** Em execução → concluída (exige todas as evidências). */
  completeItem: (itemId: string) => Promise<ServiceOrderItem | null>;
  /** Nova previsão de atendimento; reagendar consome um dos permitidos. */
  postpone: (
    itemId: string,
    postponement: ServiceOrderPostponement,
  ) => Promise<ServiceOrderItem | null>;
  /** Registra o arquivo no slot de evidência `index`. */
  registerEvidence: (
    itemId: string,
    index: number,
    file: File,
  ) => Promise<ServiceOrderItem | null>;
  /** Mensagem do seller na "Comunicação da OS". */
  sendMessage: (itemId: string, text: string) => Promise<boolean>;
}

export interface SellerServiceOrdersProviderProps {
  children: ReactNode;
}
