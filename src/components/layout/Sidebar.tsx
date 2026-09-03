import React from 'react';
import {
  Home,
  CheckSquare,
  Target,
  Calendar,
  FileText,
  User,
  Users,
  Briefcase,
  FolderKanban,
  ClipboardList,
  BarChart3,
  CalendarDays,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth, NavigationTab } from '../../context/AuthContext';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { currentUser, activeTab, setActiveTab, logout } = useAuth();
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const isGerencia = currentUser?.role === 'GERENCIA';
  const hasManagementAccess = isAdmin || isGerencia;

  const leaderNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'inicio', label: 'Início', icon: <Home className="w-4 h-4" /> },
    { id: 'minhas-tarefas', label: 'Minhas Tarefas', icon: <CheckSquare className="w-4 h-4" />, badge: '2' },
    { id: 'minhas-metas', label: 'Minhas Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'calendario', label: 'Calendário', icon: <Calendar className="w-4 h-4" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText className="w-4 h-4" />, badge: 'Novo' },
    { id: 'meu-perfil', label: 'Meu Perfil', icon: <User className="w-4 h-4" /> },
  ];

  const rawAdminNavItems: { id: NavigationTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'admin-usuarios', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'admin-lideres', label: 'Líderes', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'admin-projetos', label: 'Projetos', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'admin-tarefas', label: 'Tarefas / OS', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'admin-metas', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'admin-relatorios', label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'admin-calendario', label: 'Calendário', icon: <CalendarDays className="w-4 h-4" /> },
  ];

  // GERENCIA profile is restricted from Usuários, Líderes, Projetos, Metas in Administration
  const adminNavItems = isGerencia
    ? rawAdminNavItems.filter(
        (item) =>
          item.id !== 'admin-usuarios' &&
          item.id !== 'admin-lideres' &&
          item.id !== 'admin-projetos' &&
          item.id !== 'admin-metas'
      )
    : rawAdminNavItems;

  const handleItemClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#343A40]/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#F8F9FA] text-[#343A40] flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-gray-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-gray-200 bg-white">
            <div className="w-10 h-10 rounded-xl bg-[#C76B4A] flex items-center justify-center font-bold text-white text-xl shadow-xs">
              CL
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#343A40] uppercase block leading-none">
                Central <span className="text-[#C76B4A]">Líder</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide block mt-1">
                {isAdmin ? 'Painel Administrativo' : isGerencia ? 'Painel de Gerência' : 'Portal de Operações'}
              </span>
            </div>
          </div>

          {/* Current User Quick Badge */}
          {currentUser?.unidade_nome && (
            <div className="px-6 pt-3 pb-1 text-[11px] text-[#8B6B4A] font-semibold flex items-center gap-1.5">
              <span>📍 {currentUser.unidade_nome}</span>
            </div>
          )}

          {/* Nav List */}
          <div className="py-4 overflow-y-auto max-h-[calc(100vh-230px)]">
            {/* 1. Área do Líder */}
            <div className="mb-5">
              <div className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center justify-between">
                <span>Área do Líder</span>
              </div>

              <nav className="space-y-0.5">
                {leaderNavItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`sidebar-item w-full flex items-center justify-between px-6 py-2.5 text-xs sm:text-sm font-medium transition ${
                        isActive
                          ? 'active font-bold'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-[#343A40]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-[#C76B4A]' : 'text-gray-500'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isActive
                              ? 'bg-[#C76B4A]/20 text-[#C76B4A]'
                              : item.badge === 'Novo'
                              ? 'bg-[#355C7D] text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 2. Área de Administração & Gestão (Para ADMINISTRADOR e GERÊNCIA) */}
            {hasManagementAccess && (
              <div className="pt-3 border-t border-gray-200">
                <div className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#C76B4A]" />
                  <span>{isAdmin ? 'Administração' : 'Gerência & Gestão'}</span>
                </div>

                <nav className="space-y-0.5">
                  {adminNavItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`sidebar-item w-full flex items-center justify-between px-6 py-2.5 text-xs sm:text-sm font-medium transition ${
                          isActive
                            ? 'active font-bold'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-[#343A40]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-[#C76B4A]' : 'text-gray-500'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-[#C76B4A]' : 'text-gray-400'}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Footer with User Card & Logout */}
        <div className="p-4 border-t border-gray-200 bg-[#F8F9FA]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-200 shadow-xs">
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.nome}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#C76B4A]/50 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-[#343A40] block leading-none truncate">
                {currentUser?.nome}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">
                {isAdmin ? 'Administrador' : isGerencia ? 'Gerência' : 'Líder Operacional'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#B85C7A] hover:bg-[#fdf0f4] transition"
              title="Encerrar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
