export type Sexe = 'Masculin' | 'Féminin';
export type Categorie = 'Cadre' | 'Maîtrise' | 'Employé' | 'Ouvrier';
export type StatutDemande = 'En attente' | 'Accordé' | 'Refusé';
export type ModeCalculJours = 'ouvrables' | 'ouvres' | 'calendaires';
export type UserRole = 'ADMINISTRATEUR' | 'RESPONSABLE_RH' | 'EMPLOYE';

export interface Employe {
  id: string;
  Matricule: string;
  Nom: string;
  Direction: string;
  Sexe: Sexe;
  Categorie: Categorie;
  AnneeEmbauche: number;
  DateCreation: string;
  Poste?: string;
  Email?: string;
}

export interface TypeConge {
  id: string;
  CodeType: string;
  Libelle: string;
  SoldeMaximum: number;
  Description?: string;
}

export interface Demande {
  IdDemande: string;
  Matricule: string;
  CodeType: string;
  DateDebut: string;
  DateFin: string;
  NbJours: number;
  Annee: number;
  Motif: string;
  DateDemande: string;
  StatutDemande: StatutDemande;
  Observation?: string;
  ValidePar?: string;
  DateValidation?: string;
}

export interface DemandeWithDetails extends Demande {
  EmployeNom?: string;
  EmployeDirection?: string;
  EmployeCategorie?: string;
  TypeLibelle?: string;
}

export type StatutSolde = 'normal' | 'faible' | 'epuise' | 'depasse';

export interface SoldeDetails {
  CodeType: string;
  Libelle: string;
  SoldeMaximum: number;
  JoursAccordes: number;
  JoursEnAttente: number;
  JoursRefuses: number;
  SoldeRestant: number;
  TauxConsommation: number;
  StatutSolde: StatutSolde;
  Observation: string;
}

export interface FicheRecap {
  employe: Employe;
  annee: number;
  soldes: SoldeDetails[];
  demandes: DemandeWithDetails[];
  totalJoursAccordes: number;
  totalJoursEnAttente: number;
  totalJoursRefuses: number;
  totalSoldeMaximum: number;
  totalSoldeRestant: number;
}

export interface RankingAbsenteeism {
  rang: number;
  matricule: string;
  nom: string;
  direction: string;
  categorie: Categorie;
  totalJoursAbsents: number;
  nbDemandesAccordees: number;
  totalSoldeMaximum: number;
}

export interface Settings {
  NomOrganisation: string;
  ModeCalculJours: ModeCalculJours;
  JoursFeries: string[];
  SeuilAlerteSoldeFaible: number; // percentage, e.g. 20
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  auteur: string;
  details: string;
}

export interface DashboardStats {
  totalEmployes: number;
  totalDemandes: number;
  demandesAccordees: number;
  demandesEnAttente: number;
  demandesRefusees: number;
  totalJoursAbsence: number;
  employesSoldeEpuise: number;
  repartitionStatut: {
    statut: StatutDemande;
    count: number;
    pourcentage: number;
  }[];
  demandesParDirection: {
    direction: string;
    totalDemandes: number;
    joursAccordes: number;
  }[];
  congesParType: {
    codeType: string;
    libelle: string;
    count: number;
    jours: number;
  }[];
  evolutionMensuelle: {
    mois: string;
    moisNum: number;
    accordees: number;
    enAttente: number;
    refusees: number;
  }[];
  joursParCategorie: {
    categorie: Categorie;
    jours: number;
  }[];
  consommationSoldes: {
    type: string;
    accorde: number;
    maximum: number;
  }[];
}
