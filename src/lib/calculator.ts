import { ModeCalculJours, SoldeDetails, StatutSolde, TypeConge, Demande } from '../types';

/**
 * Parses date string YYYY-MM-DD to Date object in UTC
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates number of leave days between DateDebut and DateFin according to mode and holidays
 */
export function calculateLeaveDays(
  dateDebut: string,
  dateFin: string,
  mode: ModeCalculJours = 'ouvrables',
  joursFeries: string[] = []
): number {
  if (!dateDebut || !dateFin) return 0;

  const start = parseDate(dateDebut);
  const end = parseDate(dateFin);

  if (start.getTime() > end.getTime()) {
    return 0;
  }

  const holidaySet = new Set(joursFeries);
  let count = 0;
  const curr = new Date(start.getTime());

  while (curr.getTime() <= end.getTime()) {
    const dayOfWeek = curr.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dateStr = formatDate(curr);
    const isHoliday = holidaySet.has(dateStr);

    if (mode === 'calendaires') {
      count++;
    } else if (mode === 'ouvrables') {
      // Monday to Friday and not a holiday
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && !isHoliday) {
        count++;
      }
    } else if (mode === 'ouvres') {
      // Monday to Saturday and not a holiday
      if (dayOfWeek >= 1 && dayOfWeek <= 6 && !isHoliday) {
        count++;
      }
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return count;
}

/**
 * Computes leave balance details for a specific leave type and employee
 */
export function computeSoldeDetails(
  typeConge: TypeConge,
  demandes: Demande[],
  matricule: string,
  annee: number,
  seuilSoldeFaiblePercent: number = 20
): SoldeDetails {
  const relevantRequests = demandes.filter(
    (d) => d.Matricule === matricule && d.CodeType === typeConge.CodeType && d.Annee === annee
  );

  const joursAccordes = relevantRequests
    .filter((d) => d.StatutDemande === 'Accordé')
    .reduce((sum, d) => sum + (d.NbJours || 0), 0);

  const joursEnAttente = relevantRequests
    .filter((d) => d.StatutDemande === 'En attente')
    .reduce((sum, d) => sum + (d.NbJours || 0), 0);

  const joursRefuses = relevantRequests
    .filter((d) => d.StatutDemande === 'Refusé')
    .reduce((sum, d) => sum + (d.NbJours || 0), 0);

  const soldeRestant = typeConge.SoldeMaximum - joursAccordes;
  const tauxConsommation =
    typeConge.SoldeMaximum > 0
      ? Math.min(100, Math.round((joursAccordes / typeConge.SoldeMaximum) * 100))
      : 0;

  let statutSolde: StatutSolde = 'normal';
  let observation = 'ACCORDÉ';

  if (soldeRestant < 0) {
    statutSolde = 'depasse';
    observation = 'REFUSÉ';
  } else if (soldeRestant === 0) {
    statutSolde = 'epuise';
    observation = 'ALERTE';
  } else {
    const ratio = typeConge.SoldeMaximum > 0 ? (soldeRestant / typeConge.SoldeMaximum) * 100 : 100;
    if (ratio <= seuilSoldeFaiblePercent) {
      statutSolde = 'faible';
      observation = 'SOLDE FAIBLE';
    } else {
      statutSolde = 'normal';
      observation = 'ACCORDÉ';
    }
  }

  return {
    CodeType: typeConge.CodeType,
    Libelle: typeConge.Libelle,
    SoldeMaximum: typeConge.SoldeMaximum,
    JoursAccordes: joursAccordes,
    JoursEnAttente: joursEnAttente,
    JoursRefuses: joursRefuses,
    SoldeRestant: soldeRestant,
    TauxConsommation: tauxConsommation,
    StatutSolde: statutSolde,
    Observation: observation,
  };
}

/**
 * Validates whether a leave request can be approved according to balance rules
 */
export function checkLeaveApprovalEligibility(
  nbJoursDemandes: number,
  soldeRestantActuel: number
): {
  canApprove: boolean;
  isExhaustedAfter: boolean;
  isInsufficient: boolean;
  soldeApres: number;
  message: string;
} {
  const soldeApres = soldeRestantActuel - nbJoursDemandes;

  if (nbJoursDemandes > soldeRestantActuel || soldeApres < 0) {
    return {
      canApprove: false,
      isExhaustedAfter: false,
      isInsufficient: true,
      soldeApres,
      message: 'Solde de congé insuffisant',
    };
  }

  if (soldeApres === 0) {
    return {
      canApprove: true,
      isExhaustedAfter: true,
      isInsufficient: false,
      soldeApres: 0,
      message: 'ALERTE : Le solde de congé est épuisé après cette validation',
    };
  }

  return {
    canApprove: true,
    isExhaustedAfter: false,
    isInsufficient: false,
    soldeApres,
    message: 'Solde suffisant pour validation',
  };
}
