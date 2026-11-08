import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Search,
  UserCheck,
  Calendar,
  X,
} from 'lucide-react';
import { DemandeWithDetails, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface ValidationViewProps {
  currentRole: UserRole;
  currentUserName: string;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  currentRole,
  currentUserName,
}) => {
  const toast = useToast();
  const [requests, setRequests] = useState<DemandeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDirection, setFilterDirection] = useState('Toutes');
  const [tabStatut, setTabStatut] = useState<'En attente' | 'Traitees'>('En attente');
  const [search, setSearch] = useState('');

  // Selected request for action modal
  const [selectedRequest, setSelectedRequest] = useState<DemandeWithDetails | null>(null);
  const [actionType, setActionType] = useState<'ACCORDER' | 'REFUSER'>('ACCORDER');
  const [validatorName, setValidatorName] = useState(currentUserName || 'Responsable RH');
  const [observation, setObservation] = useState('');
  const [employeeRecap, setEmployeeRecap] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  const canValidate = currentRole === 'ADMINISTRATEUR' || currentRole === 'RESPONSABLE_RH';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getRequests({
        direction: filterDirection !== 'Toutes' ? filterDirection : undefined,
        search,
      });
      setRequests(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des demandes', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterDirection, search]);

  const handleOpenActionModal = async (demande: DemandeWithDetails, action: 'ACCORDER' | 'REFUSER') => {
    setSelectedRequest(demande);
    setActionType(action);
    setValidatorName(currentUserName || 'Responsable RH');
    setObservation('');
    setEmployeeRecap(null);

    // Fetch the live balance for this employee and year
    try {
      const recap = await api.getIndividualRecap(demande.Matricule, demande.Annee);
      setEmployeeRecap(recap);
    } catch (e) {
      // Non blocking
    }
  };

  const handleProcessDecision = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const res = await api.processValidation(
        selectedRequest.IdDemande,
        actionType,
        validatorName.trim() || 'Responsable RH',
        observation.trim()
      );

      if (actionType === 'ACCORDER') {
        if (res.alertMessage) {
          toast.warning('Validation effectuée avec alerte', res.alertMessage);
        } else {
          toast.success('Demande accordée', `La demande ${selectedRequest.IdDemande} a été validée avec succès.`);
        }
      } else {
        toast.info('Demande refusée', `La demande ${selectedRequest.IdDemande} a été refusée.`);
      }

      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast.error('Opération rejetée', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((d) => {
    if (tabStatut === 'En attente') return d.StatutDemande === 'En attente';
    return d.StatutDemande === 'Accordé' || d.StatutDemande === 'Refusé';
  });

  // Calculate balance preview for modal
  const targetSolde = employeeRecap?.soldes?.find(
    (s: any) => s.CodeType === selectedRequest?.CodeType
  );
  const soldeRestantAvant = targetSolde ? targetSolde.SoldeRestant : 0;
  const joursDemandes = selectedRequest?.NbJours || 0;
  const soldeRestantApres = soldeRestantAvant - joursDemandes;
  const isInsufficient = joursDemandes > soldeRestantAvant || soldeRestantApres < 0;
  const isExhaustedAfter = soldeRestantApres === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Validation des Demandes de Congé</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Contrôle des droits, vérification du solde disponible et arbitrage hiérarchique
          </p>
        </div>

        {/* Tab switch En attente vs Traitées */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setTabStatut('En attente')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-all ${
              tabStatut === 'En attente'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>À valider ({requests.filter((r) => r.StatutDemande === 'En attente').length})</span>
          </button>

          <button
            onClick={() => setTabStatut('Traitees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-all ${
              tabStatut === 'Traitees'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Historique traité</span>
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule ou motif..."
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
      </div>

      {/* Validation Cards / Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {tabStatut === 'En attente'
              ? 'Toutes les demandes de congés ont été traitées !'
              : 'Aucun historique correspondant.'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Aucun arbitrage en attente pour les filtres sélectionnés. Les soldes sont à jour.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((demande) => (
            <div
              key={demande.IdDemande}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {demande.IdDemande}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {demande.EmployeNom}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {demande.Matricule} · {demande.EmployeDirection}
                    </p>
                  </div>

                  {/* Status badge */}
                  {demande.StatutDemande === 'Accordé' && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                      Accordé
                    </span>
                  )}
                  {demande.StatutDemande === 'En attente' && (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                      En attente
                    </span>
                  )}
                  {demande.StatutDemande === 'Refusé' && (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-full">
                      Refusé
                    </span>
                  )}
                </div>

                {/* Details box */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type de congé :</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                      {demande.TypeLibelle} ({demande.CodeType})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Période :</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {demande.DateDebut} → {demande.DateFin}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">Durée demandée :</span>
                    <strong className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                      {demande.NbJours} jour(s)
                    </strong>
                  </div>
                </div>

                {/* Motif */}
                <div className="mt-3 text-xs">
                  <span className="text-slate-400 block text-[11px]">Motif :</span>
                  <p className="text-slate-700 dark:text-slate-300 italic mt-0.5">
                    "{demande.Motif}"
                  </p>
                </div>

                {demande.ValidePar && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Traité par : <strong className="text-slate-600 dark:text-slate-300">{demande.ValidePar}</strong> {demande.DateValidation && `le ${demande.DateValidation}`}
                  </div>
                )}
              </div>

              {/* Action buttons if pending and authorized */}
              {canValidate && demande.StatutDemande === 'En attente' && (
                <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenActionModal(demande, 'REFUSER')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refuser</span>
                  </button>

                  <button
                    onClick={() => handleOpenActionModal(demande, 'ACCORDER')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal with Balance Impact Preview */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {actionType === 'ACCORDER' ? (
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {actionType === 'ACCORDER'
                      ? 'Confirmer l\'approbation de la demande'
                      : 'Confirmer le refus de la demande'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Réf. {selectedRequest.IdDemande} · {selectedRequest.EmployeNom} ({selectedRequest.Matricule})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Strict balance check impact panel when approving */}
            {actionType === 'ACCORDER' && (
              <div className="mt-4 p-4 rounded-xl border space-y-3 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Vérification automatique du solde ({selectedRequest.CodeType})</span>
                  <span className="font-mono text-slate-500">Exercice {selectedRequest.Annee}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Solde actuel</span>
                    <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">
                      {soldeRestantAvant} j
                    </strong>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Jours demandés</span>
                    <strong className="font-mono text-sm text-blue-600 dark:text-blue-400">
                      -{joursDemandes} j
                    </strong>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase">Solde après</span>
                    <strong
                      className={`font-mono text-sm ${
                        isInsufficient
                          ? 'text-red-600 font-bold'
                          : isExhaustedAfter
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-600 font-bold'
                      }`}
                    >
                      {soldeRestantApres} j
                    </strong>
                  </div>
                </div>

                {/* Validation Rule 2 & 4: Solde insuffisant / Négatif */}
                {isInsufficient && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <div>
                      <strong className="block font-bold">Solde de congé insuffisant</strong>
                      <span>
                        L'approbation est strictement bloquée : la durée demandée ({joursDemandes}j) dépasse les droits restants ({soldeRestantAvant}j).
                      </span>
                    </div>
                  </div>
                )}

                {/* Validation Rule 3: Solde épuisé après validation */}
                {isExhaustedAfter && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <div>
                      <strong className="block font-bold">ALERTE : Le solde de congé est épuisé</strong>
                      <span>Après validation de cette demande, le solde de cet employé sera de 0 jour.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validator signature and comment inputs */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom / Qualité du signataire validateur *
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={validatorName}
                    onChange={(e) => setValidatorName(e.target.value)}
                    placeholder="Ex: Direction RH, Directeur Général..."
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observation ou motif de décision
                </label>
                <textarea
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder={
                    actionType === 'ACCORDER'
                      ? 'Ex: Validé conformément au roulement de service...'
                      : 'Ex: Refus motivé par dépassement de solde ou pic d\'activité...'
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={processing || (actionType === 'ACCORDER' && isInsufficient)}
                onClick={handleProcessDecision}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  actionType === 'ACCORDER'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                }`}
              >
                {processing
                  ? 'Traitement...'
                  : actionType === 'ACCORDER'
                  ? 'Approuver la demande'
                  : 'Rejeter la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
