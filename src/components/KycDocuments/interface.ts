export interface KycDocumentsProps {
  /**
   * Id da organização devolvido pelo `POST /organizations/register`. Sem ele
   * não há como registrar documentos — a tela ainda permite seguir sem enviar.
   */
  organizationId?: string;
  /** Encerra o cadastro — quem decide para onde ir é o formulário. */
  onFinish: () => void;
}
