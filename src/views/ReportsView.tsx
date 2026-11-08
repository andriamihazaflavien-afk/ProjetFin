import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  Download,
  Printer,
  BarChart2,
  Calendar,
  Users,
  Building2,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import {
  generateAnnualStatsPdf,
  generateEmployeesListPdf,
  generateRequestsListPdf,
  generateAbsenteeismPdf,
  generateBalancesReportPdf,
} from '../lib/pdfGenerator';
import {
  exportEmployeesToExcel,
  exportRequestsToExcel,
  exportAbsenteeismToExcel,
  exportBalancesToExcel,
} from '../lib/excelGenerator';

interface ReportsViewProps {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  selectedYear,
  setSelectedYear,
}) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (reportType: string, format: 'pdf' | 'excel') => {
    try {
      setLoading(true);

      if (reportType === 'stats_annuel') {
        const stats = await api.getDashboardStats({ annee: selectedYear });
        generateAnnualStatsPdf(stats, selectedYear);
        toast.success('Rapport statistique annuel généré en PDF');
      } else if (reportType === 'employes') {
        const emps = await api.getEmployees();
        if (format === 'pdf') {
          generateEmployeesListPdf(emps);
          toast.success('Répertoire des employés généré en PDF');
        } else {
          exportEmployeesToExcel(emps);
          toast.success('Répertoire des employés exporté sous Excel');
        }
      } else if (reportType === 'demandes') {
        const reqs = await api.getRequests({ annee: selectedYear });
        if (format === 'pdf') {
          generateRequestsListPdf(reqs, `Exercice ${selectedYear}`);
          toast.success('Registre des demandes généré en PDF');
        } else {
          exportRequestsToExcel(reqs, `Demandes_${selectedYear}`);
          toast.success('Registre des demandes exporté sous Excel');
        }
      } else if (reportType === 'absenteisme') {
        const res = await api.getAbsenteeismRanking({ annee: selectedYear });
        if (format === 'pdf') {
          generateAbsenteeismPdf(
            res.ranking,
            res.totalJoursAbsenceCumules,
            res.totalEmployesConcernes,
            res.moyenneJoursParEmploye,
            selectedYear
          );
          toast.success('Classement absentéisme généré en PDF');
        } else {
          exportAbsenteeismToExcel(res.ranking, selectedYear);
          toast.success('Classement absentéisme exporté sous Excel');
        }
      } else if (reportType === 'soldes') {
        const balances = await api.getAllBalances(selectedYear);
        if (format === 'pdf') {
          generateBalancesReportPdf(balances, selectedYear);
          toast.success('État des soldes généré en PDF');
        } else {
          exportBalancesToExcel(balances, selectedYear);
          toast.success('État des soldes exporté sous Excel');
        }
      }
    } catch (err: any) {
      toast.error('Erreur lors de la génération du document', err.message);
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    {
      id: 'stats_annuel',
      title: 'Rapport Statistique Annuel',
      description:
        'Synthèse managériale complète : volumétrie globale, taux d\'accord/refus, ventilation par direction et catégories.',
      icon: <BarChart2 className="w-5 h-5 text-blue-600" />,
      hasExcel: false,
    },
    {
      id: 'absenteisme',
      title: 'Classement de l\'Absentéisme',
      description:
        'Palmarès hiérarchique décroissant des jours de congés accordés par collaborateur avec cumul et moyennes.',
      icon: <TrendingDown className="w-5 h-5 text-rose-600" />,
      hasExcel: true,
    },
    {
      id: 'soldes',
      title: 'État Global des Soldes de Congés',
      description:
        'Tableau synthétique des droits annuels, consommations, soldes restants et détection des épuisements de solde.',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      hasExcel: true,
    },
    {
      id: 'demandes',
      title: 'Registre Intégral des Demandes',
      description:
        'Listing chronologique de toutes les demandes avec dates, motifs, durées calculées, statut et signatures.',
      icon: <Calendar className="w-5 h-5 text-amber-600" />,
      hasExcel: true,
    },
    {
      id: 'employes',
      title: 'Répertoire Officiel du Personnel',
      description:
        'Base de données des employés : matricules, directions, catégories socioprofessionnelles, dates d\'embauche.',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      hasExcel: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-blue-600" />
            <span>Centre d'Édition des Rapports & Exports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Génération conforme de documents PDF numérotés et exports de données Excel
          </p>
        </div>

        {/* Year selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-mono">
          <span className="px-2 text-slate-400 font-medium font-sans">Exercice :</span>
          {[2025, 2026, 2027].map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                selectedYear === y
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl w-fit mb-4">
                {rep.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {rep.description}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleGenerate(rep.id, 'pdf')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Télécharger PDF</span>
              </button>

              {rep.hasExcel && (
                <button
                  onClick={() => handleGenerate(rep.id, 'excel')}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
