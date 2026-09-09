import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Bell, 
  Database, 
  Mail, 
  CheckCircle2, 
  UserCheck, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../services/dbStore';
import { Notificacao, UsuarioPerfil } from '../../types/database';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenDatabaseSchema: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenDatabaseSchema,
}) => {
  const { currentUser, switchActiveUser, allUsers, activeTab, setActiveTab } = useAuth();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    if (currentUser) {
      dbStore.checkAndGenerateAutomatedAlerts(currentUser);
      const list = dbStore.getNotifications(currentUser.id);
      setNotifications(list);
    }
  };

  useEffect(() => {
    loadNotifications();
    const unsub = dbStore.subscribe(() => {
      loadNotifications();
    });
    return () => unsub();
  }, [currentUser]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.lida).length;
  const filteredNotifications = notifFilter === 'UNREAD' 
    ? notifications.filter((n) => !n.lida)
    : notifications;

  const handleMarkAllRead = () => {
    if (currentUser) {
      dbStore.markAllNotificationsRead(currentUser.id);
      loadNotifications();
    }
  };

  const handleNotificationClick = (notif: Notificacao) => {
    dbStore.markNotificationRead(notif.id);
    setShowNotifications(false);

    const isManagerOrAdmin = currentUser?.role === 'ADMINISTRADOR' || currentUser?.role === 'GERENCIA';

    if (notif.link_acao) {
      const tabName = notif.link_acao.replace(/^\//, '');
      if (isManagerOrAdmin) {
        if (tabName === 'minhas-tarefas' || tabName === 'tarefas' || tabName === 'admin-tarefas') setActiveTab('admin-tarefas');
        else if (tabName === 'minhas-metas' || tabName === 'metas' || tabName === 'admin-metas') setActiveTab('admin-metas');
        else if (tabName === 'relatorios' || tabName === 'admin-relatorios') setActiveTab('admin-relatorios');
        else if (tabName === 'calendario' || tabName === 'admin-calendario') setActiveTab('admin-calendario');
        else if (tabName === 'usuarios' || tabName === 'admin-usuarios') setActiveTab('admin-usuarios');
        else if (tabName === 'lideres' || tabName === 'admin-lideres') setActiveTab('admin-lideres');
        else setActiveTab(tabName as any);
      } else {
        if (tabName === 'admin-tarefas' || tabName === 'tarefas') setActiveTab('minhas-tarefas');
        else if (tabName === 'admin-metas' || tabName === 'metas') setActiveTab('minhas-metas');
        else if (tabName === 'admin-relatorios') setActiveTab('relatorios');
        else if (tabName === 'admin-calendario') setActiveTab('calendario');
        else setActiveTab(tabName as any);
      }
      return;
    }

    if (notif.item_tipo === 'TAREFA') {
      setActiveTab(isManagerOrAdmin ? 'admin-tarefas' : 'minhas-tarefas');
    } else if (notif.item_tipo === 'META') {
      setActiveTab(isManagerOrAdmin ? 'admin-metas' : 'minhas-metas');
    } else if (notif.item_tipo === 'RELATORIO') {
      setActiveTab(isManagerOrAdmin ? 'admin-relatorios' : 'relatorios');
    } else if (notif.item_tipo === 'CALENDARIO') {
      setActiveTab(isManagerOrAdmin ? 'admin-calendario' : 'calendario');
    } else if (notif.item_tipo === 'USUARIO') {
      setActiveTab('admin-usuarios');
    } else if (notif.item_tipo === 'LIDER') {
      setActiveTab('admin-lideres');
    }
  };

  const getNotifIcon = (tipo: string) => {
    switch (tipo) {
      case 'OS_ATRIBUIDA':
      case 'TAREFA_ATRASADA':
      case 'PRAZO_PROXIMO':
        return '📋';
      case 'META_ATUALIZADA':
      case 'META_NAO_ATINGIDA':
        return '🎯';
      case 'RELATORIO_PUBLICADO':
        return '📊';
      case 'COMENTARIO':
        return '💬';
      case 'COMUNICADO_CALENDARIO':
      case 'SISTEMA':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'inicio': return '🏠 Início';
      case 'minhas-tarefas': return '✅ Minhas Tarefas';
      case 'minhas-metas': return '🎯 Minhas Metas';
      case 'calendario': return '📅 Calendário';
      case 'relatorios': return '📄 Relatórios';
      case 'meu-perfil': return '👤 Meu Perfil';
      case 'admin-usuarios': return '👥 Gestão de Usuários';
      case 'admin-lideres': return '👔 Gestão de Líderes';
      case 'admin-projetos': return '📁 Gestão de Projetos';
      case 'admin-tarefas': return '📋 Painel de Tarefas / OS';
      case 'admin-metas': return '🎯 Gestão de Metas';
      case 'admin-relatorios': return '📊 Gestão de Relatórios';
      case 'admin-calendario': return '🗓️ Calendário Geral';
      default: return 'Central do Líder';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left Section: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-xl text-gray-600 hover:text-[#343A40] hover:bg-gray-100 lg:hidden transition"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#343A40] tracking-tight flex items-center gap-2">
            <span>{getPageTitle()}</span>
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Database Schema Button */}
        <button
          onClick={onOpenDatabaseSchema}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f7f2ed] text-[#8B6B4A] hover:bg-[#ede3d8] transition border border-[#8B6B4A]/20"
          title="Ver estrutura DDL PostgreSQL / Supabase"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Banco Supabase</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-gray-600 hover:text-[#343A40] hover:bg-gray-100 transition relative"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#C76B4A] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-fade-in">
              <div className="p-3.5 bg-[#343A40] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#C76B4A]" />
                  <span className="font-bold text-xs">Notificações Internas</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#f2caba] hover:underline font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/70 px-3 pt-2">
                <button
                  onClick={() => setNotifFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                    notifFilter === 'ALL'
                      ? 'border-[#C76B4A] text-[#C76B4A] bg-white shadow-2xs'
                      : 'border-transparent text-gray-500 hover:text-[#343A40]'
                  }`}
                >
                  Todas ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('UNREAD')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 flex items-center gap-1.5 ${
                    notifFilter === 'UNREAD'
                      ? 'border-[#C76B4A] text-[#C76B4A] bg-white shadow-2xs'
                      : 'border-transparent text-gray-500 hover:text-[#343A40]'
                  }`}
                >
                  Não lidas
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#C76B4A] text-white text-[10px] rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-gray-300" />
                    <span>Nenhuma notificação encontrada.</span>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 text-xs transition cursor-pointer flex gap-3 ${
                        !notif.lida ? 'bg-[#fcf1ec]/50 hover:bg-[#fcf1ec]/80' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base shrink-0 pt-0.5">{getNotifIcon(notif.tipo)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs truncate ${!notif.lida ? 'font-bold text-[#343A40]' : 'font-medium text-gray-700'}`}>
                            {notif.titulo}
                          </span>
                          {!notif.lida && (
                            <span className="w-2 h-2 rounded-full bg-[#C76B4A] shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1 leading-relaxed text-[11px] line-clamp-2">
                          {notif.texto}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400">
                            {new Date(notif.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] font-semibold text-[#C76B4A] hover:underline">
                            Ver detalhes →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick User Switcher Dropdown (for Evaluator) */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-left"
            title="Alternar perfil ativo para testes"
          >
            <img
              src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser?.nome}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#C76B4A]"
            />
            <div className="hidden md:block text-xs">
              <span className="font-bold text-[#343A40] block leading-tight truncate max-w-[120px]">
                {currentUser?.nome?.split(' ')[0]}
              </span>
              <span className="text-[10px] font-semibold text-[#C76B4A]">
                {currentUser?.role === 'ADMINISTRADOR' ? 'Admin' : currentUser?.role === 'GERENCIA' ? 'Gerência' : 'Líder'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showUserSwitcher && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-fade-in p-2">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Alternar Usuário de Teste:
                </span>
                <span className="text-[10px] text-gray-500">
                  Teste a experiência em diferentes papéis com 1 clique.
                </span>
              </div>

              <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                {allUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleLabel = u.role === 'ADMINISTRADOR' ? 'Administrador' : u.role === 'GERENCIA' ? 'Gerência' : 'Líder';
                  const roleEmoji = u.role === 'ADMINISTRADOR' ? '👑' : u.role === 'GERENCIA' ? '💼' : '👔';
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchActiveUser(u);
                        setShowUserSwitcher(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs ${
                        isCurrent
                          ? 'bg-[#fcf1ec] border border-[#f2caba] text-[#C76B4A] font-bold'
                          : 'hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">
                          {roleEmoji}
                        </span>
                        <div className="truncate">
                          <span className="block truncate">{u.nome}</span>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {roleLabel} • {u.status_confirmacao}
                          </span>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-[#C76B4A] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
