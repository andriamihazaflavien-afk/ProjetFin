import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  FileDown,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  User,
} from 'lucide-react';
import { FicheRecap, Employe } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { generateIndividualRecapPdf } from '../lib/pdfGenerator';

interface IndividualRecapViewProps {
  initialMatricule?: string;
  selectedYear: number;
}

export const IndividualRecapView: React.FC<IndividualRecapViewProps> = ({
  initialMatricule = 'M0121',
  selectedYear,
}) => {
  const toast = useToast();
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [selectedMatricule, setSelectedMatricule] = useState(initialMatricule);
  const [annee, setAnnee] = useState(selectedYear);
  const [recap, setRecap] = useState<FicheRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchEmployeeText, setSearchEmployeeText] = useState('');

  // Load employee list
  useEffect(() => {
    api
      .getEmployees()
      .then((emps) => {
        setEmployees(emps);
        if (!selectedMatricule && emps.length > 0) {
          setSelectedMatricule(emps[0].Matricule);
        }
      })
      .catch((e) => toast.error('Erreur chargement employés', e.message));
  }, []);

  // Update selectedMatricule if initialMatricule changes
  useEffect(() => {
    if (initialMatricule) {
      setSelectedMatricule(initialMatricule);
    }
  }, [initialMatricule]);

  // Fetch recap
  const fetchRecap = async () => {
    if (!selectedMatricule) return;
    try {
      setLoading(true);
      const data = await api.getIndividualRecap(selectedMatricule, annee);
      setRecap(data);
    } catch (err: any) {
      toast.error('Erreur de chargement de la fiche récapitulative', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
  }, [selectedMatricule, annee]);

  const handleDownloadPdf = () => {
    if (!recap) return;
    try {
      generateIndividualRecapPdf(recap);
      toast.success('Fiche récapitulative PDF téléchargée');
    } catch (err: any) {
      toast.error('Erreur lors de la génération du PDF', err.message);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.Matricule.toLowerCase().includes(searchEmployeeText.toLowerCase()) ||
      e.Nom.toLowerCase().includes(searchEmployeeText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Fiche Récapitulative Individuelle des Congés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Document officiel des droits, consommations et observations automatiques par collaborateur
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-mono">
            {[2025, 2026, 2027].map((y) => (
              <button
                key={y}
                onClick={() => setAnnee(y)}
                className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                  annee === y
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Download PDF button */}
          <button
            onClick={handleDownloadPdf}
            disabled={!recap}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Télécharger Fiche PDF</span>
          </button>
        </div>
      </div>

      {/* Employee Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          <User className="w-4 h-4 text-blue-600" />
          <span>Sélectionner l'agent :</span>
        </div>

        <div className="relative flex-1 w-full">
          <select
            value={selectedMatricule}
            onChange={(e) => setSelectedMatricule(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.Matricule}>
                {emp.Matricule} — {emp.Nom} ({emp.Direction} · {emp.Categorie})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recap Document Sheet View */}
      {recap && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header of official sheet */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                DIRECTION DES RESSOURCES HUMAINES
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                GESTION RH – FICHE RÉCAPITULATIVE DES CONGÉS
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exercice comptable et statutaire : <strong className="font-mono text-slate-900 dark:text-slate-100">{recap.annee}</strong>
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono">
              Réf. Dossier : {recap.employe.Matricule}-{recap.annee}
            </div>
          </div>

          {/* Employee Info Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Matricule</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                {recap.employe.Matricule}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Nom complet</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {recap.employe.Nom}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Direction</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {recap.employe.Direction}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase">Catégorie</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {recap.employe.Categorie} ({recap.employe.Sexe})
              </span>
            </div>
          </div>

          {/* Table of Balances */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Tableau des droits et soldes par nature de congé
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4">Type de congé</th>
                    <th className="py-3 px-4 text-center">Solde maximum</th>
                    <th className="py-3 px-4 text-center">Jours accordés</th>
                    <th className="py-3 px-4 text-center">En attente</th>
                    <th className="py-3 px-4 text-center">Solde restant</th>
                    <th className="py-3 px-4 text-center">Consommation</th>
                    <th className="py-3 px-4 text-center">Observation automatique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recap.soldes.map((s) => (
                    <tr
                      key={s.CodeType}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {s.Libelle} <span className="font-mono text-slate-400 font-normal">({s.CodeType})</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {s.SoldeMaximum} j
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {s.JoursAccordes} j
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        {s.JoursEnAttente} j
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400">
                        {s.SoldeRestant} j
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {s.TauxConsommation}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.Observation === 'ACCORDÉ' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACCORDÉ</span>
                          </span>
                        )}
                        {s.Observation === 'ALERTE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200">
                            <AlertOctagon className="w-3 h-3" />
                            <span>ALERTE</span>
                          </span>
                        )}
                        {s.Observation === 'SOLDE FAIBLE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>SOLDE FAIBLE</span>
                          </span>
                        )}
                        {s.Observation === 'REFUSÉ' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>REFUSÉ</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-3 px-4 text-slate-900 dark:text-slate-100">
                      TOTAL CUMULÉ
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {recap.totalSoldeMaximum} j
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                      {recap.totalJoursAccordes} j
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {recap.totalJoursEnAttente} j
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-blue-600 dark:text-blue-400">
                      {recap.totalSoldeRestant} j
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums">
                      {recap.totalSoldeMaximum > 0
                        ? Math.round((recap.totalJoursAccordes / recap.totalSoldeMaximum) * 100)
                        : 0}
                      %
                    </td>
                    <td className="py-3 px-4 text-center text-[11px] text-slate-500 font-normal">
                      Synthèse générale
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                Total Jours Accordés
              </span>
              <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {recap.totalJoursAccordes} j
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold block">
                Total Jours en Attente
              </span>
              <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300">
                {recap.totalJoursEnAttente} j
              </span>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 text-center">
              <span className="text-[11px] text-red-700 dark:text-red-300 font-semibold block">
                Total Jours Refusés
              </span>
              <span className="text-xl font-bold font-mono text-red-700 dark:text-red-300">
                {recap.totalJoursRefuses} j
              </span>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold block">
                Solde Restant Global
              </span>
              <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300">
                {recap.totalSoldeRestant} j
              </span>
            </div>
          </div>

          {/* Historical detailed requests */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Détail des demandes de l'agent ({recap.annee})
            </h3>
            {recap.demandes.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune demande enregistrée pour cet exercice.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-3">Réf.</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Période</th>
                      <th className="py-2.5 px-3 text-center">Durée</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Motif</th>
                      <th className="py-2.5 px-3">Validateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recap.demandes.map((d) => (
                      <tr key={d.IdDemande}>
                        <td className="py-2.5 px-3 font-mono font-bold">{d.IdDemande}</td>
                        <td className="py-2.5 px-3">{d.TypeLibelle}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {d.DateDebut} → {d.DateFin}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {d.NbJours} j
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {d.StatutDemande === 'Accordé' && (
                            <span className="text-emerald-600">Accordé</span>
                          )}
                          {d.StatutDemande === 'En attente' && (
                            <span className="text-amber-600">En attente</span>
                          )}
                          {d.StatutDemande === 'Refusé' && (
                            <span className="text-red-600">Refusé</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 italic">
                          {d.Motif}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{d.ValidePar || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signature Zone */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Signature de l'employé :
              </p>
              <div className="mt-8 border-b border-dashed border-slate-300 dark:border-slate-700 w-48" />
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Visa de la Direction des Ressources Humaines :
              </p>
              <div className="mt-8 border-b border-dashed border-slate-300 dark:border-slate-700 w-48" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
