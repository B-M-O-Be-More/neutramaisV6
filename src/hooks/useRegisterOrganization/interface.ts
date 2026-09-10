import type { FieldValues, UseFormSetError } from "react-hook-form";

/** Subconjunto dos valores do formulário que o cadastro consome. */
export interface RegisterFormValues {
  companyName: string;
  document: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  responsibleName: string;
}

export interface UseRegisterOrganizationOptions<T extends FieldValues> {
  /** setError do RHF para pintar erros de validação (422/409) nos campos. */
  setError: UseFormSetError<T>;
}
