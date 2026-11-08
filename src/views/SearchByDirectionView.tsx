import React, { useState, useEffect } from 'react';
import {
  Compass,
  FileDown,
  FileSpreadsheet,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import { DemandeWithDetails, TypeConge } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { generateRequestsListPdf } from '../lib/pdfGenerator';
import { exportRequestsToExcel } from '../lib/excelGenerator';

interface SearchByDirectionViewProps {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

export const SearchByDirectionView: React.FC<SearchByDirectionViewProps> = ({
  selectedYear,
  setSelectedYear,
}) => {
  const toast = useToast();
  const [direction, setDirection] = useState('Ressources Humaines');
  const [statut, setStatut] = useState('Tous');
  const [codeType, setCodeType] = useState('Tous');
  const [leaveTypes, setLeaveTypes] = useState<TypeConge[]>([]);
  const [results, setResults] = useState<DemandeWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getLeaveTypes().then(setLeaveTypes).catch(() => {});
  }, []);

  const executeSearch = async () => {
    try {
      setLoading(true);
      const data = await api.getRequests({
        direction: direction !== 'Toutes' ? direction : undefined,
        annee: selectedYear,
        statut: statut !== 'Tous' ? statut : undefined,
        codeType: codeType !== 'Tous' ? codeType : undefined,
      });
      setResults(data);
    } catch (err: any) {
      toast.error('Erreur de recherche', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, [direction, selectedYear, statut, codeType]);

  // Aggregated KPIs
  const distinctEmployees = new Set(results.map((r) => r.Matricule)).size;
  const totalDemandes = results.length;
  const totalJoursAccordes = results
    .filter((r) => r.StatutDemande === 'Accordé')
    .reduce((sum, r) => sum + r.NbJours, 0);

  const handleExportPdf = () => {
    try {
      generateRequestsListPdf(
        results,
        `Rapport Direction : ${direction} – Exercice ${selectedYear} – Statut : ${statut}`
      );
      toast.success('Rapport de direction PDF généré');
    } catch (err: any) {
      toast.error('Erreur export PDF', err.message);
    }
  };

  const handleExportExcel = () => {
    try {
      exportRequestsToExcel(results, `Direction_${direction}_${selectedYear}`);
      toast.success('Données exportées sous Excel');
    } catch (err: any) {
      toast.error('Erreur export Excel', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Recherche des Demandes par Direction</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Analyse ciblée des effectifs demandeurs et du volume de jours accordés par pôle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Multi-criteria filter form */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Direction Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Direction *
          </label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="Toutes">Toutes les directions</option>
            <option value="Ressources Humaines">Ressources Humaines</option>
            <option value="Finance & Comptabilité">Finance & Comptabilité</option>
            <option value="Systèmes d'Information">Systèmes d'Information</option>
            <option value="Commercial & Marketing">Commercial & Marketing</option>
            <option value="Opérations & Logistique">Opérations & Logistique</option>
            <option value="Direction Générale">Direction Générale</option>
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Année de référence *
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value={2025}>Exercice 2025</option>
            <option value={2026}>Exercice 2026</option>
            <option value={2027}>Exercice 2027</option>
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Statut de la demande *
          </label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Accordé">Accordé</option>
            <option value="En attente">En attente</option>
            <option value="Refusé">Refusé</option>
          </select>
        </div>

        {/* Leave Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Type de congé (Facultatif)
          </label>
          <select
            value={codeType}
            onChange={(e) => setCodeType(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="Tous">Tous les types</option>
            {leaveTypes.map((t) => (
              <option key={t.CodeType} value={t.CodeType}>
                {t.Libelle} ({t.CodeType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregated Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Effectif des Demandeurs Distincts
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {distinctEmployees} <span className="text-sm font-normal text-slate-500">agents</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Personnes concernées</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Nombre Total de Demandes
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {totalDemandes} <span className="text-sm font-normal text-slate-500">demandes</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Pour les critères sélectionnés</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Total des Jours Accordés
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {totalJoursAccordes} <span className="text-sm font-normal text-slate-500">jours</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Absences autorisées</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold whitespace-nowrap">Matricule</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Nom de l'employé</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Type de congé</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Période (Dates)</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Nombre de jours</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Statut</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucune demande trouvée pour cette direction avec les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr
                    key={r.IdDemande}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {r.Matricule}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {r.EmployeNom}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {r.TypeLibelle} <span className="font-mono text-slate-400 text-[11px]">({r.CodeType})</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {r.DateDebut} → {r.DateFin}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {r.NbJours} j
                    </td>
                    <td className="py-3 px-4">
                      {r.StatutDemande === 'Accordé' && (
                        <span className="text-emerald-600 font-semibold">Accordé</span>
                      )}
                      {r.StatutDemande === 'En attente' && (
                        <span className="text-amber-600 font-semibold">En attente</span>
                      )}
                      {r.StatutDemande === 'Refusé' && (
                        <span className="text-red-600 font-semibold">Refusé</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 italic truncate max-w-xs">
                      {r.Motif}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
