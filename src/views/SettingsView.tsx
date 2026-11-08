import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Calendar,
  Building,
  Sliders,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Settings, ModeCalculJours } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsViewProps {
  onRefreshAllData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshAllData }) => {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [modeCalcul, setModeCalcul] = useState<ModeCalculJours>('ouvrables');
  const [seuilFaible, setSeuilFaible] = useState(20);
  const [newHoliday, setNewHoliday] = useState('');
  const [holidays, setHolidays] = useState<string[]>([]);

  // Demo reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data);
      setOrgName(data.NomOrganisation);
      setModeCalcul(data.ModeCalculJours);
      setSeuilFaible(data.SeuilAlerteSoldeFaible);
      setHolidays(data.JoursFeries || []);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des paramètres', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error('Erreur', 'Le nom de l\'organisation ne peut pas être vide.');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateSettings({
        NomOrganisation: orgName.trim(),
        ModeCalculJours: modeCalcul,
        SeuilAlerteSoldeFaible: Number(seuilFaible),
        JoursFeries: holidays.sort(),
      });
      setSettings(updated);
      toast.success('Paramètres enregistrés', 'Les règles de calcul et paramètres d\'édition ont été mis à jour.');
    } catch (err: any) {
      toast.error('Erreur lors de l\'enregistrement', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    if (holidays.includes(newHoliday)) {
      toast.warning('Avertissement', 'Ce jour férié est déjà présent dans le calendrier.');
      return;
    }
    setHolidays([...holidays, newHoliday].sort());
    setNewHoliday('');
  };

  const handleRemoveHoliday = (dateStr: string) => {
    setHolidays(holidays.filter((d) => d !== dateStr));
  };

  const handleResetDemoData = async () => {
    try {
      await api.resetDemo();
      toast.success('Données restaurées', 'Le jeu de données officiel initial a été réinitialisé avec succès.');
      setIsResetModalOpen(false);
      fetchSettings();
      if (onRefreshAllData) onRefreshAllData();
    } catch (err: any) {
      toast.error('Erreur de réinitialisation', err.message);
    }
  };

  if (loading && !settings) {
    return <div className="p-8 text-center text-slate-400">Chargement des paramètres...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>Paramètres Système & Règles Métier</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modes de calcul des congés, calendrier des jours fériés et identité des documents
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurer Démo</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Organization identity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Identité de l'Organisation</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Raison sociale ou Nom officiel de l'organisation *
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ex: GROUPE RH & CONGÉS SOLUTIONS"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Ce libellé apparaîtra dans l'en-tête de toutes les fiches individuelles et rapports PDF officiels.
            </span>
          </div>
        </div>

        {/* Section 2: Leave calculation engine mode */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Moteur de Calcul des Jours de Congé</span>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mode de calcul officiel *
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  modeCalcul === 'ouvrables'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modeCalcul"
                    value="ouvrables"
                    checked={modeCalcul === 'ouvrables'}
                    onChange={() => setModeCalcul('ouvrables')}
                    className="text-blue-600"
                  />
                  <strong className="text-xs">Jours Ouvrables</strong>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Lundi au Vendredi inclus. Exclut automatiquement les samedis, dimanches et jours fériés.
                </p>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  modeCalcul === 'ouvres'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modeCalcul"
                    value="ouvres"
                    checked={modeCalcul === 'ouvres'}
                    onChange={() => setModeCalcul('ouvres')}
                    className="text-blue-600"
                  />
                  <strong className="text-xs">Jours Ouvrés</strong>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Lundi au Samedi inclus. Exclut uniquement les dimanches et jours fériés chômés.
                </p>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  modeCalcul === 'calendaires'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modeCalcul"
                    value="calendaires"
                    checked={modeCalcul === 'calendaires'}
                    onChange={() => setModeCalcul('calendaires')}
                    className="text-blue-600"
                  />
                  <strong className="text-xs">Jours Calendaires</strong>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Tous les jours consécutifs du calendrier civil sont comptabilisés.
                </p>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Seuil d'alerte « Solde faible » (en %)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="5"
                max="50"
                value={seuilFaible}
                onChange={(e) => setSeuilFaible(Number(e.target.value))}
                className="w-24 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500">
                % du solde maximum (Ex: 20% pour déclencher l'observation SOLDE FAIBLE).
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Holidays calendar */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Calendrier des Jours Fériés & Chômés</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {holidays.length} dates déclarées
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddHoliday}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter la date</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {holidays.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                <span>{h}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(h)}
                  className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Sauvegarder les paramètres'}</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Resetting Demo Data */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Restaurer les données de démonstration"
        message="Cette action va réinitialiser entièrement la base de données avec le jeu d'essai initial (15 employés, 5 types de congés, demandes réalistes d'exemple). Toutes les modifications récentes non sauvegardées seront réinitialisées."
        confirmLabel="Réinitialiser maintenant"
        isDestructive
        onConfirm={handleResetDemoData}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
