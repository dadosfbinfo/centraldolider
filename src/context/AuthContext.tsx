import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UsuarioPerfil, UserRole, SimulatedEmail } from '../types/database';
import { dbStore } from '../services/dbStore';

export type NavigationTab = 
  | 'inicio'
  | 'minhas-tarefas'
  | 'minhas-metas'
  | 'calendario'
  | 'relatorios'
  | 'meu-perfil'
  | 'admin-usuarios'
  | 'admin-lideres'
  | 'admin-projetos'
  | 'admin-tarefas'
  | 'admin-metas'
  | 'admin-relatorios'
  | 'admin-calendario';

interface AuthContextType {
  currentUser: UsuarioPerfil | null;
  user: UsuarioPerfil | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  login: (email: string, password: string) => Promise<UsuarioPerfil>;
  register: (params: {
    email: string;
    nome: string;
    senha: string;
    role?: UserRole;
    unidade_id?: string;
    cargo?: string;
    telefone?: string;
    matricula?: string;
  }) => Promise<{ user: UsuarioPerfil; simulatedEmail: SimulatedEmail }>;
  confirmEmail: (token: string) => Promise<UsuarioPerfil>;
  resendConfirmation: (email: string) => Promise<SimulatedEmail>;
  requestPasswordReset: (email: string) => Promise<SimulatedEmail>;
  logout: () => void;
  switchActiveUser: (user: UsuarioPerfil) => void;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<UsuarioPerfil>;
  allUsers: UsuarioPerfil[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_SESSION_KEY = 'cdl_auth_session_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UsuarioPerfil | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('inicio');
  const [allUsers, setAllUsers] = useState<UsuarioPerfil[]>([]);

  // Synchronize users and current session from store
  const refreshState = useCallback(() => {
    const users = dbStore.getUsers();
    setAllUsers(users);

    const savedUserId = localStorage.getItem(CURRENT_USER_SESSION_KEY);
    if (savedUserId) {
      const found = users.find((u) => u.id === savedUserId);
      if (found && found.status_confirmacao === 'CONFIRMADO') {
        setCurrentUser(found);
      } else if (found && found.status_confirmacao === 'PENDENTE') {
        // User is pending confirmation, do not auto-login
        localStorage.removeItem(CURRENT_USER_SESSION_KEY);
        setCurrentUser(null);
      } else {
        // Fallback if saved user no longer exists
        const defaultUser = users.find((u) => u.status_confirmacao === 'CONFIRMADO') || users[0] || null;
        if (defaultUser) {
          localStorage.setItem(CURRENT_USER_SESSION_KEY, defaultUser.id);
          setCurrentUser(defaultUser);
        }
      }
    } else if (users.length > 0) {
      const defaultUser = users.find((u) => u.status_confirmacao === 'CONFIRMADO') || users[0];
      if (defaultUser) {
        localStorage.setItem(CURRENT_USER_SESSION_KEY, defaultUser.id);
        setCurrentUser(defaultUser);
      }
    }
  }, []);

  useEffect(() => {
    refreshState();
    const unsubscribe = dbStore.subscribe(() => {
      refreshState();
    });
    setIsLoading(false);
    return () => unsubscribe();
  }, [refreshState]);

  const login = async (email: string, password: string): Promise<UsuarioPerfil> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = dbStore.getUserByEmail(cleanEmail);

    if (!user) {
      throw new Error('E-mail ou senha inválidos. Verifique suas credenciais.');
    }

    const storedPassword = dbStore.getStoredPassword(cleanEmail);
    if (storedPassword && storedPassword !== password) {
      throw new Error('E-mail ou senha inválidos. Verifique suas credenciais.');
    }

    // Strict rule 3.3: Confirmação de cadastro por e-mail
    if (user.status_confirmacao === 'PENDENTE') {
      throw new Error(
        `Seu cadastro está pendente de confirmação por e-mail. Por favor, clique no link de ativação enviado para ${user.email} para liberar seu acesso.`
      );
    }

    localStorage.setItem(CURRENT_USER_SESSION_KEY, user.id);
    setCurrentUser(user);
    setActiveTab('inicio');
    return user;
  };

  const register = async (params: {
    email: string;
    nome: string;
    senha: string;
    role?: UserRole;
    unidade_id?: string;
    cargo?: string;
    telefone?: string;
    matricula?: string;
  }): Promise<{ user: UsuarioPerfil; simulatedEmail: SimulatedEmail }> => {
    const result = dbStore.registerUser(params);
    refreshState();
    return result;
  };

  const confirmEmail = async (token: string): Promise<UsuarioPerfil> => {
    const user = dbStore.confirmUserEmail(token);
    refreshState();
    return user;
  };

  const resendConfirmation = async (email: string): Promise<SimulatedEmail> => {
    const result = dbStore.resendConfirmationEmail(email);
    refreshState();
    return result;
  };

  const requestPasswordReset = async (email: string): Promise<SimulatedEmail> => {
    const result = dbStore.requestPasswordReset(email);
    refreshState();
    return result;
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_SESSION_KEY);
    setCurrentUser(null);
    setActiveTab('inicio');
  };

  const switchActiveUser = (user: UsuarioPerfil) => {
    if (user.status_confirmacao !== 'CONFIRMADO') {
      // Auto-confirm for demo switching convenience
      dbStore.confirmUserEmail(user.id);
    }
    localStorage.setItem(CURRENT_USER_SESSION_KEY, user.id);
    setCurrentUser(user);
    setActiveTab('inicio');
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<UsuarioPerfil> => {
    const updated = dbStore.updateUserRole(userId, newRole);
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    refreshState();
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        activeTab,
        setActiveTab,
        login,
        register,
        confirmEmail,
        resendConfirmation,
        requestPasswordReset,
        logout,
        switchActiveUser,
        updateUserRole,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
