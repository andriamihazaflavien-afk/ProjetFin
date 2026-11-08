import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  FileDown,
  FileSpreadsheet,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { generateBalancesReportPdf } from '../lib/pdfGenerator';
import { exportBalancesToExcel } from '../lib/excelGenerator';

interface BalancesViewProps {
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  onSelectEmployeeForRecap: (matricule: string) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  selectedYear,
  setSelectedYear,
  onSelectEmployeeForRecap,
}) => {
  const toast = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [filterCategorie, setFilterCategorie] = useState('Toutes');
  const [filterSoldeStatut, setFilterSoldeStatut] = useState<'Tous' | 'epuise' | 'faible' | 'normal'>('Tous');

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await api.getAllBalances(selectedYear, {
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        categorie: filterCategorie !== 'Toutes' ? filterCategorie : undefined,
        search,
      });
      setData(res);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des soldes', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [selectedYear, filterDirection, filterCategorie, search]);

  const filteredData = data.filter((item) => {
    if (filterSoldeStatut === 'epuise') return item.hasEpuise;
    if (filterSoldeStatut === 'faible') return item.hasFaible && !item.hasEpuise;
    if (filterSoldeStatut === 'normal') return !item.hasEpuise && !item.hasFaible;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Synthèse des Soldes de Congés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des droits acquis, jours consommés, soldes restants et alertes d'épuisement
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
            onClick={() => generateBalancesReportPdf(data, selectedYear)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportBalancesToExcel(data, selectedYear)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par matricule ou nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Direction Filter */}
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

        {/* Categorie Filter */}
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

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterSoldeStatut('Tous')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterSoldeStatut === 'Tous'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tous ({data.length})
          </button>
          <button
            onClick={() => setFilterSoldeStatut('faible')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterSoldeStatut === 'faible'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            Faible ({data.filter((x) => x.hasFaible && !x.hasEpuise).length})
          </button>
          <button
            onClick={() => setFilterSoldeStatut('epuise')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterSoldeStatut === 'epuise'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-600 hover:text-red-700'
            }`}
          >
            Épuisé ({data.filter((x) => x.hasEpuise).length})
          </button>
        </div>
      </div>

      {/* Main Balances Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold whitespace-nowrap">Collaborateur</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Direction</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Congé Annuel (CA)</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Maladie (CM)</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Exceptionnel (CE)</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Total Accordé</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Solde Restant Global</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Alerte Solde</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Aucun employé ne correspond aux critères de filtre.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const ca = item.soldes.find((s: any) => s.CodeType === 'CA');
                  const cm = item.soldes.find((s: any) => s.CodeType === 'CM');
                  const ce = item.soldes.find((s: any) => s.CodeType === 'CE');

                  return (
                    <tr
                      key={item.employe.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div>
                          <span>{item.employe.Nom}</span>
                          <span className="block font-mono text-[11px] font-normal text-slate-400">
                            {item.employe.Matricule} · {item.employe.Categorie}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.employe.Direction}
                      </td>

                      {/* CA Balance */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono tabular-nums">
                          <strong className="text-slate-900 dark:text-slate-100">
                            {ca ? ca.SoldeRestant : 30}j
                          </strong>
                          <span className="text-slate-400 text-[11px] block">
                            consommé : {ca ? ca.JoursAccordes : 0}j / {ca ? ca.SoldeMaximum : 30}j
                          </span>
                        </div>
                      </td>

                      {/* CM Balance */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono tabular-nums">
                          <strong className="text-slate-800 dark:text-slate-200">
                            {cm ? cm.SoldeRestant : 10}j
                          </strong>
                          <span className="text-slate-400 text-[11px] block">
                            consommé : {cm ? cm.JoursAccordes : 0}j
                          </span>
                        </div>
                      </td>

                      {/* CE Balance */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono tabular-nums">
                          <strong className="text-slate-800 dark:text-slate-200">
                            {ce ? ce.SoldeRestant : 5}j
                          </strong>
                          <span className="text-slate-400 text-[11px] block">
                            consommé : {ce ? ce.JoursAccordes : 0}j
                          </span>
                        </div>
                      </td>

                      {/* Total Accordé */}
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {item.totalAccorde} j
                      </td>

                      {/* Total Restant */}
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400">
                        {item.totalRestant} j
                      </td>

                      {/* Alerte Solde */}
                      <td className="py-3 px-4 text-center">
                        {item.hasEpuise ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <AlertOctagon className="w-3 h-3" />
                            <span>Solde Épuisé</span>
                          </span>
                        ) : item.hasFaible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Solde Faible</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Normal</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectEmployeeForRecap(item.employe.Matricule)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors ml-auto"
                        >
                          <span>Fiche</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
