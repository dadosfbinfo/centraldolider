import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardHome } from '../views/DashboardHome';
import { TasksView } from '../views/TasksView';
import { UsersManagementView } from '../views/UsersManagementView';
import { LeadersManagementView } from '../views/LeadersManagementView';
import { LeaderGoalsView } from '../views/LeaderGoalsView';
import { GoalsManagementView } from '../views/GoalsManagementView';
import { LeaderReportsView } from '../views/LeaderReportsView';
import { ReportsManagementView } from '../views/ReportsManagementView';
import { CalendarView } from '../views/CalendarView';
import { CalendarManagementView } from '../views/CalendarManagementView';
import { UserProfileView } from '../views/UserProfileView';
import { DatabaseSchemaModal } from '../views/DatabaseSchemaModal';
import { EmailSimulationInbox } from '../auth/EmailSimulationInbox';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { activeTab, currentUser, setActiveTab } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [emailInboxOpen, setEmailInboxOpen] = useState(false);

  // Strict RBAC: Leader cannot access any admin-* routes
  const isAdminRoute = activeTab.startsWith('admin-');
  const isUnauthorized = isAdminRoute && currentUser?.role !== 'ADMINISTRADOR';

  const renderActiveView = () => {
    if (isUnauthorized) {
      return (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-red-200 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#343A40]">Acesso Restrito à Administração</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Esta funcionalidade requer privilégios de Administrador. Seu perfil atual é de Líder Operacional.
          </p>
          <button
            onClick={() => setActiveTab('inicio')}
            className="px-5 py-2.5 bg-[#C76B4A] hover:bg-[#b05838] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'inicio':
        return <DashboardHome />;
      case 'minhas-tarefas':
      case 'admin-tarefas':
        return <TasksView initialTab="hoje" />;
      case 'minhas-metas':
        return <LeaderGoalsView />;
      case 'admin-metas':
        return <GoalsManagementView />;
      case 'calendario':
        return <CalendarView />;
      case 'admin-calendario':
        return <CalendarManagementView />;
      case 'relatorios':
        return <LeaderReportsView />;
      case 'admin-relatorios':
        return <ReportsManagementView />;
      case 'admin-usuarios':
        return <UsersManagementView />;
      case 'admin-lideres':
        return <LeadersManagementView />;
      case 'meu-perfil':
        return <UserProfileView />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaf8] flex">
      {/* Sidebar Component */}
      <Sidebar
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by 64 / 256px on lg screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenDatabaseSchema={() => setSchemaModalOpen(true)}
          onOpenEmailInbox={() => setEmailInboxOpen(true)}
        />

        {/* Main View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Natural Tones Footer Bar */}
        <footer className="h-12 bg-white border-t border-gray-200 px-6 sm:px-8 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0">
          <div>Central do Líder • Gestão Operacional & Liderança</div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Suporte: admin@central.com.br</span>
            <span className="text-[#C76B4A] font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Operacional Ativo
            </span>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <DatabaseSchemaModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
      />

      <EmailSimulationInbox
        isOpen={emailInboxOpen}
        onClose={() => setEmailInboxOpen(false)}
      />
    </div>
  );
};
