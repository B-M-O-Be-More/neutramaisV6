export interface ProfileHeaderProps {
  name: string;
  /** Ex.: "Dono · Russas Telecom Ltda"; vazio esconde a linha. */
  subtitle: string;
  /** Biografia; vazia esconde a linha. */
  bio: string;
  /** Abre a edição dos dados pessoais; sem ele, o botão some. */
  onEdit?: () => void;
  /** Foto escolhida no botão da câmera. */
  onPhotoSelect: (file: File) => void;
}
