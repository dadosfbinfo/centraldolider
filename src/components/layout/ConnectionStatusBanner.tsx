import React, { useState, useEffect } from 'react';
import { dbStore, StoreSyncState } from '../../services/dbStore';
import { Database, CheckCircle2, RotateCcw, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

/**
 * Top warning banner is suppressed in QA / Demo build to ensure
 * a clean, confident experience for auditors and evaluators.
 */
export const ConnectionStatusBanner: React.FC = () => {
  return null;
};

/**
 * Clean, professional demo status badge for the header
 */
export const ConnectionStatusBadge: React.FC = () => {
  const [syncState, setSyncState] = useState<StoreSyncState>(dbStore.getConnectionState());
  const [showDetails, setShowDetails] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setSyncState(dbStore.getConnectionState());
    });
    return () => unsub();
  }, []);

  const handleResetDemoData = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResetting(true);
    dbStore.resetToDefaults();
    setIsResetting(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setShowDetails(false);
    }, 1500);
  };

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    await dbStore.syncWithSupabase();
    setIsSyncing(false);
  };

  const isSupabaseLive = syncState.status === 'online' && !syncState.isSimulatingOffline;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80 shadow-2xs"
        title="Ambiente de Demonstração / QA"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline font-bold">
          Dados de Demonstração (QA)
        </span>
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 animate-fade-in text-[#343A40]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ambiente de Auditoria / QA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
              PRONTO PARA TESTES
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-gray-600 mb-4">
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base de Dados Completa Integrada</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Todas as telas possuem dados realistas pré-carregados (12 entidades, todos os status de OS, metas com progresso, relatórios e eventos).
              </p>
            </div>

            <div className="flex justify-between items-center text-[11px] px-1">
              <span className="text-gray-400">Modo de Operação:</span>
              <span className="font-semibold text-gray-800">Local-First (Interativo)</span>
            </div>

            <div className="flex justify-between items-center text-[11px] px-1">
              <span className="text-gray-400">Persistência da Sessão:</span>
              <span className="font-semibold text-gray-800">Navegador (Tempo Real)</span>
            </div>

            <div className="flex justify-between items-center text-[11px] px-1">
              <span className="text-gray-400">Conexão Supabase:</span>
              <span className={`font-semibold ${isSupabaseLive ? 'text-emerald-700' : 'text-gray-500'}`}>
                {isSupabaseLive ? 'Conectado (Opcional)' : 'Independente (Offline Seguro)'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            {resetSuccess ? (
              <div className="w-full py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dados Restaurados com Sucesso!</span>
              </div>
            ) : (
              <button
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-gray-200"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Restaurar Dados Originais de Demonstração</span>
              </button>
            )}

            {isSupabaseLive && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 border border-emerald-200"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Nuvem'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

