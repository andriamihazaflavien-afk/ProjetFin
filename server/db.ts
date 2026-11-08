import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Employe,
  TypeConge,
  Demande,
  DemandeWithDetails,
  Settings,
  AuditLog,
  FicheRecap,
  RankingAbsenteeism,
  DashboardStats,
  StatutDemande,
  SoldeDetails,
} from '../src/types';
import {
  calculateLeaveDays,
  computeSoldeDetails,
  checkLeaveApprovalEligibility,
} from '../src/lib/calculator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  employes: Employe[];
  typesConge: TypeConge[];
  demandes: Demande[];
  settings: Settings;
  auditLogs: AuditLog[];
}

const DEFAULT_SETTINGS: Settings = {
  NomOrganisation: 'GROUPE RH & CONGÉS SOLUTIONS',
  ModeCalculJours: 'ouvrables',
  JoursFeries: [
    '2025-01-01', '2025-04-21', '2025-05-01', '2025-05-08', '2025-05-29', '2025-06-09',
    '2025-07-14', '2025-08-15', '2025-11-01', '2025-11-11', '2025-12-25',
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-25',
    '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
  ],
  SeuilAlerteSoldeFaible: 20,
};

const DEFAULT_TYPES_CONGE: TypeConge[] = [
  {
    id: 'tc-ca',
    CodeType: 'CA',
    Libelle: 'Congé annuel',
    SoldeMaximum: 30,
    Description: 'Congé annuel payé légal (30 jours ouvrables par an)',
  },
  {
    id: 'tc-cm',
    CodeType: 'CM',
    Libelle: 'Congé maladie',
    SoldeMaximum: 10,
    Description: 'Arrêt maladie justifié par un certificat médical',
  },
  {
    id: 'tc-ce',
    CodeType: 'CE',
    Libelle: 'Congé exceptionnel',
    SoldeMaximum: 5,
    Description: 'Événements civils exceptionnels (mariage, naissance, déménagement)',
  },
  {
    id: 'tc-cf',
    CodeType: 'CF',
    Libelle: 'Congé familial',
    SoldeMaximum: 3,
    Description: 'Absence pour obligations et événements familiaux urgents',
  },
  {
    id: 'tc-cs',
    CodeType: 'CS',
    Libelle: 'Congé sans solde',
    SoldeMaximum: 15,
    Description: 'Suspension autorisée du contrat sans maintien de rémunération',
  },
];

const DEFAULT_EMPLOYES: Employe[] = [
  {
    id: 'emp-001',
    Matricule: 'M0121',
    Nom: 'Marc Durand',
    Direction: 'Ressources Humaines',
    Sexe: 'Masculin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2017,
    DateCreation: '2017-02-15T08:00:00Z',
    Poste: 'Directeur des Ressources Humaines',
    Email: 'marc.durand@entreprise.rh',
  },
  {
    id: 'emp-002',
    Matricule: 'M0084',
    Nom: 'Sophie Martin',
    Direction: 'Ressources Humaines',
    Sexe: 'Féminin',
    Categorie: 'Employé',
    AnneeEmbauche: 2020,
    DateCreation: '2020-09-01T08:00:00Z',
    Poste: 'Chargée de Paie & Administration',
    Email: 'sophie.martin@entreprise.rh',
  },
  {
    id: 'emp-003',
    Matricule: 'M0045',
    Nom: 'Jean-Pierre Dubois',
    Direction: 'Finance & Comptabilité',
    Sexe: 'Masculin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2015,
    DateCreation: '2015-04-10T08:00:00Z',
    Poste: 'Chef Comptable',
    Email: 'jp.dubois@entreprise.rh',
  },
  {
    id: 'emp-004',
    Matricule: 'M0092',
    Nom: 'Amina Benali',
    Direction: 'Finance & Comptabilité',
    Sexe: 'Féminin',
    Categorie: 'Maîtrise',
    AnneeEmbauche: 2019,
    DateCreation: '2019-11-12T08:00:00Z',
    Poste: 'Contrôleur de Gestion',
    Email: 'amina.benali@entreprise.rh',
  },
  {
    id: 'emp-005',
    Matricule: 'M0103',
    Nom: 'Alexandre Lefevre',
    Direction: 'Systèmes d\'Information',
    Sexe: 'Masculin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2018,
    DateCreation: '2018-06-20T08:00:00Z',
    Poste: 'Lead Architecte Cloud',
    Email: 'alexandre.lefevre@entreprise.rh',
  },
  {
    id: 'emp-006',
    Matricule: 'M0115',
    Nom: 'Claire Moreau',
    Direction: 'Systèmes d\'Information',
    Sexe: 'Féminin',
    Categorie: 'Maîtrise',
    AnneeEmbauche: 2021,
    DateCreation: '2021-03-01T08:00:00Z',
    Poste: 'Administratrice Réseaux & Sécurité',
    Email: 'claire.moreau@entreprise.rh',
  },
  {
    id: 'emp-007',
    Matricule: 'M0130',
    Nom: 'Thomas Bernard',
    Direction: 'Systèmes d\'Information',
    Sexe: 'Masculin',
    Categorie: 'Employé',
    AnneeEmbauche: 2022,
    DateCreation: '2022-01-15T08:00:00Z',
    Poste: 'Technicien Support Helpdesk',
    Email: 'thomas.bernard@entreprise.rh',
  },
  {
    id: 'emp-008',
    Matricule: 'M0067',
    Nom: 'Fatou Diallo',
    Direction: 'Commercial & Marketing',
    Sexe: 'Féminin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2016,
    DateCreation: '2016-08-10T08:00:00Z',
    Poste: 'Directrice Commerciale',
    Email: 'fatou.diallo@entreprise.rh',
  },
  {
    id: 'emp-009',
    Matricule: 'M0078',
    Nom: 'Lucas Lambert',
    Direction: 'Commercial & Marketing',
    Sexe: 'Masculin',
    Categorie: 'Maîtrise',
    AnneeEmbauche: 2019,
    DateCreation: '2019-05-02T08:00:00Z',
    Poste: 'Responsable Comptes Clés',
    Email: 'lucas.lambert@entreprise.rh',
  },
  {
    id: 'emp-010',
    Matricule: 'M0144',
    Nom: 'Camille Leroy',
    Direction: 'Commercial & Marketing',
    Sexe: 'Féminin',
    Categorie: 'Employé',
    AnneeEmbauche: 2023,
    DateCreation: '2023-04-18T08:00:00Z',
    Poste: 'Assistante Commerciale & ADV',
    Email: 'camille.leroy@entreprise.rh',
  },
  {
    id: 'emp-011',
    Matricule: 'M0052',
    Nom: 'David Garnier',
    Direction: 'Opérations & Logistique',
    Sexe: 'Masculin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2015,
    DateCreation: '2015-10-01T08:00:00Z',
    Poste: 'Directeur Logistique & Supply',
    Email: 'david.garnier@entreprise.rh',
  },
  {
    id: 'emp-012',
    Matricule: 'M0089',
    Nom: 'Nathalie Roux',
    Direction: 'Opérations & Logistique',
    Sexe: 'Féminin',
    Categorie: 'Maîtrise',
    AnneeEmbauche: 2020,
    DateCreation: '2020-02-17T08:00:00Z',
    Poste: 'Superviseur d\'Entrepôt',
    Email: 'nathalie.roux@entreprise.rh',
  },
  {
    id: 'emp-013',
    Matricule: 'M0156',
    Nom: 'Karim Zeroual',
    Direction: 'Opérations & Logistique',
    Sexe: 'Masculin',
    Categorie: 'Ouvrier',
    AnneeEmbauche: 2022,
    DateCreation: '2022-07-04T08:00:00Z',
    Poste: 'Conducteur de Chariot & Préparateur',
    Email: 'karim.zeroual@entreprise.rh',
  },
  {
    id: 'emp-014',
    Matricule: 'M0162',
    Nom: 'Philippe Meunier',
    Direction: 'Opérations & Logistique',
    Sexe: 'Masculin',
    Categorie: 'Ouvrier',
    AnneeEmbauche: 2023,
    DateCreation: '2023-09-12T08:00:00Z',
    Poste: 'Agent de Quai & Expédition',
    Email: 'philippe.meunier@entreprise.rh',
  },
  {
    id: 'emp-015',
    Matricule: 'M0031',
    Nom: 'Isabelle Mercier',
    Direction: 'Direction Générale',
    Sexe: 'Féminin',
    Categorie: 'Cadre',
    AnneeEmbauche: 2014,
    DateCreation: '2014-01-10T08:00:00Z',
    Poste: 'Secrétaire Générale & Juridique',
    Email: 'isabelle.mercier@entreprise.rh',
  },
];

const DEFAULT_DEMANDES: Demande[] = [
  // Marc Durand (M0121) - 2026: 15 CA accordés, 3 CM accordés, 10 CA accordés = 25 CA + 3 CM = 28 total
  {
    IdDemande: 'DEM-2026-001',
    Matricule: 'M0121',
    CodeType: 'CA',
    DateDebut: '2026-01-12',
    DateFin: '2026-01-30',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Congés d\'hiver en famille',
    DateDemande: '2025-12-10',
    StatutDemande: 'Accordé',
    Observation: 'Validé conformément au planning RH',
    ValidePar: 'Direction Générale',
    DateValidation: '2025-12-15',
  },
  {
    IdDemande: 'DEM-2026-002',
    Matricule: 'M0121',
    CodeType: 'CM',
    DateDebut: '2026-02-09',
    DateFin: '2026-02-11',
    NbJours: 3,
    Annee: 2026,
    Motif: 'Grippe saisonnière avec arrêt',
    DateDemande: '2026-02-09',
    StatutDemande: 'Accordé',
    Observation: 'Certificat médical transmis',
    ValidePar: 'Service Médical & RH',
    DateValidation: '2026-02-10',
  },
  {
    IdDemande: 'DEM-2026-003',
    Matricule: 'M0121',
    CodeType: 'CA',
    DateDebut: '2026-07-06',
    DateFin: '2026-07-17',
    NbJours: 10,
    Annee: 2026,
    Motif: 'Congés estivaux période 1',
    DateDemande: '2026-03-01',
    StatutDemande: 'Accordé',
    Observation: 'Validé en commission des congés',
    ValidePar: 'Direction Générale',
    DateValidation: '2026-03-05',
  },
  {
    IdDemande: 'DEM-2026-004',
    Matricule: 'M0121',
    CodeType: 'CE',
    DateDebut: '2026-09-14',
    DateFin: '2026-09-18',
    NbJours: 5,
    Annee: 2026,
    Motif: 'Mariage civil et familial',
    DateDemande: '2026-04-10',
    StatutDemande: 'En attente',
    Observation: 'En attente de justificatif officiel',
  },
  // Sophie Martin (M0084) - 2026: 22 jours accordés
  {
    IdDemande: 'DEM-2026-005',
    Matricule: 'M0084',
    CodeType: 'CA',
    DateDebut: '2026-02-16',
    DateFin: '2026-03-06',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Voyage personnel programmé',
    DateDemande: '2026-01-05',
    StatutDemande: 'Accordé',
    Observation: 'Remplacement assuré par Marc Durand',
    ValidePar: 'Marc Durand',
    DateValidation: '2026-01-08',
  },
  {
    IdDemande: 'DEM-2026-006',
    Matricule: 'M0084',
    CodeType: 'CM',
    DateDebut: '2026-03-23',
    DateFin: '2026-03-31',
    NbJours: 7,
    Annee: 2026,
    Motif: 'Intervention dentaire et convalescence',
    DateDemande: '2026-03-23',
    StatutDemande: 'Accordé',
    Observation: 'Certificat reçu le 24/03',
    ValidePar: 'Marc Durand',
    DateValidation: '2026-03-24',
  },
  // Alexandre Lefevre (M0103) - 2026: 20 jours CA accordés
  {
    IdDemande: 'DEM-2026-007',
    Matricule: 'M0103',
    CodeType: 'CA',
    DateDebut: '2026-04-13',
    DateFin: '2026-05-08',
    NbJours: 18,
    Annee: 2026,
    Motif: 'Congés de printemps et ponts',
    DateDemande: '2026-02-15',
    StatutDemande: 'Accordé',
    Observation: 'Astreinte couverte par Claire Moreau',
    ValidePar: 'Direction RH',
    DateValidation: '2026-02-18',
  },
  {
    IdDemande: 'DEM-2026-008',
    Matricule: 'M0103',
    CodeType: 'CA',
    DateDebut: '2026-08-03',
    DateFin: '2026-08-21',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Congés d\'août',
    DateDemande: '2026-04-01',
    StatutDemande: 'Refusé',
    Observation: 'Solde restant insuffisant (il reste 12 jours, 15 demandés)',
    ValidePar: 'Direction RH',
    DateValidation: '2026-04-03',
  },
  // Amina Benali (M0092) - 2026
  {
    IdDemande: 'DEM-2026-009',
    Matricule: 'M0092',
    CodeType: 'CA',
    DateDebut: '2026-05-18',
    DateFin: '2026-05-29',
    NbJours: 9,
    Annee: 2026,
    Motif: 'Vacances de printemps',
    DateDemande: '2026-03-10',
    StatutDemande: 'Accordé',
    Observation: 'Période clôture trimestrielle respectée',
    ValidePar: 'Jean-Pierre Dubois',
    DateValidation: '2026-03-12',
  },
  {
    IdDemande: 'DEM-2026-010',
    Matricule: 'M0092',
    CodeType: 'CF',
    DateDebut: '2026-06-08',
    DateFin: '2026-06-10',
    NbJours: 3,
    Annee: 2026,
    Motif: 'Assistance parentale urgente',
    DateDemande: '2026-06-05',
    StatutDemande: 'En attente',
    Observation: 'Demande urgente déposée',
  },
  // David Garnier (M0052) - 2026
  {
    IdDemande: 'DEM-2026-011',
    Matricule: 'M0052',
    CodeType: 'CA',
    DateDebut: '2026-06-15',
    DateFin: '2026-07-03',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Congés annuels principaux',
    DateDemande: '2026-03-20',
    StatutDemande: 'Accordé',
    Observation: 'Organisation des plannings d\'entrepôt validée',
    ValidePar: 'Marc Durand',
    DateValidation: '2026-03-22',
  },
  // Karim Zeroual (M0156) - 2026: 30 jours épuisés !
  {
    IdDemande: 'DEM-2026-012',
    Matricule: 'M0156',
    CodeType: 'CA',
    DateDebut: '2026-01-05',
    DateFin: '2026-01-23',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Repos annuel hiver',
    DateDemande: '2025-12-01',
    StatutDemande: 'Accordé',
    Observation: 'Validé',
    ValidePar: 'David Garnier',
    DateValidation: '2025-12-05',
  },
  {
    IdDemande: 'DEM-2026-013',
    Matricule: 'M0156',
    CodeType: 'CA',
    DateDebut: '2026-07-13',
    DateFin: '2026-07-31',
    NbJours: 14,
    Annee: 2026,
    Motif: 'Congés estivaux famille',
    DateDemande: '2026-02-10',
    StatutDemande: 'Accordé',
    Observation: 'Reste 1 jour de solde annuel',
    ValidePar: 'David Garnier',
    DateValidation: '2026-02-15',
  },
  {
    IdDemande: 'DEM-2026-014',
    Matricule: 'M0156',
    CodeType: 'CA',
    DateDebut: '2026-08-17',
    DateFin: '2026-08-17',
    NbJours: 1,
    Annee: 2026,
    Motif: 'Journée personnelle',
    DateDemande: '2026-03-15',
    StatutDemande: 'Accordé',
    Observation: 'ALERTE : Solde annuel épuisé (30/30 consommés)',
    ValidePar: 'David Garnier',
    DateValidation: '2026-03-18',
  },
  // Thomas Bernard (M0130) - 2026: En attente
  {
    IdDemande: 'DEM-2026-015',
    Matricule: 'M0130',
    CodeType: 'CA',
    DateDebut: '2026-09-07',
    DateFin: '2026-09-18',
    NbJours: 10,
    Annee: 2026,
    Motif: 'Vacances d\'arrière-saison',
    DateDemande: '2026-05-02',
    StatutDemande: 'En attente',
    Observation: 'En cours d\'examen par N+1',
  },
  // Fatou Diallo (M0067) - 2026
  {
    IdDemande: 'DEM-2026-016',
    Matricule: 'M0067',
    CodeType: 'CA',
    DateDebut: '2026-07-20',
    DateFin: '2026-08-07',
    NbJours: 15,
    Annee: 2026,
    Motif: 'Vacances d\'été',
    DateDemande: '2026-03-15',
    StatutDemande: 'Accordé',
    Observation: 'Validé',
    ValidePar: 'Direction Générale',
    DateValidation: '2026-03-18',
  },
  // Jean-Pierre Dubois (M0045) - 2025 History
  {
    IdDemande: 'DEM-2025-001',
    Matricule: 'M0045',
    CodeType: 'CA',
    DateDebut: '2025-08-04',
    DateFin: '2025-08-22',
    NbJours: 15,
    Annee: 2025,
    Motif: 'Fermeture annuelle et congés d\'été',
    DateDemande: '2025-05-10',
    StatutDemande: 'Accordé',
    Observation: 'Validé',
    ValidePar: 'Direction Générale',
    DateValidation: '2025-05-15',
  },
  {
    IdDemande: 'DEM-2025-002',
    Matricule: 'M0121',
    CodeType: 'CA',
    DateDebut: '2025-07-14',
    DateFin: '2025-08-01',
    NbJours: 15,
    Annee: 2025,
    Motif: 'Congés d\'été 2025',
    DateDemande: '2025-04-12',
    StatutDemande: 'Accordé',
    Observation: 'Validé',
    ValidePar: 'Direction Générale',
    DateValidation: '2025-04-15',
  },
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    this.ensureDirectory();
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = {
        employes: DEFAULT_EMPLOYES,
        typesConge: DEFAULT_TYPES_CONGE,
        demandes: DEFAULT_DEMANDES,
        settings: DEFAULT_SETTINGS,
        auditLogs: [
          {
            id: 'log-1',
            timestamp: new Date().toISOString(),
            action: 'INITIALISATION',
            auteur: 'Système',
            details: 'Initialisation de la base de données RH avec le jeu d\'essai officiel',
          },
        ],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Erreur de lecture de database.json:', err);
      return {
        employes: DEFAULT_EMPLOYES,
        typesConge: DEFAULT_TYPES_CONGE,
        demandes: DEFAULT_DEMANDES,
        settings: DEFAULT_SETTINGS,
        auditLogs: [],
      };
    }
  }

  private save() {
    this.ensureDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public resetDemoData() {
    this.data = {
      employes: JSON.parse(JSON.stringify(DEFAULT_EMPLOYES)),
      typesConge: JSON.parse(JSON.stringify(DEFAULT_TYPES_CONGE)),
      demandes: JSON.parse(JSON.stringify(DEFAULT_DEMANDES)),
      settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'RESTAURATION_DEMO',
          auteur: 'Administrateur',
          details: 'Réinitialisation complète des données de démonstration',
        },
      ],
    };
    this.save();
    return { success: true, message: 'Données de démonstration restaurées avec succès.' };
  }

  public logAction(action: string, auteur: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      auteur,
      details,
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
  }

  // --- SETTINGS ---
  public getSettings(): Settings {
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<Settings>, auteur = 'Administrateur'): Settings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.logAction('MODIFICATION_PARAMETRES', auteur, 'Mise à jour des paramètres système');
    this.save();
    return this.data.settings;
  }

  // --- EMPLOYES ---
  public getEmployes(filter?: {
    search?: string;
    direction?: string;
    sexe?: string;
    categorie?: string;
  }): Employe[] {
    let list = [...this.data.employes];

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.Matricule.toLowerCase().includes(q) ||
          e.Nom.toLowerCase().includes(q) ||
          (e.Email && e.Email.toLowerCase().includes(q))
      );
    }

    if (filter?.direction && filter.direction !== 'Toutes') {
      list = list.filter((e) => e.Direction === filter.direction);
    }

    if (filter?.sexe && filter.sexe !== 'Tous') {
      list = list.filter((e) => e.Sexe === filter.sexe);
    }

    if (filter?.categorie && filter.categorie !== 'Toutes') {
      list = list.filter((e) => e.Categorie === filter.categorie);
    }

    return list.sort((a, b) => a.Nom.localeCompare(b.Nom));
  }

  public getEmployeByMatricule(matricule: string): Employe | undefined {
    return this.data.employes.find(
      (e) => e.Matricule.toUpperCase() === matricule.toUpperCase()
    );
  }

  public getEmployeById(id: string): Employe | undefined {
    return this.data.employes.find((e) => e.id === id);
  }

  public addEmploye(empData: Omit<Employe, 'id' | 'DateCreation'>, auteur = 'Administrateur'): Employe {
    // Check if matricule already exists
    const existing = this.getEmployeByMatricule(empData.Matricule);
    if (existing) {
      throw new Error('Employé déjà enregistré');
    }

    const newEmp: Employe = {
      ...empData,
      id: `emp-${Date.now()}`,
      Matricule: empData.Matricule.trim().toUpperCase(),
      Nom: empData.Nom.trim(),
      DateCreation: new Date().toISOString(),
    };

    this.data.employes.push(newEmp);
    this.logAction(
      'AJOUT_EMPLOYE',
      auteur,
      `Création employé ${newEmp.Matricule} (${newEmp.Nom}) - ${newEmp.Direction}`
    );
    this.save();
    return newEmp;
  }

  public updateEmploye(id: string, updates: Partial<Employe>, auteur = 'Administrateur'): Employe {
    const index = this.data.employes.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error('Employé non trouvé');
    }

    const current = this.data.employes[index];

    // If changing matricule, verify uniqueness
    if (updates.Matricule && updates.Matricule.toUpperCase() !== current.Matricule.toUpperCase()) {
      const duplicate = this.getEmployeByMatricule(updates.Matricule);
      if (duplicate && duplicate.id !== id) {
        throw new Error('Employé déjà enregistré');
      }

      // Also cascade update to demands if matricule changed
      const oldMatricule = current.Matricule;
      const newMatricule = updates.Matricule.toUpperCase();
      this.data.demandes.forEach((d) => {
        if (d.Matricule === oldMatricule) {
          d.Matricule = newMatricule;
        }
      });
    }

    const updatedEmp: Employe = {
      ...current,
      ...updates,
      Matricule: (updates.Matricule || current.Matricule).trim().toUpperCase(),
    };

    this.data.employes[index] = updatedEmp;
    this.logAction(
      'MODIFICATION_EMPLOYE',
      auteur,
      `Mise à jour des informations pour ${updatedEmp.Matricule} (${updatedEmp.Nom})`
    );
    this.save();
    return updatedEmp;
  }

  public deleteEmploye(id: string, auteur = 'Administrateur'): { success: boolean; message: string } {
    const emp = this.data.employes.find((e) => e.id === id);
    if (!emp) {
      throw new Error('Employé non trouvé');
    }

    // Integrity check: An employee with leave requests cannot be deleted
    const countDemandes = this.data.demandes.filter((d) => d.Matricule === emp.Matricule).length;
    if (countDemandes > 0) {
      throw new Error(
        `Impossible de supprimer l'employé ${emp.Nom} (${emp.Matricule}) : ${countDemandes} demande(s) de congé lui sont rattachée(s). Traitez ou archivez d'abord son historique.`
      );
    }

    this.data.employes = this.data.employes.filter((e) => e.id !== id);
    this.logAction('SUPPRESSION_EMPLOYE', auteur, `Suppression de l'employé ${emp.Matricule} (${emp.Nom})`);
    this.save();
    return { success: true, message: `Employé ${emp.Nom} (${emp.Matricule}) supprimé avec succès.` };
  }

  // --- TYPES DE CONGE ---
  public getTypesConge(search?: string): TypeConge[] {
    let list = [...this.data.typesConge];
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) => t.CodeType.toLowerCase().includes(q) || t.Libelle.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getTypeCongeByCode(code: string): TypeConge | undefined {
    return this.data.typesConge.find((t) => t.CodeType.toUpperCase() === code.toUpperCase());
  }

  public addTypeConge(typeData: Omit<TypeConge, 'id'>, auteur = 'Administrateur'): TypeConge {
    const code = typeData.CodeType.trim().toUpperCase();
    if (this.getTypeCongeByCode(code)) {
      throw new Error(`Le type de congé avec le code [${code}] existe déjà.`);
    }

    const newType: TypeConge = {
      ...typeData,
      id: `tc-${Date.now()}`,
      CodeType: code,
      SoldeMaximum: Number(typeData.SoldeMaximum) || 0,
    };

    this.data.typesConge.push(newType);
    this.logAction('AJOUT_TYPE_CONGE', auteur, `Ajout du type de congé ${newType.CodeType} - ${newType.Libelle}`);
    this.save();
    return newType;
  }

  public updateTypeConge(id: string, updates: Partial<TypeConge>, auteur = 'Administrateur'): TypeConge {
    const index = this.data.typesConge.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Type de congé non trouvé');
    }

    const current = this.data.typesConge[index];
    if (updates.CodeType && updates.CodeType.toUpperCase() !== current.CodeType.toUpperCase()) {
      const code = updates.CodeType.toUpperCase();
      const existing = this.getTypeCongeByCode(code);
      if (existing && existing.id !== id) {
        throw new Error(`Le code ${code} est déjà utilisé par un autre type.`);
      }
      // cascade update to demands
      const oldCode = current.CodeType;
      this.data.demandes.forEach((d) => {
        if (d.CodeType === oldCode) {
          d.CodeType = code;
        }
      });
    }

    const updated: TypeConge = {
      ...current,
      ...updates,
      CodeType: (updates.CodeType || current.CodeType).trim().toUpperCase(),
      SoldeMaximum: updates.SoldeMaximum !== undefined ? Number(updates.SoldeMaximum) : current.SoldeMaximum,
    };

    this.data.typesConge[index] = updated;
    this.logAction(
      'MODIFICATION_TYPE_CONGE',
      auteur,
      `Mise à jour du type ${updated.CodeType} (${updated.Libelle}), solde max: ${updated.SoldeMaximum}j`
    );
    this.save();
    return updated;
  }

  public deleteTypeConge(id: string, auteur = 'Administrateur'): { success: boolean; message: string } {
    const type = this.data.typesConge.find((t) => t.id === id);
    if (!type) {
      throw new Error('Type de congé non trouvé');
    }

    const usageCount = this.data.demandes.filter((d) => d.CodeType === type.CodeType).length;
    if (usageCount > 0) {
      throw new Error(
        `Impossible de supprimer le type [${type.CodeType}] : ${usageCount} demande(s) en cours ou archivée(s) l'utilisent.`
      );
    }

    this.data.typesConge = this.data.typesConge.filter((t) => t.id !== id);
    this.logAction('SUPPRESSION_TYPE_CONGE', auteur, `Suppression du type ${type.CodeType} (${type.Libelle})`);
    this.save();
    return { success: true, message: `Type de congé ${type.Libelle} supprimé.` };
  }

  // --- DEMANDES ---
  public getDemandes(filter?: {
    matricule?: string;
    search?: string;
    direction?: string;
    annee?: number;
    codeType?: string;
    statut?: string;
  }): DemandeWithDetails[] {
    let list = this.data.demandes.map((d) => {
      const emp = this.getEmployeByMatricule(d.Matricule);
      const tc = this.getTypeCongeByCode(d.CodeType);
      return {
        ...d,
        EmployeNom: emp ? emp.Nom : 'Employé inconnu',
        EmployeDirection: emp ? emp.Direction : 'N/A',
        EmployeCategorie: emp ? emp.Categorie : 'N/A',
        TypeLibelle: tc ? tc.Libelle : d.CodeType,
      };
    });

    if (filter?.matricule) {
      list = list.filter((d) => d.Matricule.toUpperCase() === filter.matricule!.toUpperCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.Matricule.toLowerCase().includes(q) ||
          (d.EmployeNom && d.EmployeNom.toLowerCase().includes(q)) ||
          d.Motif.toLowerCase().includes(q) ||
          d.IdDemande.toLowerCase().includes(q)
      );
    }

    if (filter?.direction && filter.direction !== 'Toutes') {
      list = list.filter((d) => d.EmployeDirection === filter.direction);
    }

    if (filter?.annee) {
      list = list.filter((d) => d.Annee === Number(filter.annee));
    }

    if (filter?.codeType && filter.codeType !== 'Tous') {
      list = list.filter((d) => d.CodeType === filter.codeType);
    }

    if (filter?.statut && filter.statut !== 'Tous') {
      list = list.filter((d) => d.StatutDemande === filter.statut);
    }

    return list.sort(
      (a, b) => new Date(b.DateDemande).getTime() - new Date(a.DateDemande).getTime()
    );
  }

  public getDemandeById(id: string): DemandeWithDetails | undefined {
    const d = this.data.demandes.find((item) => item.IdDemande === id);
    if (!d) return undefined;
    const emp = this.getEmployeByMatricule(d.Matricule);
    const tc = this.getTypeCongeByCode(d.CodeType);
    return {
      ...d,
      EmployeNom: emp ? emp.Nom : 'Employé inconnu',
      EmployeDirection: emp ? emp.Direction : 'N/A',
      EmployeCategorie: emp ? emp.Categorie : 'N/A',
      TypeLibelle: tc ? tc.Libelle : d.CodeType,
    };
  }

  public createDemande(
    demandeData: Omit<Demande, 'IdDemande' | 'NbJours' | 'DateDemande' | 'StatutDemande'> & {
      StatutDemande?: StatutDemande;
    },
    auteur = 'Système'
  ): DemandeWithDetails {
    const emp = this.getEmployeByMatricule(demandeData.Matricule);
    if (!emp) {
      throw new Error(`Employé non trouvé pour le matricule [${demandeData.Matricule}]`);
    }

    const type = this.getTypeCongeByCode(demandeData.CodeType);
    if (!type) {
      throw new Error(`Type de congé non trouvé pour le code [${demandeData.CodeType}]`);
    }

    // Calculate automatically NbJours based on settings
    const nbJours = calculateLeaveDays(
      demandeData.DateDebut,
      demandeData.DateFin,
      this.data.settings.ModeCalculJours,
      this.data.settings.JoursFeries
    );

    if (nbJours <= 0) {
      throw new Error('La période sélectionnée ne comporte aucun jour ouvré ou est invalide.');
    }

    const annee = demandeData.Annee || new Date(demandeData.DateDebut).getFullYear();
    const idNum = this.data.demandes.length + 1;
    const newId = `DEM-${annee}-${String(idNum).padStart(3, '0')}`;

    const newDemande: Demande = {
      IdDemande: newId,
      Matricule: emp.Matricule,
      CodeType: type.CodeType,
      DateDebut: demandeData.DateDebut,
      DateFin: demandeData.DateFin,
      NbJours: nbJours,
      Annee: annee,
      Motif: demandeData.Motif || 'Demande de congé',
      DateDemande: new Date().toISOString().split('T')[0],
      StatutDemande: demandeData.StatutDemande || 'En attente',
      Observation: demandeData.Observation || '',
      ValidePar: demandeData.ValidePar || '',
    };

    this.data.demandes.push(newDemande);
    this.logAction(
      'CREATION_DEMANDE',
      auteur,
      `Création demande ${newDemande.IdDemande} pour ${emp.Nom} (${newDemande.NbJours}j ${type.Libelle})`
    );
    this.save();

    return this.getDemandeById(newDemande.IdDemande)!;
  }

  public updateDemande(
    id: string,
    updates: Partial<Demande>,
    auteur = 'Système'
  ): DemandeWithDetails {
    const index = this.data.demandes.findIndex((d) => d.IdDemande === id);
    if (index === -1) {
      throw new Error('Demande de congé non trouvée');
    }

    const current = this.data.demandes[index];

    // If dates changed, recalculate days
    const dateDebut = updates.DateDebut || current.DateDebut;
    const dateFin = updates.DateFin || current.DateFin;
    let nbJours = current.NbJours;

    if (updates.DateDebut || updates.DateFin) {
      nbJours = calculateLeaveDays(
        dateDebut,
        dateFin,
        this.data.settings.ModeCalculJours,
        this.data.settings.JoursFeries
      );
      if (nbJours <= 0) {
        throw new Error('La période sélectionnée ne comporte aucun jour ouvré ou est invalide.');
      }
    }

    const updated: Demande = {
      ...current,
      ...updates,
      DateDebut: dateDebut,
      DateFin: dateFin,
      NbJours: nbJours,
      Annee: updates.Annee || current.Annee || new Date(dateDebut).getFullYear(),
    };

    this.data.demandes[index] = updated;
    this.logAction(
      'MODIFICATION_DEMANDE',
      auteur,
      `Demande ${updated.IdDemande} modifiée (${updated.NbJours} jours)`
    );
    this.save();

    return this.getDemandeById(updated.IdDemande)!;
  }

  public deleteDemande(id: string, auteur = 'Système'): { success: boolean; message: string } {
    const index = this.data.demandes.findIndex((d) => d.IdDemande === id);
    if (index === -1) {
      throw new Error('Demande non trouvée');
    }

    const dem = this.data.demandes[index];
    this.data.demandes.splice(index, 1);
    this.logAction('SUPPRESSION_DEMANDE', auteur, `Suppression de la demande ${dem.IdDemande} de ${dem.Matricule}`);
    this.save();

    return { success: true, message: `Demande ${id} supprimée et soldes recalculés.` };
  }

  /**
   * Validate or reject a request with strict business rules:
   * Rule 1: If NbJours <= SoldeRestant: Approve allowed.
   * Rule 2: If NbJours > SoldeRestant: Reject or block with "Solde de congé insuffisant".
   * Rule 3: If SoldeRestant after = 0: Alert "ALERTE : Le solde de congé est épuisé".
   * Rule 4: If Solde is negative: Block approval!
   */
  public processValidation(
    idDemande: string,
    action: 'ACCORDER' | 'REFUSER',
    validePar: string,
    observation?: string
  ): {
    demande: DemandeWithDetails;
    soldeDetails: SoldeDetails;
    alertMessage?: string;
  } {
    const index = this.data.demandes.findIndex((d) => d.IdDemande === idDemande);
    if (index === -1) {
      throw new Error('Demande non trouvée');
    }

    const dem = this.data.demandes[index];
    const type = this.getTypeCongeByCode(dem.CodeType);
    if (!type) {
      throw new Error('Type de congé introuvable');
    }

    // Compute current balance before this decision (excluding this request's approval if it was not approved)
    const soldeBefore = computeSoldeDetails(
      type,
      this.data.demandes.filter((d) => d.IdDemande !== dem.IdDemande),
      dem.Matricule,
      dem.Annee,
      this.data.settings.SeuilAlerteSoldeFaible
    );

    let alertMessage: string | undefined;

    if (action === 'ACCORDER') {
      const eligibility = checkLeaveApprovalEligibility(dem.NbJours, soldeBefore.SoldeRestant);

      if (!eligibility.canApprove) {
        throw new Error(
          `Validation impossible : ${eligibility.message} (Disponible : ${soldeBefore.SoldeRestant} jours, Demandé : ${dem.NbJours} jours)`
        );
      }

      dem.StatutDemande = 'Accordé';
      dem.ValidePar = validePar;
      dem.DateValidation = new Date().toISOString().split('T')[0];
      if (observation) dem.Observation = observation;

      if (eligibility.isExhaustedAfter) {
        alertMessage = 'ALERTE : Le solde de congé est épuisé après cette validation.';
      }

      this.logAction(
        'VALIDATION_DEMANDE_ACCORDEE',
        validePar,
        `Demande ${dem.IdDemande} ACCORDÉE pour ${dem.Matricule} (${dem.NbJours}j). Solde restant: ${eligibility.soldeApres}j`
      );
    } else {
      dem.StatutDemande = 'Refusé';
      dem.ValidePar = validePar;
      dem.DateValidation = new Date().toISOString().split('T')[0];
      if (observation) dem.Observation = observation;

      this.logAction(
        'REFUS_DEMANDE',
        validePar,
        `Demande ${dem.IdDemande} REFUSÉE pour ${dem.Matricule}. Motif: ${observation || 'Non spécifié'}`
      );
    }

    this.save();

    // Recompute balance after update
    const soldeAfter = computeSoldeDetails(
      type,
      this.data.demandes,
      dem.Matricule,
      dem.Annee,
      this.data.settings.SeuilAlerteSoldeFaible
    );

    const demandeWithDetails = this.getDemandeById(dem.IdDemande)!;
    return {
      demande: demandeWithDetails,
      soldeDetails: soldeAfter,
      alertMessage,
    };
  }

  // --- SOLDE & FICHE RECAPITULATIVE ---
  public getSoldeRecapForEmployee(matricule: string, annee: number): FicheRecap {
    const emp = this.getEmployeByMatricule(matricule);
    if (!emp) {
      throw new Error('Employé non trouvé');
    }

    const soldes: SoldeDetails[] = this.data.typesConge.map((tc) =>
      computeSoldeDetails(
        tc,
        this.data.demandes,
        emp.Matricule,
        annee,
        this.data.settings.SeuilAlerteSoldeFaible
      )
    );

    const employeeRequests = this.getDemandes({ matricule: emp.Matricule, annee });

    const totalJoursAccordes = soldes.reduce((acc, s) => acc + s.JoursAccordes, 0);
    const totalJoursEnAttente = soldes.reduce((acc, s) => acc + s.JoursEnAttente, 0);
    const totalJoursRefuses = soldes.reduce((acc, s) => acc + s.JoursRefuses, 0);
    const totalSoldeMaximum = soldes.reduce((acc, s) => acc + s.SoldeMaximum, 0);
    const totalSoldeRestant = soldes.reduce((acc, s) => acc + s.SoldeRestant, 0);

    return {
      employe: emp,
      annee,
      soldes,
      demandes: employeeRequests,
      totalJoursAccordes,
      totalJoursEnAttente,
      totalJoursRefuses,
      totalSoldeMaximum,
      totalSoldeRestant,
    };
  }

  public getAllBalances(annee: number, filter?: { direction?: string; categorie?: string; search?: string }): {
    employe: Employe;
    soldes: SoldeDetails[];
    totalAccorde: number;
    totalRestant: number;
    totalMax: number;
    hasEpuise: boolean;
    hasFaible: boolean;
  }[] {
    let employees = this.getEmployes(filter);

    return employees.map((emp) => {
      const soldes = this.data.typesConge.map((tc) =>
        computeSoldeDetails(
          tc,
          this.data.demandes,
          emp.Matricule,
          annee,
          this.data.settings.SeuilAlerteSoldeFaible
        )
      );
      const totalAccorde = soldes.reduce((sum, s) => sum + s.JoursAccordes, 0);
      const totalRestant = soldes.reduce((sum, s) => sum + s.SoldeRestant, 0);
      const totalMax = soldes.reduce((sum, s) => sum + s.SoldeMaximum, 0);
      const hasEpuise = soldes.some((s) => s.SoldeMaximum > 0 && s.SoldeRestant === 0);
      const hasFaible = soldes.some((s) => s.StatutSolde === 'faible');

      return {
        employe: emp,
        soldes,
        totalAccorde,
        totalRestant,
        totalMax,
        hasEpuise,
        hasFaible,
      };
    });
  }

  // --- STATISTIQUES & TABLEAU DE BORD ---
  public getDashboardStats(filter?: { annee?: number; direction?: string; categorie?: string }): DashboardStats {
    let requests = this.getDemandes(filter);
    const employes = this.getEmployes(filter);

    const totalEmployes = employes.length;
    const totalDemandes = requests.length;

    const demandesAccordees = requests.filter((d) => d.StatutDemande === 'Accordé').length;
    const demandesEnAttente = requests.filter((d) => d.StatutDemande === 'En attente').length;
    const demandesRefusees = requests.filter((d) => d.StatutDemande === 'Refusé').length;

    // Total jours d'absence : demandes accordées uniquement
    const totalJoursAbsence = requests
      .filter((d) => d.StatutDemande === 'Accordé')
      .reduce((sum, d) => sum + d.NbJours, 0);

    // Number of employees with at least one exhausted balance in current year
    const activeYear = filter?.annee || 2026;
    let employesSoldeEpuise = 0;
    employes.forEach((emp) => {
      const soldes = this.data.typesConge.map((tc) =>
        computeSoldeDetails(
          tc,
          this.data.demandes,
          emp.Matricule,
          activeYear,
          this.data.settings.SeuilAlerteSoldeFaible
        )
      );
      if (soldes.some((s) => s.SoldeMaximum > 0 && s.SoldeRestant === 0)) {
        employesSoldeEpuise++;
      }
    });

    // Donut chart percentages formula: (statut count / total requests) * 100
    const repartitionStatut = [
      {
        statut: 'Accordé' as StatutDemande,
        count: demandesAccordees,
        pourcentage: totalDemandes > 0 ? Number(((demandesAccordees / totalDemandes) * 100).toFixed(1)) : 0,
      },
      {
        statut: 'En attente' as StatutDemande,
        count: demandesEnAttente,
        pourcentage: totalDemandes > 0 ? Number(((demandesEnAttente / totalDemandes) * 100).toFixed(1)) : 0,
      },
      {
        statut: 'Refusé' as StatutDemande,
        count: demandesRefusees,
        pourcentage: totalDemandes > 0 ? Number(((demandesRefusees / totalDemandes) * 100).toFixed(1)) : 0,
      },
    ];

    // Demandes par direction
    const directions = Array.from(new Set(this.data.employes.map((e) => e.Direction)));
    const demandesParDirection = directions.map((dir) => {
      const dirRequests = requests.filter((d) => d.EmployeDirection === dir);
      const joursAccordes = dirRequests
        .filter((d) => d.StatutDemande === 'Accordé')
        .reduce((sum, d) => sum + d.NbJours, 0);
      return {
        direction: dir,
        totalDemandes: dirRequests.length,
        joursAccordes,
      };
    });

    // Congés par type
    const congesParType = this.data.typesConge.map((tc) => {
      const typeReqs = requests.filter((d) => d.CodeType === tc.CodeType);
      const jours = typeReqs
        .filter((d) => d.StatutDemande === 'Accordé')
        .reduce((sum, d) => sum + d.NbJours, 0);
      return {
        codeType: tc.CodeType,
        libelle: tc.Libelle,
        count: typeReqs.length,
        jours,
      };
    });

    // Evolution mensuelle des demandes (1 to 12)
    const moisNoms = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ];
    const evolutionMensuelle = moisNoms.map((mois, index) => {
      const monthNum = index + 1;
      const monthReqs = requests.filter((d) => {
        const m = new Date(d.DateDebut).getMonth() + 1;
        return m === monthNum;
      });
      return {
        mois,
        moisNum: monthNum,
        accordees: monthReqs.filter((d) => d.StatutDemande === 'Accordé').length,
        enAttente: monthReqs.filter((d) => d.StatutDemande === 'En attente').length,
        refusees: monthReqs.filter((d) => d.StatutDemande === 'Refusé').length,
      };
    });

    // Jours d'absence par catégorie (Accordés)
    const categories: ('Cadre' | 'Maîtrise' | 'Employé' | 'Ouvrier')[] = [
      'Cadre',
      'Maîtrise',
      'Employé',
      'Ouvrier',
    ];
    const joursParCategorie = categories.map((cat) => {
      const jours = requests
        .filter((d) => d.EmployeCategorie === cat && d.StatutDemande === 'Accordé')
        .reduce((sum, d) => sum + d.NbJours, 0);
      return {
        categorie: cat,
        jours,
      };
    });

    // Consommation des soldes globaux
    const totalPossibleMax = totalEmployes * 30; // Annual benchmark
    const totalAnnualAccorde = requests
      .filter((d) => d.CodeType === 'CA' && d.StatutDemande === 'Accordé')
      .reduce((sum, d) => sum + d.NbJours, 0);

    const consommationSoldes = [
      {
        type: 'Congé Annuel',
        accorde: totalAnnualAccorde,
        maximum: totalPossibleMax || 1,
      },
      {
        type: 'Congé Maladie',
        accorde: requests
          .filter((d) => d.CodeType === 'CM' && d.StatutDemande === 'Accordé')
          .reduce((sum, d) => sum + d.NbJours, 0),
        maximum: totalEmployes * 10 || 1,
      },
      {
        type: 'Congé Exceptionnel',
        accorde: requests
          .filter((d) => d.CodeType === 'CE' && d.StatutDemande === 'Accordé')
          .reduce((sum, d) => sum + d.NbJours, 0),
        maximum: totalEmployes * 5 || 1,
      },
    ];

    return {
      totalEmployes,
      totalDemandes,
      demandesAccordees,
      demandesEnAttente,
      demandesRefusees,
      totalJoursAbsence,
      employesSoldeEpuise,
      repartitionStatut,
      demandesParDirection,
      congesParType,
      evolutionMensuelle,
      joursParCategorie,
      consommationSoldes,
    };
  }

  // --- CLASSEMENT PAR ABSENTEISME ---
  public getAbsenteeismRanking(filter?: {
    annee?: number;
    direction?: string;
    categorie?: string;
  }): {
    ranking: RankingAbsenteeism[];
    totalJoursAbsenceCumules: number;
    totalEmployesConcernes: number;
    moyenneJoursParEmploye: number;
  } {
    const employes = this.getEmployes(filter);
    const annee = filter?.annee || 2026;

    const rankingRaw = employes.map((emp) => {
      const approvedRequests = this.data.demandes.filter(
        (d) =>
          d.Matricule === emp.Matricule &&
          d.StatutDemande === 'Accordé' &&
          (filter?.annee ? d.Annee === Number(filter.annee) : true)
      );

      const totalJoursAbsents = approvedRequests.reduce((sum, d) => sum + d.NbJours, 0);
      const totalSoldeMaximum = this.data.typesConge.reduce((sum, t) => sum + t.SoldeMaximum, 0);

      return {
        matricule: emp.Matricule,
        nom: emp.Nom,
        direction: emp.Direction,
        categorie: emp.Categorie,
        totalJoursAbsents,
        nbDemandesAccordees: approvedRequests.length,
        totalSoldeMaximum,
      };
    });

    // Sort descending by total days absent
    rankingRaw.sort((a, b) => b.totalJoursAbsents - a.totalJoursAbsents);

    const ranking: RankingAbsenteeism[] = rankingRaw.map((item, idx) => ({
      rang: idx + 1,
      ...item,
    }));

    const totalJoursAbsenceCumules = ranking.reduce((sum, r) => sum + r.totalJoursAbsents, 0);
    const totalEmployesConcernes = ranking.filter((r) => r.totalJoursAbsents > 0).length;
    const moyenneJoursParEmploye =
      ranking.length > 0 ? Number((totalJoursAbsenceCumules / ranking.length).toFixed(1)) : 0;

    return {
      ranking,
      totalJoursAbsenceCumules,
      totalEmployesConcernes,
      moyenneJoursParEmploye,
    };
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }
}

export const db = new DatabaseService();
