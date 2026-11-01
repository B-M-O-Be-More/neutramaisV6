import type { ServiceOrder, ServiceOrderItem } from "@/types/serviceOrders";

export interface ServiceOrderSidePanelProps {
  item: ServiceOrderItem;
  /** Ordem da demanda: buyer (empresa) e seller. */
  order: ServiceOrder;
  /** "Voltar à lista" (demandas da ordem). */
  backHref: string;
  /** Ação da OS em andamento: bloqueia os botões. */
  isBusy: boolean;
  /** "Iniciar Agora" (pendente, com técnico). */
  onStart: () => void;
  /** "Adicionar técnico" (pendente, sem técnico). */
  onAddTechnician: () => void;
  /** "Adiar atendimento". */
  onPostpone: () => void;
  /** "Concluir OS" (em execução, com todas as evidências). */
  onComplete: () => void;
}
