export interface KycNextStepsProps {
  /**
   * Encerra o cadastro. Chamado sozinho, depois do intervalo de leitura da tela
   * de "Conta criada" — quem decide para onde ir é o formulário (hoje, o login).
   */
  onFinish: () => void;
}
