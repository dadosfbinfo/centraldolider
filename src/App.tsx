import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { AppLayout } from './components/layout/AppLayout';
import { DatabaseSchemaModal } from './components/views/DatabaseSchemaModal';
import { Loader2 } from 'lucide-react';

const MainAppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

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

  // If user is unauthenticated, show Login view
  return (
    <>
      <LoginView
        onOpenDatabaseSchema={() => setSchemaModalOpen(true)}
      />

      {/* Global Database Schema Modal */}
      <DatabaseSchemaModal
        isOpen={schemaModalOpen}
        onClose={() => setSchemaModalOpen(false)}
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
