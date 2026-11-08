import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  Search,
  FileDown,
  FileSpreadsheet,
  Award,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { RankingAbsenteeism } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { generateAbsenteeismPdf } from '../lib/pdfGenerator';
import { exportAbsenteeismToExcel } from '../lib/excelGenerator';

interface AbsenteeismRankingViewProps {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  onSelectEmployeeForRecap: (matricule: string) => void;
}

export const AbsenteeismRankingView: React.FC<AbsenteeismRankingViewProps> = ({
  selectedYear,
  setSelectedYear,
  onSelectEmployeeForRecap,
}) => {
  const toast = useToast();
  const [ranking, setRanking] = useState<RankingAbsenteeism[]>([]);
  const [totalJours, setTotalJours] = useState(0);
  const [totalConcernes, setTotalConcernes] = useState(0);
  const [moyenne, setMoyenne] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [filterCategorie, setFilterCategorie] = useState('Toutes');
  const [search, setSearch] = useState('');

  const fetchRanking = async () => {
    try {
      setLoading(true);
      const res = await api.getAbsenteeismRanking({
        annee: selectedYear,
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        categorie: filterCategorie !== 'Toutes' ? filterCategorie : undefined,
      });
      setRanking(res.ranking);
      setTotalJours(res.totalJoursAbsenceCumules);
      setTotalConcernes(res.totalEmployesConcernes);
      setMoyenne(res.moyenneJoursParEmploye);
    } catch (err: any) {
      toast.error('Erreur chargement classement', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [selectedYear, filterDirection, filterCategorie]);

  const handleExportPdf = () => {
    try {
      generateAbsenteeismPdf(ranking, totalJours, totalConcernes, moyenne, selectedYear);
      toast.success('Classement absentéisme PDF généré');
    } catch (err: any) {
      toast.error('Erreur export PDF', err.message);
    }
  };

  const handleExportExcel = () => {
    try {
      exportAbsenteeismToExcel(ranking, selectedYear);
      toast.success('Classement absentéisme exporté sous Excel');
    } catch (err: any) {
      toast.error('Erreur export Excel', err.message);
    }
  };

  const filteredRanking = ranking.filter(
    (r) =>
      r.matricule.toLowerCase().includes(search.toLowerCase()) ||
      r.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <span>Classement par Absentéisme & Jours Accordés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Palmarès décroissant des durées effectives d'absence (demandes accordées uniquement)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-mono">
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

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Cumul Jours d'Absence ({selectedYear})
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {totalJours} <span className="text-sm font-normal text-slate-500">jours</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Demandes accordées uniquement</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Collaborateurs avec Absences
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {totalConcernes} <span className="text-sm font-normal text-slate-500">agents</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Ayant au moins 1 jour accordé</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Moyenne par Employé
          </span>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {moyenne} <span className="text-sm font-normal text-slate-500">j / agent</span>
          </p>
          <span className="text-[11px] text-slate-400 block mt-0.5">Taux d'absence moyen</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer par nom ou matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Toutes">Toutes les directions</option>
          <option value="Ressources Humaines">Ressources Humaines</option>
          <option value="Finance & Comptabilité">Finance & Comptabilité</option>
          <option value="Systèmes d'Information">Systèmes d'Information</option>
          <option value="Commercial & Marketing">Commercial & Marketing</option>
          <option value="Opérations & Logistique">Opérations & Logistique</option>
          <option value="Direction Générale">Direction Générale</option>
        </select>

        <select
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Toutes">Toutes les catégories</option>
          <option value="Cadre">Cadre</option>
          <option value="Maîtrise">Maîtrise</option>
          <option value="Employé">Employé</option>
          <option value="Ouvrier">Ouvrier</option>
        </select>
      </div>

      {/* Ranking Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Rang</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Matricule</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Nom complet</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Direction</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Catégorie</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Demandes accordées</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Total jours absents</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">% Consommation</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRanking.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Aucun employé trouvé.
                  </td>
                </tr>
              ) : (
                filteredRanking.map((item) => (
                  <tr
                    key={item.matricule}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold font-mono text-xs ${
                          item.rang === 1
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : item.rang === 2
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            : item.rang === 3
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.rang}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.matricule}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.nom}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.direction}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {item.categorie}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {item.nbDemandesAccordees}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-red-600 dark:text-red-400 text-sm">
                      {item.totalJoursAbsents} j
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {item.totalSoldeMaximum > 0
                        ? Math.round((item.totalJoursAbsents / item.totalSoldeMaximum) * 100)
                        : 0}
                      %
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectEmployeeForRecap(item.matricule)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      >
                        Voir fiche
                      </button>
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
