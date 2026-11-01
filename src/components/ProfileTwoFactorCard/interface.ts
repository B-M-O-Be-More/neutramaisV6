export interface ProfileTwoFactorCardProps {
  email: string;
  /** Telefone mascarado do `/me`. */
  phone: string | null;
  /** Idioma das datas (ex.: "pt-BR"). */
  locale: string;
}
