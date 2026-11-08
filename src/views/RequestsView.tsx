import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { DemandeWithDetails, Employe, TypeConge, UserRole, Settings } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { calculateLeaveDays, computeSoldeDetails } from '../lib/calculator';
import { generateRequestsListPdf } from '../lib/pdfGenerator';
import { exportRequestsToExcel } from '../lib/excelGenerator';

interface RequestsViewProps {
  currentRole: UserRole;
  currentEmployeeMatricule?: string;
  selectedYear: number;
}

const ITEMS_PER_PAGE = 8;

export const RequestsView: React.FC<RequestsViewProps> = ({
  currentRole,
  currentEmployeeMatricule,
  selectedYear,
}) => {
  const toast = useToast();
  const [requests, setRequests] = useState<DemandeWithDetails[]>([]);
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<TypeConge[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [filterYear, setFilterYear] = useState<number>(selectedYear);
  const [filterCodeType, setFilterCodeType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<DemandeWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DemandeWithDetails | null>(null);

  // Form State
  const [formMatricule, setFormMatricule] = useState('');
  const [formCodeType, setFormCodeType] = useState('CA');
  const [formDateDebut, setFormDateDebut] = useState('');
  const [formDateFin, setFormDateFin] = useState('');
  const [formAnnee, setFormAnnee] = useState(selectedYear);
  const [formMotif, setFormMotif] = useState('');
  const [formObservation, setFormObservation] = useState('');
  const [formCalculatedDays, setFormCalculatedDays] = useState(0);
  const [formError, setFormError] = useState('');
  const [formWarning, setFormWarning] = useState('');

  const isEmployeeRole = currentRole === 'EMPLOYE';
  const canDelete = currentRole === 'ADMINISTRATEUR' || currentRole === 'RESPONSABLE_RH';

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [emps, types, sett] = await Promise.all([
        api.getEmployees(),
        api.getLeaveTypes(),
        api.getSettings(),
      ]);
      setEmployees(emps);
      setLeaveTypes(types);
      setSettings(sett);
    } catch (err: any) {
      toast.error('Erreur de chargement initial', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.getRequests({
        matricule: isEmployeeRole ? currentEmployeeMatricule : undefined,
        search,
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        annee: filterYear !== 0 ? filterYear : undefined,
        codeType: filterCodeType !== 'Tous' ? filterCodeType : undefined,
        statut: filterStatut !== 'Tous' ? filterStatut : undefined,
      });
      setRequests(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des demandes', err.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [search, filterDirection, filterYear, filterCodeType, filterStatut, currentEmployeeMatricule, isEmployeeRole]);

  // Selected Employee in Form
  const selectedEmp = employees.find(
    (e) => e.Matricule.toUpperCase() === formMatricule.toUpperCase()
  );

  // Selected Leave Type in Form
  const selectedType = leaveTypes.find(
    (t) => t.CodeType.toUpperCase() === formCodeType.toUpperCase()
  );

  // Recalculate days when dates change
  useEffect(() => {
    if (formDateDebut && formDateFin && settings) {
      const days = calculateLeaveDays(
        formDateDebut,
        formDateFin,
        settings.ModeCalculJours,
        settings.JoursFeries
      );
      setFormCalculatedDays(days);

      // Check balance simulation
      if (selectedEmp && selectedType && days > 0) {
        // Compute current remaining balance for this employee and type
        const empDemands = requests.filter(
          (d) =>
            d.Matricule === selectedEmp.Matricule &&
            d.CodeType === selectedType.CodeType &&
            d.Annee === formAnnee &&
            (!editingRequest || d.IdDemande !== editingRequest.IdDemande)
        );

        const soldeDetails = computeSoldeDetails(
          selectedType,
          empDemands,
          selectedEmp.Matricule,
          formAnnee,
          settings.SeuilAlerteSoldeFaible
        );

        if (days > soldeDetails.SoldeRestant) {
          setFormWarning(
            `Attention : Cette demande (${days} j) dépasse le solde restant disponible (${soldeDetails.SoldeRestant} j). Elle risque d'être refusée lors de la validation.`
          );
        } else if (soldeDetails.SoldeRestant - days === 0) {
          setFormWarning(
            `Avertissement : Cette demande va entièrement épuiser le solde disponible de ${selectedType.Libelle}.`
          );
        } else {
          setFormWarning('');
        }
      } else {
        setFormWarning('');
      }
    } else {
      setFormCalculatedDays(0);
      setFormWarning('');
    }
  }, [formDateDebut, formDateFin, formMatricule, formCodeType, formAnnee, settings, selectedEmp, selectedType, editingRequest]);

  const handleOpenAdd = () => {
    setEditingRequest(null);
    setFormMatricule(
      isEmployeeRole && currentEmployeeMatricule
        ? currentEmployeeMatricule
        : employees[0]?.Matricule || 'M0121'
    );
    setFormCodeType(leaveTypes[0]?.CodeType || 'CA');
    const today = new Date().toISOString().split('T')[0];
    setFormDateDebut(today);
    setFormDateFin(today);
    setFormAnnee(selectedYear);
    setFormMotif('');
    setFormObservation('');
    setFormError('');
    setFormWarning('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (demande: DemandeWithDetails) => {
    setEditingRequest(demande);
    setFormMatricule(demande.Matricule);
    setFormCodeType(demande.CodeType);
    setFormDateDebut(demande.DateDebut);
    setFormDateFin(demande.DateFin);
    setFormAnnee(demande.Annee);
    setFormMotif(demande.Motif);
    setFormObservation(demande.Observation || '');
    setFormError('');
    setFormWarning('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formMatricule) {
      setFormError('Veuillez sélectionner un employé.');
      return;
    }
    if (!formDateDebut || !formDateFin) {
      setFormError('Les dates de début et de fin sont obligatoires.');
      return;
    }
    if (formCalculatedDays <= 0) {
      setFormError('La période sélectionnée ne comporte aucun jour ouvré valide.');
      return;
    }

    try {
      if (editingRequest) {
        await api.updateRequest(editingRequest.IdDemande, {
          Matricule: formMatricule,
          CodeType: formCodeType,
          DateDebut: formDateDebut,
          DateFin: formDateFin,
          Annee: Number(formAnnee),
          Motif: formMotif.trim() || 'Demande de congé',
          Observation: formObservation.trim(),
        });
        toast.success('Demande mise à jour', `La demande ${editingRequest.IdDemande} a été recalculée.`);
      } else {
        await api.createRequest({
          Matricule: formMatricule,
          CodeType: formCodeType,
          DateDebut: formDateDebut,
          DateFin: formDateFin,
          Annee: Number(formAnnee),
          Motif: formMotif.trim() || 'Demande de congé',
          Observation: formObservation.trim(),
        });
        toast.success('Demande enregistrée', 'La demande a été créée et transmise pour validation RH.');
      }
      setIsModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteRequest(deleteTarget.IdDemande);
      toast.success('Demande supprimée', 'Les soldes d\'absence ont été automatiquement recalculés.');
      setDeleteTarget(null);
      fetchRequests();
    } catch (err: any) {
      toast.error('Erreur lors de la suppression', err.message);
      setDeleteTarget(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE) || 1;
  const paginatedRequests = requests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Gestion des Demandes de Congé</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Saisie, calcul automatique des durées et historique des départs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF */}
          <button
            onClick={() =>
              generateRequestsListPdf(
                requests,
                `Filtres appliqués : Exercice ${filterYear || 'Tous'}, Direction: ${filterDirection}, Statut: ${filterStatut}`
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportRequestsToExcel(requests)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* New Request Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une demande</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par matricule, nom, motif..."
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

        {/* Year Filter */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
        >
          <option value={0}>Toutes les années</option>
          <option value={2025}>Exercice 2025</option>
          <option value={2026}>Exercice 2026</option>
          <option value={2027}>Exercice 2027</option>
        </select>

        {/* Type Filter */}
        <select
          value={filterCodeType}
          onChange={(e) => setFilterCodeType(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Tous">Tous types de congé</option>
          {leaveTypes.map((t) => (
            <option key={t.CodeType} value={t.CodeType}>
              {t.Libelle} ({t.CodeType})
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="Accordé">Accordé</option>
          <option value="En attente">En attente</option>
          <option value="Refusé">Refusé</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold whitespace-nowrap">Réf. Demande</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Collaborateur</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Direction</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Nature du congé</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Période d'absence</th>
                <th className="py-3 px-4 font-bold text-center whitespace-nowrap">Durée</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Statut</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Validation / Motif</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Aucune demande ne correspond aux critères de sélection.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((d) => (
                  <tr
                    key={d.IdDemande}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {d.IdDemande}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{d.EmployeNom}</span>
                        <span className="block font-mono text-[11px] font-normal text-slate-400">
                          {d.Matricule}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {d.EmployeDirection}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{d.TypeLibelle}</span>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Code: {d.CodeType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {d.DateDebut} <span className="text-slate-400">→</span> {d.DateFin}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {d.NbJours} j
                    </td>
                    <td className="py-3 px-4">
                      {d.StatutDemande === 'Accordé' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Accordé</span>
                        </span>
                      )}
                      {d.StatutDemande === 'En attente' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>En attente</span>
                        </span>
                      )}
                      {d.StatutDemande === 'Refusé' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                          <XCircle className="w-3 h-3" />
                          <span>Refusé</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs">
                      <div className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {d.Motif}
                      </div>
                      {d.ValidePar && (
                        <div className="text-[11px] text-slate-400">
                          Par: {d.ValidePar}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit allowed if pending or admin */}
                        {(d.StatutDemande === 'En attente' || currentRole === 'ADMINISTRATEUR') && (
                          <button
                            onClick={() => handleOpenEdit(d)}
                            title="Modifier la demande"
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(d)}
                            title="Supprimer la demande"
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Affichage de{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {requests.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>{' '}
            à{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * ITEMS_PER_PAGE, requests.length)}
            </strong>{' '}
            sur{' '}
            <strong className="text-slate-800 dark:text-slate-200">{requests.length}</strong>{' '}
            demandes
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingRequest ? `Modifier la demande ${editingRequest.IdDemande}` : 'Enregistrer une nouvelle demande de congé'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formWarning && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formWarning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matricule de l'employé *
                </label>
                {isEmployeeRole && currentEmployeeMatricule ? (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {currentEmployeeMatricule} – {selectedEmp?.Nom}
                  </div>
                ) : (
                  <select
                    value={formMatricule}
                    onChange={(e) => setFormMatricule(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.Matricule}>
                        {emp.Matricule} — {emp.Nom} ({emp.Direction} · {emp.Categorie})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Auto-filled Employee Details Preview */}
              {selectedEmp && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nom complet</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                      {selectedEmp.Nom}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Direction</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                      {selectedEmp.Direction}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Catégorie</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                      {selectedEmp.Categorie}
                    </strong>
                  </div>
                </div>
              )}

              {/* Leave Type and Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Type de congé *
                  </label>
                  <select
                    value={formCodeType}
                    onChange={(e) => setFormCodeType(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {leaveTypes.map((t) => (
                      <option key={t.CodeType} value={t.CodeType}>
                        {t.Libelle} ({t.CodeType}) — Max: {t.SoldeMaximum}j
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Année d'imputation *
                  </label>
                  <select
                    value={formAnnee}
                    onChange={(e) => setFormAnnee(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
              </div>

              {/* Dates & Auto-Calculated Days */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateDebut}
                    onChange={(e) => setFormDateDebut(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateFin}
                    onChange={(e) => setFormDateFin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Durée calculée
                  </label>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-center font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                    {formCalculatedDays} jour(s)
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Mode de calcul actif : <strong className="text-slate-600 dark:text-slate-300">{settings?.ModeCalculJours === 'ouvrables' ? 'Jours ouvrables (Lundi au Vendredi)' : settings?.ModeCalculJours === 'ouvres' ? 'Jours ouvrés (Lundi au Samedi)' : 'Jours calendaires'}</strong> (les jours fériés configurés sont automatiquement exclus).
              </div>

              {/* Motif */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motif ou justification de la demande *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Congés annuels estivaux, arrêt maladie..."
                  value={formMotif}
                  onChange={(e) => setFormMotif(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Observation facultative */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observation ou note complémentaire
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Remplacement assuré par collègue..."
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors"
                >
                  {editingRequest ? 'Enregistrer les modifications' : 'Soumettre la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer la demande de congé"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la demande ${deleteTarget?.IdDemande} pour ${deleteTarget?.EmployeNom} (${deleteTarget?.NbJours} jours) ? Les soldes et statistiques associés seront recalculés immédiatement.`}
        confirmLabel="Confirmer la suppression"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
