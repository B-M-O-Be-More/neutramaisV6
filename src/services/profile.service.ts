// Ações do Meu Perfil que ainda não têm rota na identity-api: editar os dados
// pessoais (nome, telefone, cargo, bio, foto), alterar a senha com a sessão
// aberta, listar e revogar sessões e guardar as preferências (notificação,
// venda automática e moeda). O `openapi.yaml` da identity-api descreve
// `PATCH /me` e `/me/sessions`, mas o código não os implementa.
//
// As telas estão prontas e chamam estas funções; até as rotas existirem, elas
// recusam com `ProfileFeatureUnavailableError` — nada é alterado.

export interface PersonalDataInput {
  displayName: string;
  phone: string;
  jobTitle: string;
  bio: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ProfilePreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    orders: boolean;
    rfq: boolean;
    marketing: boolean;
  };
  autoSale: boolean;
  currency: string;
}

/** O backend ainda não oferece esta ação do perfil. */
export class ProfileFeatureUnavailableError extends Error {
  constructor() {
    super("Profile endpoint not available");
    this.name = "ProfileFeatureUnavailableError";
  }
}

const unavailable = async (...input: unknown[]): Promise<never> => {
  void input;
  throw new ProfileFeatureUnavailableError();
};

export const profileService = {
  updatePersonalData: (input: PersonalDataInput): Promise<void> =>
    unavailable(input),
  uploadPhoto: (file: File): Promise<void> => unavailable(file),
  changePassword: (input: ChangePasswordInput): Promise<void> =>
    unavailable(input),
  revokeOtherSessions: (): Promise<void> => unavailable(),
  savePreferences: (preferences: ProfilePreferences): Promise<void> =>
    unavailable(preferences),
};
