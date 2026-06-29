export type RegisterType = "seller" | "buyer";

export interface FormRegisterProps {
  /** Tipo pré-selecionado. Se omitido, exibe o card de seleção. */
  typeRegister?: RegisterType;
}
