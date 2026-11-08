import React from 'react';
import { Download, ExternalLink, FileCode, CheckCircle2, X } from 'lucide-react';

interface HtmlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HtmlExportModal: React.FC<HtmlExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-6">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Versions Autonomes en HTML / CSS / JS (Bootstrap & Tailwind)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fichiers complets 100% autonomes, exécutables sans serveur Node.js
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Vous avez désormais à votre disposition l'application déclinée sous les technologies <strong>HTML5, CSS3, JavaScript (Vanilla ES6)</strong> avec au choix les frameworks <strong>Bootstrap 5</strong> ou <strong>Tailwind CSS</strong>. Ces fichiers intègrent la base de données locale (LocalStorage), les calculs de congés, les graphiques Chart.js et les exports PDF/Excel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* 1. Version Bootstrap 5 */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                    Bootstrap 5.3
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">.html</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                  Édition HTML / CSS / JS – Bootstrap
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Structure 100% Bootstrap 5 avec grille responsive, modals, badges, tableau de bord, graphiques et exports PDF.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <a
                  href="/gestion_rh_bootstrap.html"
                  download="gestion_rh_bootstrap.html"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le fichier .html</span>
                </a>
                <a
                  href="/gestion_rh_bootstrap.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir directement dans un nouvel onglet</span>
                </a>
              </div>
            </div>

            {/* 2. Version Tailwind CSS */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-mono">
                    Tailwind CSS
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">.html</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                  Édition HTML / CSS / JS – Tailwind
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Design moderne SaaS Tailwind CSS avec cartes, polices Plus Jakarta Sans, histogrammes et fiches individuelles.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <a
                  href="/gestion_rh_tailwind.html"
                  download="gestion_rh_tailwind.html"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le fichier .html</span>
                </a>
                <a
                  href="/gestion_rh_tailwind.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir directement dans un nouvel onglet</span>
                </a>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <strong>Compatibilité totale :</strong> Ces deux fichiers fonctionnent en local sur n'importe quel ordinateur par simple double-clic dans un navigateur (Chrome, Firefox, Safari, Edge) et conservent toutes les données dans le stockage du navigateur (`localStorage`).
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
