export interface AdminKycReviewProps {
  /** `organization_id` da linha escolhida na fila. */
  organizationId: string;
  /** Veio do botão "Iniciar Revisão": inicia a revisão ao abrir. */
  autoStart?: boolean;
  /** Chamado depois de tratar o `autoStart` (ex.: limpar a query da URL). */
  onAutoStartHandled?: () => void;
}
