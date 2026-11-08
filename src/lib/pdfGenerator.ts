import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FicheRecap,
  Employe,
  DemandeWithDetails,
  RankingAbsenteeism,
  DashboardStats,
} from '../types';

interface HeaderOptions {
  orgName?: string;
  docTitle: string;
  subTitle?: string;
}

function applyPdfHeader(doc: jsPDF, options: HeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const org = options.orgName || 'GROUPE RH & CONGÉS SOLUTIONS';

  // Navy banner top border
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Blue accent stripe
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 8, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(org.toUpperCase(), 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('DIRECTION DES RESSOURCES HUMAINES — SYSTÈME DE GESTION DES CONGÉS', 14, 26);

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Document généré le : ${dateStr}`, pageWidth - 14, 26, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // Document Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(options.docTitle, 14, 40);

  if (options.subTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(options.subTitle, 14, 46);
    return 52;
  }

  return 46;
}

function applyPdfFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Document officiel de gestion interne – GESTION RH CONGÉS & ABSENCES',
      14,
      pageHeight - 10
    );
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 14, pageHeight - 10, {
      align: 'right',
    });
  }
}

/**
 * 1. Fiche individuelle récapitulative des congés
 */
export function generateIndividualRecapPdf(recap: FicheRecap, orgName?: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: 'FICHE RÉCAPITULATIVE INDIVIDUELLE DES CONGÉS',
    subTitle: `Bilan officiel des droits et absences – Exercice ${recap.annee}`,
  });

  // Employee Identity card box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMATIONS AGENT', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text(`Matricule :`, 18, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recap.employe.Matricule, 45, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Nom complet :`, 18, currentY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recap.employe.Nom, 45, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Direction :`, 18, currentY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recap.employe.Direction, 45, currentY + 26);

  // Column 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Catégorie :`, 110, currentY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recap.employe.Categorie, 140, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Sexe :`, 110, currentY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(recap.employe.Sexe, 140, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Année d'embauche :`, 110, currentY + 26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${recap.employe.AnneeEmbauche}`, 140, currentY + 26);

  currentY += 40;

  // Table of leave types and balances
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TABLEAU RÉCAPITULATIF DES SOLDES DE CONGÉS', 14, currentY);

  const tableBody = recap.soldes.map((s) => [
    `${s.Libelle} (${s.CodeType})`,
    `${s.SoldeMaximum} j`,
    `${s.JoursAccordes} j`,
    `${s.JoursEnAttente} j`,
    `${s.SoldeRestant} j`,
    `${s.TauxConsommation}%`,
    s.Observation,
  ]);

  // Append total row
  tableBody.push([
    'TOTAL GÉNÉRAL',
    `${recap.totalSoldeMaximum} j`,
    `${recap.totalJoursAccordes} j`,
    `${recap.totalJoursEnAttente} j`,
    `${recap.totalSoldeRestant} j`,
    `${recap.totalSoldeMaximum > 0 ? Math.round((recap.totalJoursAccordes / recap.totalSoldeMaximum) * 100) : 0}%`,
    recap.totalSoldeRestant === 0 ? 'ALERTE ÉPUISÉ' : 'CONFORME',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [
      [
        'Type de congé',
        'Solde max.',
        'Jours accordés',
        'En attente',
        'Solde restant',
        'Consommé',
        'Statut / Obs.',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight total row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
      // Color observation column
      if (data.column.index === 6 && data.row.index < tableBody.length - 1) {
        const text = String(data.cell.raw);
        if (text === 'ACCORDÉ') data.cell.styles.textColor = [22, 163, 74];
        if (text === 'ALERTE') data.cell.styles.textColor = [220, 38, 38];
        if (text === 'SOLDE FAIBLE') data.cell.styles.textColor = [217, 119, 6];
        if (text === 'REFUSÉ') data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // History of requests for this employee
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`HISTORIQUE DÉTAILLÉ DES DEMANDES (${recap.annee})`, 14, currentY);

  const requestRows = recap.demandes.map((d) => [
    d.IdDemande,
    d.TypeLibelle || d.CodeType,
    `${d.DateDebut} au ${d.DateFin}`,
    `${d.NbJours} j`,
    d.StatutDemande,
    d.Motif,
    d.ValidePar || '—',
  ]);

  if (requestRows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Aucune demande enregistrée pour cet exercice.', 14, currentY + 6);
    currentY += 14;
  } else {
    autoTable(doc, {
      startY: currentY + 3,
      head: [['Réf. Demande', 'Type', 'Période', 'Durée', 'Statut', 'Motif', 'Validé par']],
      body: requestRows,
      theme: 'striped',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 4) {
          const val = String(data.cell.raw);
          if (val === 'Accordé') data.cell.styles.textColor = [22, 163, 74];
          if (val === 'En attente') data.cell.styles.textColor = [217, 119, 6];
          if (val === 'Refusé') data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Signature Block
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Signature de l\'agent :', 20, currentY);
  doc.text('Visa de la Direction RH / N+1 :', 120, currentY);

  doc.setDrawColor(203, 213, 225);
  doc.line(20, currentY + 16, 75, currentY + 16);
  doc.line(120, currentY + 16, 180, currentY + 16);

  applyPdfFooter(doc);
  doc.save(`Fiche_Recap_${recap.employe.Matricule}_${recap.annee}.pdf`);
}

/**
 * 2. Liste des employés
 */
export function generateEmployeesListPdf(employees: Employe[], orgName?: string) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: 'RÉPERTOIRE DU PERSONNEL & DES COLLABORATEURS',
    subTitle: `Effectif total enregistré : ${employees.length} collaborateurs`,
  });

  const rows = employees.map((e) => [
    e.Matricule,
    e.Nom,
    e.Direction,
    e.Categorie,
    e.Sexe,
    `${e.AnneeEmbauche}`,
    e.Poste || '—',
    e.Email || '—',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Matricule',
        'Nom & Prénom',
        'Direction',
        'Catégorie',
        'Sexe',
        'Embauche',
        'Fonction / Poste',
        'Email professionnel',
      ],
    ],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
  });

  applyPdfFooter(doc);
  doc.save('Liste_Employes_RH.pdf');
}

/**
 * 3. Liste des demandes de congé
 */
export function generateRequestsListPdf(
  requests: DemandeWithDetails[],
  filtersLabel?: string,
  orgName?: string
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: 'REGISTRE DES DEMANDES DE CONGÉS ET ABSENCES',
    subTitle: filtersLabel || `Total demandes : ${requests.length}`,
  });

  const rows = requests.map((d) => [
    d.IdDemande,
    d.Matricule,
    d.EmployeNom || '—',
    d.EmployeDirection || '—',
    d.TypeLibelle || d.CodeType,
    `${d.DateDebut} au ${d.DateFin}`,
    `${d.NbJours} j`,
    d.StatutDemande,
    d.ValidePar || '—',
    d.Motif,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Réf.',
        'Matricule',
        'Nom employé',
        'Direction',
        'Type congé',
        'Période demandée',
        'Durée',
        'Statut',
        'Validateur',
        'Motif / Justification',
      ],
    ],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'Accordé') data.cell.styles.textColor = [22, 163, 74];
        if (val === 'En attente') data.cell.styles.textColor = [217, 119, 6];
        if (val === 'Refusé') data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  applyPdfFooter(doc);
  doc.save('Registre_Demandes_Conges.pdf');
}

/**
 * 4. Classement par absentéisme
 */
export function generateAbsenteeismPdf(
  ranking: RankingAbsenteeism[],
  cumulJours: number,
  nbEmployes: number,
  moyenne: number,
  annee: number,
  orgName?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: 'CLASSEMENT PAR ABSENTÉISME & CONGÉS ACCORDÉS',
    subTitle: `Exercice ${annee} – Analyse hiérarchique du volume des absences`,
  });

  // KPI Strip
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Cumul jours d'absence :`, 18, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${cumulJours} jours`, 60, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Collaborateurs avec absences :`, 85, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${nbEmployes}`, 135, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Moyenne :`, 150, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${moyenne} j / emp`, 167, currentY + 11);

  currentY += 24;

  const rows = ranking.map((r) => [
    `#${r.rang}`,
    r.matricule,
    r.nom,
    r.direction,
    r.categorie,
    `${r.nbDemandesAccordees}`,
    `${r.totalJoursAbsents} j`,
    `${r.totalSoldeMaximum > 0 ? Math.round((r.totalJoursAbsents / r.totalSoldeMaximum) * 100) : 0}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Rang',
        'Matricule',
        'Nom collaborateur',
        'Direction',
        'Catégorie',
        'Demandes acc.',
        'Total jours absents',
        '% Solde annuel',
      ],
    ],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
      7: { halign: 'center' },
    },
  });

  applyPdfFooter(doc);
  doc.save(`Classement_Absenteisme_${annee}.pdf`);
}

/**
 * 5. Rapport statistique annuel et directionnel
 */
export function generateAnnualStatsPdf(
  stats: DashboardStats,
  annee: number,
  orgName?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: `RAPPORT STATISTIQUE ANNUEL DU PERSONNEL (${annee})`,
    subTitle: 'Synthèse managériale des flux de congés et indicateurs RH',
  });

  // KPI boxes
  const kpis = [
    { label: 'Effectif total', value: `${stats.totalEmployes}` },
    { label: 'Total demandes', value: `${stats.totalDemandes}` },
    { label: 'Demandes accordées', value: `${stats.demandesAccordees}` },
    { label: 'Demandes en attente', value: `${stats.demandesEnAttente}` },
    { label: 'Demandes refusées', value: `${stats.demandesRefusees}` },
    { label: 'Total jours absence', value: `${stats.totalJoursAbsence} j` },
  ];

  const boxWidth = 57;
  const boxHeight = 16;
  const gap = 5;

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 14 + col * (boxWidth + gap);
    const y = currentY + row * (boxHeight + gap);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), x + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 4, y + 12);
  });

  currentY += 2 * (boxHeight + gap) + 8;

  // Directions summary table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('RÉPARTITION PAR DIRECTION', 14, currentY);

  const dirRows = stats.demandesParDirection.map((d) => [
    d.direction,
    `${d.totalDemandes}`,
    `${d.joursAccordes} j`,
    stats.totalJoursAbsence > 0
      ? `${Math.round((d.joursAccordes / stats.totalJoursAbsence) * 100)}%`
      : '0%',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Direction', 'Nombre de demandes', 'Jours accordés', '% Absences globales']],
    body: dirRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      fontSize: 8.5,
      halign: 'center',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Leave types breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSOMMATION PAR NATURE DE CONGÉ', 14, currentY);

  const typeRows = stats.congesParType.map((t) => [
    `${t.libelle} (${t.codeType})`,
    `${t.count}`,
    `${t.jours} j`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Nature du congé', 'Demandes enregistrées', 'Total jours accordés']],
    body: typeRows,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85],
      fontSize: 8.5,
      halign: 'center',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center', fontStyle: 'bold' },
    },
  });

  applyPdfFooter(doc);
  doc.save(`Rapport_Statistique_${annee}.pdf`);
}

/**
 * 6. Rapport global des soldes de congés
 */
export function generateBalancesReportPdf(
  data: {
    employe: Employe;
    soldes: any[];
    totalAccorde: number;
    totalRestant: number;
    totalMax: number;
    hasEpuise: boolean;
  }[],
  annee: number,
  orgName?: string
) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const currentY = applyPdfHeader(doc, {
    orgName,
    docTitle: 'ÉTAT GLOBAL DES SOLDES DE CONGÉS ANNUELS',
    subTitle: `Situation générale des droits à congés – Exercice ${annee}`,
  });

  const rows = data.map((item) => {
    const caSolde = item.soldes.find((s) => s.CodeType === 'CA');
    const cmSolde = item.soldes.find((s) => s.CodeType === 'CM');

    return [
      item.employe.Matricule,
      item.employe.Nom,
      item.employe.Direction,
      item.employe.Categorie,
      `${caSolde ? caSolde.SoldeMaximum : 30} j`,
      `${caSolde ? caSolde.JoursAccordes : 0} j`,
      `${caSolde ? caSolde.SoldeRestant : 30} j`,
      `${cmSolde ? cmSolde.JoursAccordes : 0} j`,
      `${item.totalAccorde} j`,
      item.hasEpuise ? 'SOLDE ÉPUISÉ' : 'NORMAL',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        'Matricule',
        'Nom collaborateur',
        'Direction',
        'Catégorie',
        'CA Max',
        'CA Consommé',
        'CA Restant',
        'Maladie (CM)',
        'Total Accordé',
        'Alerte / Statut',
      ],
    ],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      fontSize: 8.5,
      halign: 'center',
    },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center', fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center', fontStyle: 'bold' },
      9: { halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (cellData) => {
      if (cellData.column.index === 9) {
        if (cellData.cell.raw === 'SOLDE ÉPUISÉ') {
          cellData.cell.styles.textColor = [220, 38, 38];
          cellData.cell.styles.fontStyle = 'bold';
        } else {
          cellData.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });

  applyPdfFooter(doc);
  doc.save(`Etat_Soldes_Conges_${annee}.pdf`);
}
