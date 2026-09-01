import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AppLayout } from './components/layout/AppLayout';
import { DatabaseSchemaModal } from './components/views/DatabaseSchemaModal';
import { EmailConfirmationModal } from './components/auth/EmailConfirmationModal';
import { Loader2 } from 'lucide-react';

const MainAppRouter: React.FC = () => {
  const { isAuthenticated, isLoading, confirmEmail } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [autoConfirmToken, setAutoConfirmToken] = useState<string | null>(null);

  // Check URL Hash for direct email confirmation links (e.g. #/confirmar-email?token=...)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('confirmar-email') && hash.includes('token=')) {
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        const token = urlParams.get('token');
        if (token) {
          setAutoConfirmToken(token);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center text-[#343A40]">
        <div className="w-12 h-12 rounded-2xl bg-[#C76B4A] flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
          CL
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#C76B4A]" />
        <p className="text-xs font-semibold text-gray-500 mt-3">Carregando Central do Líder...</p>
      </div>
    );
  }

  // If user is authenticated, display the main application layout (dashboard and role-based views)
  if (isAuthenticated) {
    return <AppLayout />;
  }

  // If user is unauthenticated, show Login or Register view
  return (
    <>
      {authMode === 'login' ? (
        <LoginView
          onSwitchToRegister={() => setAuthMode('register')}
          onOpenDatabaseSchema={() => setSchemaModalOpen(true)}
        />
      ) : (
        <RegisterView
          onSwitchToLogin={() => setAuthMode('login')}
        />
      )}

      {/* Global Database Schema Modal */}
      <DatabaseSchemaModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
      />

      {/* Auto-Triggered Email Confirmation Modal if link visited */}
      <EmailConfirmationModal
        isOpen={!!autoConfirmToken}
        initialToken={autoConfirmToken || ''}
        onClose={() => {
          setAutoConfirmToken(null);
          window.location.hash = '';
        }}
        onSuccess={() => {
          setAutoConfirmToken(null);
          window.location.hash = '';
          setAuthMode('login');
        }}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
