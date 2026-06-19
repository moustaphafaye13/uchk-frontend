// Interface représentant l'entité Formation du Backend
export interface Formation {
  id?: number;
  nomFormation: string;
  dateDebut?: string;
  dateFin?: string;
  typeFormation?: string;
  niveau?: string;
}