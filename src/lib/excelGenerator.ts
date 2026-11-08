import * as XLSX from 'xlsx';
import { Employe, DemandeWithDetails, RankingAbsenteeism } from '../types';

/**
 * Downloads a worksheet as .xlsx file
 */
function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export Employees list to Excel
 */
export function exportEmployeesToExcel(employees: Employe[]) {
  const data = employees.map((e) => ({
    Matricule: e.Matricule,
    'Nom & Prénom': e.Nom,
    Direction: e.Direction,
    Catégorie: e.Categorie,
    Sexe: e.Sexe,
    'Année d\'embauche': e.AnneeEmbauche,
    'Poste / Fonction': e.Poste || '',
    'Email professionnel': e.Email || '',
    'Date de création': e.DateCreation,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employés');
  downloadWorkbook(wb, `Liste_Employes_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Requests list to Excel
 */
export function exportRequestsToExcel(requests: DemandeWithDetails[], suffix = 'Demandes') {
  const data = requests.map((d) => ({
    'ID Demande': d.IdDemande,
    Matricule: d.Matricule,
    'Nom de l\'agent': d.EmployeNom || '',
    Direction: d.EmployeDirection || '',
    Catégorie: d.EmployeCategorie || '',
    'Type de congé': d.TypeLibelle || d.CodeType,
    'Code Congé': d.CodeType,
    'Date de début': d.DateDebut,
    'Date de fin': d.DateFin,
    'Nombre de jours': d.NbJours,
    Année: d.Annee,
    'Statut de la demande': d.StatutDemande,
    'Date de la demande': d.DateDemande,
    'Validé par': d.ValidePar || '',
    'Date de validation': d.DateValidation || '',
    'Motif de l\'absence': d.Motif,
    Commentaire: d.Observation || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Demandes');
  downloadWorkbook(wb, `${suffix}_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Absenteeism Ranking to Excel
 */
export function exportAbsenteeismToExcel(ranking: RankingAbsenteeism[], annee: number) {
  const data = ranking.map((r) => ({
    Rang: r.rang,
    Matricule: r.matricule,
    'Nom complet': r.nom,
    Direction: r.direction,
    Catégorie: r.categorie,
    'Demandes accordées': r.nbDemandesAccordees,
    'Total jours d\'absence': r.totalJoursAbsents,
    'Solde annuel total (j)': r.totalSoldeMaximum,
    'Taux de consommation (%)':
      r.totalSoldeMaximum > 0
        ? Math.round((r.totalJoursAbsents / r.totalSoldeMaximum) * 100)
        : 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Absentéisme ${annee}`);
  downloadWorkbook(wb, `Classement_Absenteisme_${annee}`);
}

/**
 * Export Balances to Excel
 */
export function exportBalancesToExcel(
  data: {
    employe: Employe;
    soldes: any[];
    totalAccorde: number;
    totalRestant: number;
    totalMax: number;
    hasEpuise: boolean;
  }[],
  annee: number
) {
  const flatData = data.map((item) => {
    const ca = item.soldes.find((s) => s.CodeType === 'CA');
    const cm = item.soldes.find((s) => s.CodeType === 'CM');
    const ce = item.soldes.find((s) => s.CodeType === 'CE');
    const cf = item.soldes.find((s) => s.CodeType === 'CF');
    const cs = item.soldes.find((s) => s.CodeType === 'CS');

    return {
      Matricule: item.employe.Matricule,
      Nom: item.employe.Nom,
      Direction: item.employe.Direction,
      Catégorie: item.employe.Categorie,
      'CA Max': ca?.SoldeMaximum ?? 30,
      'CA Accordé': ca?.JoursAccordes ?? 0,
      'CA Restant': ca?.SoldeRestant ?? 30,
      'Maladie Accordé': cm?.JoursAccordes ?? 0,
      'Maladie Restant': cm?.SoldeRestant ?? 10,
      'Exceptionnel Accordé': ce?.JoursAccordes ?? 0,
      'Familial Accordé': cf?.JoursAccordes ?? 0,
      'Sans Solde Accordé': cs?.JoursAccordes ?? 0,
      'Total Jours Accordés': item.totalAccorde,
      'Total Solde Restant': item.totalRestant,
      'Alerte Solde Épuisé': item.hasEpuise ? 'OUI' : 'NON',
    };
  });

  const ws = XLSX.utils.json_to_sheet(flatData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Soldes ${annee}`);
  downloadWorkbook(wb, `Synthese_Soldes_Conges_${annee}`);
}
