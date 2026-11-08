import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  KeyRound,
  Check,
  History,
  Lock,
  Users,
} from 'lucide-react';
import { UserRole, Employe, AuditLog } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface UsersRolesViewProps {
  currentRole: UserRole;
  setCurrentRole: (r: UserRole) => void;
  currentEmployeeMatricule: string;
  setCurrentEmployeeMatricule: (m: string) => void;
}

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  currentRole,
  setCurrentRole,
  currentEmployeeMatricule,
  setCurrentEmployeeMatricule,
}) => {
  const toast = useToast();
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getEmployees(), api.getAuditLogs()])
      .then(([emps, logs]) => {
        setEmployees(emps);
        setAuditLogs(logs);
      })
      .catch(() => {});
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'ADMINISTRATEUR') {
      api.setUserName('Administrateur Système');
    } else if (role === 'RESPONSABLE_RH') {
      api.setUserName('Marc Durand (Responsable RH)');
    } else {
      const emp = employees.find((e) => e.Matricule === currentEmployeeMatricule);
      api.setUserName(emp ? `${emp.Nom} (${emp.Matricule})` : 'Employé');
    }
    toast.success('Rôle actif modifié', `Session basculée sur le profil [${role}]`);
  };

  const handleEmployeeIdentityChange = (mat: string) => {
    setCurrentEmployeeMatricule(mat);
    const emp = employees.find((e) => e.Matricule === mat);
    if (emp) {
      api.setUserName(`${emp.Nom} (${emp.Matricule})`);
    }
    toast.info('Identité agent mise à jour', `Connecté en tant que ${emp?.Nom || mat}`);
  };

  const rolesMatrix = [
    {
      feature: 'Gestion des Employés (Ajout, Modif, Suppression)',
      admin: true,
      rh: false,
      emp: false,
    },
    {
      feature: 'Gestion des Types de Congés & Soldes Max',
      admin: true,
      rh: false,
      emp: false,
    },
    {
      feature: 'Validation & Refus des Demandes de Congé',
      admin: true,
      rh: true,
      emp: false,
    },
    {
      feature: 'Consultation & Recherche de Tous les Soldes',
      admin: true,
      rh: true,
      emp: false,
    },
    {
      feature: 'Génération de Tous les Rapports PDF & Excel',
      admin: true,
      rh: true,
      emp: false,
    },
    {
      feature: 'Création de Demande de Congé pour Soi',
      admin: true,
      rh: true,
      emp: true,
    },
    {
      feature: 'Consultation de son Profil & Solde Personnel',
      admin: true,
      rh: true,
      emp: true,
    },
    {
      feature: 'Téléchargement de sa Fiche Récapitulative PDF',
      admin: true,
      rh: true,
      emp: true,
    },
    {
      feature: 'Configuration Système & Restauration Démo',
      admin: true,
      rh: false,
      emp: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          <span>Contrôle d'Accès, Rôles & Traçabilité (RBAC)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sélection du profil actif pour les tests, matrice des privilèges et journal d'audit
        </p>
      </div>

      {/* Role Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Administrateur */}
        <div
          onClick={() => handleRoleChange('ADMINISTRATEUR')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            currentRole === 'ADMINISTRATEUR'
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              <Shield className="w-5 h-5" />
            </span>
            {currentRole === 'ADMINISTRATEUR' && (
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Rôle Actif
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3">
            ADMINISTRATEUR
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Accès complet illimité : gestion des employés, types de congés, arbitrage, configuration et sécurité.
          </p>
        </div>

        {/* Responsable RH */}
        <div
          onClick={() => handleRoleChange('RESPONSABLE_RH')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            currentRole === 'RESPONSABLE_RH'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-sm ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <UserCheck className="w-5 h-5" />
            </span>
            {currentRole === 'RESPONSABLE_RH' && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Rôle Actif
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3">
            RESPONSABLE RH
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Consultation du personnel, gestion et arbitrage des demandes (validation/refus), suivi des soldes et rapports.
          </p>
        </div>

        {/* Employé */}
        <div
          onClick={() => handleRoleChange('EMPLOYE')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
            currentRole === 'EMPLOYE'
              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              <Users className="w-5 h-5" />
            </span>
            {currentRole === 'EMPLOYE' && (
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Rôle Actif
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3">
            EMPLOYÉ (Collaborateur)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Espace personnel : consultation de son profil, création de ses demandes, suivi des états et téléchargement de sa fiche.
          </p>
        </div>
      </div>

      {/* When in EMPLOYE role: Identity picker */}
      {currentRole === 'EMPLOYE' && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
              Identité de l'employé connecté
            </span>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
              Sélectionnez quel collaborateur vous souhaitez incarner pour tester son portail personnel.
            </p>
          </div>

          <select
            value={currentEmployeeMatricule}
            onChange={(e) => handleEmployeeIdentityChange(e.target.value)}
            className="text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.Matricule}>
                {e.Matricule} — {e.Nom} ({e.Direction})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Matrice Officielle des Habilitations & Sécurité</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 font-bold">
                <th className="py-3 px-4">Fonctionnalité & Module</th>
                <th className="py-3 px-4 text-center">Administrateur</th>
                <th className="py-3 px-4 text-center">Responsable RH</th>
                <th className="py-3 px-4 text-center">Employé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rolesMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                    {item.feature}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.admin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.rh ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.emp ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Journal d'Audit & Traçabilité des Décisions</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} événements enregistrés
          </span>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 font-bold sticky top-0">
                <th className="py-2.5 px-4">Date / Heure</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Opérateur</th>
                <th className="py-2.5 px-4">Détails de l'opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {log.auteur}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
