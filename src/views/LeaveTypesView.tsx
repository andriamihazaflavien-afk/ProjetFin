import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Calendar, ShieldAlert, X } from 'lucide-react';
import { TypeConge, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface LeaveTypesViewProps {
  currentRole: UserRole;
}

export const LeaveTypesView: React.FC<LeaveTypesViewProps> = ({ currentRole }) => {
  const toast = useToast();
  const [leaveTypes, setLeaveTypes] = useState<TypeConge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TypeConge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TypeConge | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formLibelle, setFormLibelle] = useState('');
  const [formSoldeMax, setFormSoldeMax] = useState<number>(30);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  const canEdit = currentRole === 'ADMINISTRATEUR';

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const data = await api.getLeaveTypes(search);
      setLeaveTypes(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des types de congés', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormCode('');
    setFormLibelle('');
    setFormSoldeMax(10);
    setFormDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TypeConge) => {
    setEditingType(t);
    setFormCode(t.CodeType);
    setFormLibelle(t.Libelle);
    setFormSoldeMax(t.SoldeMaximum);
    setFormDescription(t.Description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formCode.trim()) {
      setFormError('Le code du type de congé est obligatoire (ex: CA, CM).');
      return;
    }
    if (!formLibelle.trim()) {
      setFormError('Le libellé est obligatoire.');
      return;
    }
    if (formSoldeMax < 0) {
      setFormError('Le solde maximum ne peut pas être négatif.');
      return;
    }

    try {
      if (editingType) {
        await api.updateLeaveType(editingType.id, {
          CodeType: formCode.trim().toUpperCase(),
          Libelle: formLibelle.trim(),
          SoldeMaximum: Number(formSoldeMax),
          Description: formDescription.trim(),
        });
        toast.success('Type de congé modifié', `Le type [${formCode.toUpperCase()}] a été mis à jour.`);
      } else {
        await api.addLeaveType({
          CodeType: formCode.trim().toUpperCase(),
          Libelle: formLibelle.trim(),
          SoldeMaximum: Number(formSoldeMax),
          Description: formDescription.trim(),
        });
        toast.success('Type de congé ajouté', `Le type [${formCode.toUpperCase()}] a été créé.`);
      }
      setIsModalOpen(false);
      fetchLeaveTypes();
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteLeaveType(deleteTarget.id);
      toast.success('Type de congé supprimé', `Le type ${deleteTarget.Libelle} a été retiré.`);
      setDeleteTarget(null);
      fetchLeaveTypes();
    } catch (err: any) {
      toast.error('Suppression impossible', err.message);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Nomenclature des Types de Congés</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Paramétrage des motifs d'absence, quotas maximaux légaux et conventionnels
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau type de congé</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par code ou libellé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leaveTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {type.CodeType}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                    {type.Libelle}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {type.SoldeMaximum} <span className="text-xs font-normal text-slate-500">j</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">Solde maximum / an</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                {type.Description || 'Aucune description spécifique fournie.'}
              </p>
            </div>

            {canEdit && (
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEdit(type)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(type)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingType ? 'Modifier le type de congé' : 'Nouveau type de congé'}
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
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code Type *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="Ex: CA, CM"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Solde Maximum */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Solde maximum (jours) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    required
                    value={formSoldeMax}
                    onChange={(e) => setFormSoldeMax(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Libelle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Libellé officiel du congé *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Congé annuel"
                  value={formLibelle}
                  onChange={(e) => setFormLibelle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Justificatifs requis
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Arrêt justifié par un certificat médical sous 48h..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  {editingType ? 'Enregistrer les modifications' : 'Créer le type de congé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer le type de congé"
        message={`Êtes-vous sûr de vouloir supprimer le type [${deleteTarget?.CodeType}] ${deleteTarget?.Libelle} ? S'il est utilisé dans l'historique d'une demande, la suppression sera bloquée pour garantir l'intégrité de la base de données.`}
        confirmLabel="Confirmer la suppression"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
