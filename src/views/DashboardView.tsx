import React, { useState, useEffect } from 'react';
import {
  Users,
  FileCheck2,
  Clock,
  XCircle,
  CalendarDays,
  AlertOctagon,
  RefreshCw,
  FileDown,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { generateAnnualStatsPdf } from '../lib/pdfGenerator';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
}

const STATUT_COLORS = {
  Accordé: '#16a34a', // green-600
  'En attente': '#d97706', // amber-600
  Refusé: '#dc2626', // red-600
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  selectedYear,
  setSelectedYear,
}) => {
  const toast = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [filterCategorie, setFilterCategorie] = useState('Toutes');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats({
        annee: selectedYear,
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        categorie: filterCategorie !== 'Toutes' ? filterCategorie : undefined,
      });
      setStats(data);
    } catch (err: any) {
      toast.error('Erreur de chargement des statistiques', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedYear, filterDirection, filterCategorie]);

  const handleExportPdf = () => {
    if (!stats) return;
    try {
      generateAnnualStatsPdf(stats, selectedYear);
      toast.success('Rapport statistique PDF généré avec succès');
    } catch (err: any) {
      toast.error('Erreur lors de la génération du rapport PDF', err.message);
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats!;

  // Custom tooltips with tabular numbers
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
          <p className="font-bold text-slate-300 mb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="flex items-center justify-between gap-4">
              <span className="capitalize">{item.name} :</span>
              <span className="font-mono font-bold tabular-nums">{item.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Tableau de Bord RH & Congés
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Indicateurs consolidés, volumétrie des absences et suivi analytique
          </p>
        </div>

        {/* Global Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <span className="px-2 font-medium text-slate-500 dark:text-slate-400">Exercice :</span>
            {[2025, 2026, 2027].map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                  selectedYear === y
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="Toutes">Toutes les directions</option>
            <option value="Ressources Humaines">Ressources Humaines</option>
            <option value="Finance & Comptabilité">Finance & Comptabilité</option>
            <option value="Systèmes d'Information">Systèmes d'Information</option>
            <option value="Commercial & Marketing">Commercial & Marketing</option>
            <option value="Opérations & Logistique">Opérations & Logistique</option>
            <option value="Direction Générale">Direction Générale</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="Toutes">Toutes catégories</option>
            <option value="Cadre">Cadre</option>
            <option value="Maîtrise">Maîtrise</option>
            <option value="Employé">Employé</option>
            <option value="Ouvrier">Ouvrier</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={fetchStats}
            title="Rafraîchir les données"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Rapport PDF</span>
          </button>

          {/* New Request Button */}
          <button
            onClick={() => onNavigate('demandes')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle demande</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Employés */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Collaborateurs</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {s.totalEmployes}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Effectif actif</span>
        </div>

        {/* Total Demandes */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Demandes</span>
            <CalendarDays className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-2">
            {s.totalDemandes}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Toutes natures</span>
        </div>

        {/* Demandes Accordées */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Accordées</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
            {s.demandesAccordees}
          </p>
          <span className="text-[11px] text-emerald-600/80 block mt-0.5">Validées définitives</span>
        </div>

        {/* Demandes En Attente */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">En Attente</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-2">
            {s.demandesEnAttente}
          </p>
          <span className="text-[11px] text-amber-600/80 block mt-0.5">À arbitrer par RH</span>
        </div>

        {/* Demandes Refusées */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Refusées</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-2">
            {s.demandesRefusees}
          </p>
          <span className="text-[11px] text-red-600/80 block mt-0.5">Rejetées ou bloquées</span>
        </div>

        {/* Total Jours d'absence */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Jours d'Absence</span>
            <CalendarDays className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-2">
            {s.totalJoursAbsence} <span className="text-xs font-normal">j</span>
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Accordés uniquement</span>
        </div>

        {/* Employés Solde Épuisé */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Soldes Épuisés</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-2">
            {s.employesSoldeEpuise}
          </p>
          <span className="text-[11px] text-rose-600/80 block mt-0.5">0 j annuel restant</span>
        </div>
      </div>

      {/* Row 1: Charts - Histogram & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histogram of Demands by Status */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Histogramme des Demandes par Statut
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Volume brut des demandes selon l'état de traitement
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={s.repartitionStatut}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="statut" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Nombre de demandes">
                  {s.repartitionStatut.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUT_COLORS[entry.statut] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Donut Chart: % Répartition formula */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Répartition en Pourcentage (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formule : (Demandes statut / Total demandes) × 100
            </p>
          </div>
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={s.repartitionStatut}
                  dataKey="count"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {s.repartitionStatut.map((entry, index) => (
                    <Cell
                      key={`pie-${index}`}
                      fill={STATUT_COLORS[entry.statut] || '#3b82f6'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  formatter={(value, entry: any) => {
                    const st = s.repartitionStatut.find((x) => x.statut === value);
                    return (
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {value} : <strong className="font-mono text-slate-900 dark:text-slate-100">{st?.pourcentage || 0}%</strong>
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            {s.repartitionStatut.map((item) => (
              <div key={item.statut}>
                <span className="text-[11px] text-slate-400 block">{item.statut}</span>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {item.pourcentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Demandes par direction & Évolution mensuelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes par Direction */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Demandes & Jours par Direction
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Répartition des volumes d'absence par pôle organisationnel
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={s.demandesParDirection}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="direction"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={30} />
                <Bar
                  dataKey="totalDemandes"
                  name="Demandes"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="joursAccordes"
                  name="Jours accordés"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution mensuelle */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Évolution Mensuelle des Demandes ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flux temporel des départs et saisonnalité des absences
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={s.evolutionMensuelle}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={30} />
                <Area
                  type="monotone"
                  dataKey="accordees"
                  name="Accordées"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="enAttente"
                  name="En attente"
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Absences par Catégorie & Consommation des soldes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jours par Catégorie */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Jours d'Absence par Catégorie Professionnelle
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Total des jours accordés selon le statut socioprofessionnel
          </p>
          <div className="space-y-4">
            {s.joursParCategorie.map((item) => {
              const maxCatJours = Math.max(...s.joursParCategorie.map((x) => x.jours), 1);
              const pct = Math.round((item.jours / maxCatJours) * 100);
              return (
                <div key={item.categorie} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.categorie}
                    </span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {item.jours} jours
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consommation des Soldes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Consommation Globale des Droits aux Congés
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Ratio de jours consommés par rapport au potentiel global théorique
          </p>
          <div className="space-y-4">
            {s.consommationSoldes.map((item) => {
              const pct = Math.min(100, Math.round((item.accorde / item.maximum) * 100));
              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.type}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      <strong className="text-slate-900 dark:text-slate-100">{item.accorde} j</strong> sur {item.maximum} j ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 80 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
