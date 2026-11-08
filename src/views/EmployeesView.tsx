import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FileDown,
  FileSpreadsheet,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { Employe, Sexe, Categorie, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { generateEmployeesListPdf } from '../lib/pdfGenerator';
import { exportEmployeesToExcel } from '../lib/excelGenerator';

interface EmployeesViewProps {
  currentRole: UserRole;
  onSelectEmployeeForRecap?: (matricule: string) => void;
}

const ITEMS_PER_PAGE = 8;

export const EmployeesView: React.FC<EmployeesViewProps> = ({ currentRole, onSelectEmployeeForRecap }) => {
  const toast = useToast();
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [filterSexe, setFilterSexe] = useState('Tous');
  const [filterCategorie, setFilterCategorie] = useState('Toutes');
  const [sortField, setSortField] = useState<'Matricule' | 'Nom' | 'Direction' | 'AnneeEmbauche'>('Nom');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employe | null>(null);

  // Form State
  const [formMatricule, setFormMatricule] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formDirection, setFormDirection] = useState('Ressources Humaines');
  const [formSexe, setFormSexe] = useState<Sexe>('Masculin');
  const [formCategorie, setFormCategorie] = useState<Categorie>('Cadre');
  const [formAnneeEmbauche, setFormAnneeEmbauche] = useState(new Date().getFullYear());
  const [formPoste, setFormPoste] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');

  const canEdit = currentRole === 'ADMINISTRATEUR';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees({
        search: searchTerm,
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        sexe: filterSexe !== 'Tous' ? filterSexe : undefined,
        categorie: filterCategorie !== 'Toutes' ? filterCategorie : undefined,
      });
      setEmployees(data);
    } catch (err: any) {
      toast.error('Erreur de chargement des employés', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, filterDirection, filterSexe, filterCategorie]);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setFormMatricule('');
    setFormNom('');
    setFormDirection('Ressources Humaines');
    setFormSexe('Masculin');
    setFormCategorie('Cadre');
    setFormAnneeEmbauche(2023);
    setFormPoste('');
    setFormEmail('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employe) => {
    setEditingEmp(emp);
    setFormMatricule(emp.Matricule);
    setFormNom(emp.Nom);
    setFormDirection(emp.Direction);
    setFormSexe(emp.Sexe);
    setFormCategorie(emp.Categorie);
    setFormAnneeEmbauche(emp.AnneeEmbauche);
    setFormPoste(emp.Poste || '');
    setFormEmail(emp.Email || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formMatricule.trim()) {
      setFormError('Le matricule est obligatoire.');
      return;
    }
    if (!formNom.trim()) {
      setFormError('Le nom complet est obligatoire.');
      return;
    }

    try {
      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, {
          Matricule: formMatricule.trim().toUpperCase(),
          Nom: formNom.trim(),
          Direction: formDirection,
          Sexe: formSexe,
          Categorie: formCategorie,
          AnneeEmbauche: Number(formAnneeEmbauche),
          Poste: formPoste.trim(),
          Email: formEmail.trim(),
        });
        toast.success('Employé modifié avec succès');
      } else {
        await api.addEmployee({
          Matricule: formMatricule.trim().toUpperCase(),
          Nom: formNom.trim(),
          Direction: formDirection,
          Sexe: formSexe,
          Categorie: formCategorie,
          AnneeEmbauche: Number(formAnneeEmbauche),
          Poste: formPoste.trim(),
          Email: formEmail.trim(),
        });
        toast.success('Employé ajouté avec succès');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      if (err.message.includes('Employé déjà enregistré')) {
        setFormError('Employé déjà enregistré');
      } else if (err.message.includes('Employé non trouvé')) {
        setFormError('Employé non trouvé');
      } else {
        setFormError(err.message || 'Une erreur est survenue');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteEmployee(deleteTarget.id);
      toast.success('Employé supprimé', `L'employé ${deleteTarget.Nom} (${deleteTarget.Matricule}) a été retiré.`);
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err: any) {
      toast.error('Suppression impossible', err.message);
      setDeleteTarget(null);
    }
  };

  // Sorting
  const sortedEmployees = [...employees].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'Matricule') cmp = a.Matricule.localeCompare(b.Matricule);
    else if (sortField === 'Nom') cmp = a.Nom.localeCompare(b.Nom);
    else if (sortField === 'Direction') cmp = a.Direction.localeCompare(b.Direction);
    else if (sortField === 'AnneeEmbauche') cmp = a.AnneeEmbauche - b.AnneeEmbauche;
    return sortAsc ? cmp : -cmp;
  });

  // Pagination
  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE) || 1;
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Gestion des Employés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fichier centralisé des collaborateurs, données contractuelles et affectations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF */}
          <button
            onClick={() => generateEmployeesListPdf(employees)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportEmployeesToExcel(employees)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Add Employee Button (Admin only) */}
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un employé</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par matricule ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Sexe Filter */}
        <select
          value={filterSexe}
          onChange={(e) => setFilterSexe(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="Tous">Tous les sexes</option>
          <option value="Masculin">Masculin</option>
          <option value="Féminin">Féminin</option>
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
      </div>

      {/* Employees Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th
                  onClick={() => toggleSort('Matricule')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                >
                  Matricule {sortField === 'Matricule' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('Nom')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                >
                  Nom complet {sortField === 'Nom' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('Direction')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                >
                  Direction {sortField === 'Direction' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Catégorie</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Sexe</th>
                <th
                  onClick={() => toggleSort('AnneeEmbauche')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                >
                  Embauche {sortField === 'AnneeEmbauche' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">Fonction</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucun employé ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {emp.Matricule}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div>
                        <span>{emp.Nom}</span>
                        {emp.Email && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {emp.Email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {emp.Direction}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {emp.Categorie}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {emp.Sexe}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {emp.AnneeEmbauche}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {emp.Poste || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectEmployeeForRecap && (
                          <button
                            onClick={() => onSelectEmployeeForRecap(emp.Matricule)}
                            title="Voir fiche récapitulative"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              title="Modifier"
                              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(emp)}
                              title="Supprimer"
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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
              {employees.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>{' '}
            à{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * ITEMS_PER_PAGE, employees.length)}
            </strong>{' '}
            sur{' '}
            <strong className="text-slate-800 dark:text-slate-200">{employees.length}</strong>{' '}
            collaborateurs
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingEmp ? 'Modifier les informations de l\'employé' : 'Ajouter un nouvel employé'}
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
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Matricule */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Matricule *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M0175"
                    value={formMatricule}
                    onChange={(e) => setFormMatricule(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paul Martin"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Direction de rattachement *
                </label>
                <select
                  value={formDirection}
                  onChange={(e) => setFormDirection(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Ressources Humaines">Ressources Humaines</option>
                  <option value="Finance & Comptabilité">Finance & Comptabilité</option>
                  <option value="Systèmes d'Information">Systèmes d'Information</option>
                  <option value="Commercial & Marketing">Commercial & Marketing</option>
                  <option value="Opérations & Logistique">Opérations & Logistique</option>
                  <option value="Direction Générale">Direction Générale</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Sexe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sexe *
                  </label>
                  <select
                    value={formSexe}
                    onChange={(e) => setFormSexe(e.target.value as Sexe)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formCategorie}
                    onChange={(e) => setFormCategorie(e.target.value as Categorie)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Cadre">Cadre</option>
                    <option value="Maîtrise">Maîtrise</option>
                    <option value="Employé">Employé</option>
                    <option value="Ouvrier">Ouvrier</option>
                  </select>
                </div>

                {/* Année d'embauche */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Année embauche *
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    required
                    value={formAnneeEmbauche}
                    onChange={(e) => setFormAnneeEmbauche(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Poste / Fonction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Intitulé du poste / Fonction
                </label>
                <input
                  type="text"
                  placeholder="Ex: Responsable Paie"
                  value={formPoste}
                  onChange={(e) => setFormPoste(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email professionnel
                </label>
                <input
                  type="email"
                  placeholder="Ex: paul.martin@entreprise.rh"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  {editingEmp ? 'Enregistrer les modifications' : 'Créer l\'employé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer l'employé"
        message={`Êtes-vous sûr de vouloir supprimer l'employé ${deleteTarget?.Nom} (${deleteTarget?.Matricule}) ? Attention : s'il possède des demandes de congés rattachées, l'opération sera strictement bloquée par intégrité référentielle.`}
        confirmLabel="Confirmer la suppression"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
