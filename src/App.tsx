import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileCheck2,
  CheckSquare,
  FileText,
  TrendingDown,
  Building2,
  FileDown,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Moon,
  Menu,
  X,
  UserCheck,
  ChevronRight,
  LogOut,
  Building,
  FileCode,
  Layers,
} from 'lucide-react';
import { UserRole } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { HtmlExportModal } from './components/HtmlExportModal';
import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { LeaveTypesView } from './views/LeaveTypesView';
import { RequestsView } from './views/RequestsView';
import { ValidationView } from './views/ValidationView';
import { BalancesView } from './views/BalancesView';
import { IndividualRecapView } from './views/IndividualRecapView';
import { AbsenteeismRankingView } from './views/AbsenteeismRankingView';
import { SearchByDirectionView } from './views/SearchByDirectionView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { UsersRolesView } from './views/UsersRolesView';
import { api } from './services/api';

type ViewKey =
  | 'dashboard'
  | 'employes'
  | 'types_conge'
  | 'demandes'
  | 'validation'
  | 'soldes'
  | 'fiches_recap'
  | 'absenteisme'
  | 'recherche_direction'
  | 'rapports'
  | 'parametres'
  | 'roles';

export function AppContent() {
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Context States
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMINISTRATEUR');
  const [currentEmployeeMatricule, setCurrentEmployeeMatricule] = useState('M0121');
  const [selectedRecapMatricule, setSelectedRecapMatricule] = useState('M0121');
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [styleFramework, setStyleFramework] = useState<'tailwind' | 'bootstrap'>('tailwind');

  // Initialize theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navigateToRecap = (matricule: string) => {
    setSelectedRecapMatricule(matricule);
    setCurrentView('fiches_recap');
  };

  // Menu items structure with labels and icons
  const navigationItems: {
    key: ViewKey;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
    badge?: string;
  }[] = [
    {
      key: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH', 'EMPLOYE'],
    },
    {
      key: 'employes',
      label: 'Employés',
      icon: <Users className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'types_conge',
      label: 'Types de congés',
      icon: <CalendarDays className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR'],
    },
    {
      key: 'demandes',
      label: 'Demandes de congés',
      icon: <FileCheck2 className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH', 'EMPLOYE'],
    },
    {
      key: 'validation',
      label: 'Validation des demandes',
      icon: <CheckSquare className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'soldes',
      label: 'Soldes de congés',
      icon: <FileText className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'fiches_recap',
      label: 'Fiches récapitulatives',
      icon: <FileText className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH', 'EMPLOYE'],
    },
    {
      key: 'absenteisme',
      label: 'Classement absentéisme',
      icon: <TrendingDown className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'recherche_direction',
      label: 'Recherche par Direction',
      icon: <Building2 className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'rapports',
      label: 'Rapports & statistiques',
      icon: <FileDown className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH'],
    },
    {
      key: 'parametres',
      label: 'Paramètres',
      icon: <SettingsIcon className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR'],
    },
    {
      key: 'roles',
      label: 'Utilisateurs & rôles',
      icon: <Shield className="w-4 h-4" />,
      roles: ['ADMINISTRATEUR', 'RESPONSABLE_RH', 'EMPLOYE'],
    },
  ];

  // Breadcrumbs text helper
  const getBreadcrumbLabel = (key: ViewKey): string => {
    const item = navigationItems.find((n) => n.key === key);
    return item ? item.label : 'Espace RH';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Header Contract (Tailwind / Bootstrap 5 adaptive) */}
      <header
        className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 transition-colors ${
          styleFramework === 'bootstrap'
            ? 'bg-[#212529] text-white border-b border-[#373b3e] shadow-md'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Left: Mobile hamburger & Brand Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setCurrentView('dashboard')}
            className="cursor-pointer flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              RH
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                GESTION RH
              </span>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium ml-2">
                Congés & Absences
              </span>
            </div>
          </div>
        </div>

        {/* Center: Contextual Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Plateforme RH</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-900 dark:text-slate-100 font-bold">
            {getBreadcrumbLabel(currentView)}
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-mono tabular-nums text-blue-600 dark:text-blue-400 font-semibold">
            {selectedYear}
          </span>
        </div>

        {/* Right: Actions, HTML Export, Role Selector & Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* HTML/CSS/JS Standalone Export Button */}
          <button
            onClick={() => setIsHtmlModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-xs"
            title="Télécharger / Visualiser les fichiers HTML / CSS / JS autonomes en Bootstrap 5 et Tailwind"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HTML / CSS / JS</span>
            <span className="text-[10px] bg-blue-200 dark:bg-blue-900/80 px-1 py-0.2 rounded font-mono">Bootstrap & Tailwind</span>
          </button>

          {/* Style Framework switcher */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStyleFramework('tailwind')}
              className={`px-2 py-1 rounded-lg transition-all ${
                styleFramework === 'tailwind'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tailwind
            </button>
            <button
              onClick={() => setStyleFramework('bootstrap')}
              className={`px-2 py-1 rounded-lg transition-all ${
                styleFramework === 'bootstrap'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bootstrap
            </button>
          </div>

          {/* Active Role Badge & Switcher */}
          <button
            onClick={() => setCurrentView('roles')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Changer de rôle"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline text-slate-600 dark:text-slate-300">Rôle :</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {currentRole === 'ADMINISTRATEUR'
                ? 'Admin'
                : currentRole === 'RESPONSABLE_RH'
                ? 'RH'
                : 'Employé'}
            </strong>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0 top-[57px]' : '-translate-x-full'
          }`}
        >
          {/* Nav items list */}
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu Principal
            </div>

            {navigationItems
              .filter((item) => item.roles.includes(currentRole))
              .map((item) => {
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentView(item.key);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* User profile bottom footer */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                  {currentRole === 'ADMINISTRATEUR'
                    ? 'AD'
                    : currentRole === 'RESPONSABLE_RH'
                    ? 'RH'
                    : currentEmployeeMatricule.substring(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentRole === 'ADMINISTRATEUR'
                      ? 'Administrateur'
                      : currentRole === 'RESPONSABLE_RH'
                      ? 'Responsable RH'
                      : currentEmployeeMatricule}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    Session active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-10 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={(v) => setCurrentView(v as ViewKey)}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            )}

            {currentView === 'employes' && (
              <EmployeesView
                currentRole={currentRole}
                onSelectEmployeeForRecap={navigateToRecap}
              />
            )}

            {currentView === 'types_conge' && (
              <LeaveTypesView currentRole={currentRole} />
            )}

            {currentView === 'demandes' && (
              <RequestsView
                currentRole={currentRole}
                currentEmployeeMatricule={currentEmployeeMatricule}
                selectedYear={selectedYear}
              />
            )}

            {currentView === 'validation' && (
              <ValidationView
                currentRole={currentRole}
                currentUserName={
                  currentRole === 'ADMINISTRATEUR'
                    ? 'Direction Générale'
                    : 'Marc Durand (Responsable RH)'
                }
              />
            )}

            {currentView === 'soldes' && (
              <BalancesView
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                onSelectEmployeeForRecap={navigateToRecap}
              />
            )}

            {currentView === 'fiches_recap' && (
              <IndividualRecapView
                initialMatricule={
                  currentRole === 'EMPLOYE'
                    ? currentEmployeeMatricule
                    : selectedRecapMatricule
                }
                selectedYear={selectedYear}
              />
            )}

            {currentView === 'absenteisme' && (
              <AbsenteeismRankingView
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                onSelectEmployeeForRecap={navigateToRecap}
              />
            )}

            {currentView === 'recherche_direction' && (
              <SearchByDirectionView
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            )}

            {currentView === 'rapports' && (
              <ReportsView
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            )}

            {currentView === 'parametres' && (
              <SettingsView
                onRefreshAllData={() => {
                  // Trigger reload if needed
                }}
              />
            )}

            {currentView === 'roles' && (
              <UsersRolesView
                currentRole={currentRole}
                setCurrentRole={setCurrentRole}
                currentEmployeeMatricule={currentEmployeeMatricule}
                setCurrentEmployeeMatricule={setCurrentEmployeeMatricule}
              />
            )}
          </div>
        </main>
      </div>

      {/* HTML / CSS / JS Standalone Export Modal */}
      <HtmlExportModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
