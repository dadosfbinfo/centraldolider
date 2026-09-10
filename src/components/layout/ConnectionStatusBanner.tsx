import React, { useState, useEffect } from 'react';
import { dbStore, StoreSyncState } from '../../services/dbStore';
import { WifiOff, RefreshCw, Database, CheckCircle2, AlertTriangle, Cloud, CloudOff } from 'lucide-react';

export const ConnectionStatusBanner: React.FC = () => {
  const [syncState, setSyncState] = useState<StoreSyncState>(dbStore.getConnectionState());
  const [isSyncingManual, setIsSyncingManual] = useState(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setSyncState(dbStore.getConnectionState());
    });
    return () => unsub();
  }, []);

  const handleReconnect = async () => {
    setIsSyncingManual(true);
    await dbStore.syncWithSupabase();
    setIsSyncingManual(false);
  };

  const handleToggleSimulation = async () => {
    dbStore.toggleSimulateOffline(!syncState.isSimulatingOffline);
  };

  // If online and not simulating, don't show the full top warning banner
  if (syncState.status === 'online' && !syncState.isSimulatingOffline) {
    return null;
  }

  const isSyncing = syncState.status === 'syncing' || isSyncingManual;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2.5 shadow-md sticky top-0 z-40 animate-fade-in border-b border-amber-900/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1 bg-white/20 rounded-lg shrink-0">
            {syncState.isSimulatingOffline ? (
              <CloudOff className="w-4 h-4 text-amber-200" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-200" />
            )}
          </div>
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>⚠️ Modo offline: conexão com o banco de dados indisponível no momento.</span>
              {syncState.isSimulatingOffline && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-900/80 text-amber-200 border border-amber-400/40">
                  Simulação Ativa
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-100 font-normal mt-0.5">
              Os dados exibidos refletem o cache local em modo somente leitura. Ações de gravação estão bloqueadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {syncState.isSimulatingOffline && (
            <button
              onClick={handleToggleSimulation}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition border border-white/20"
            >
              Desativar Simulação
            </button>
          )}

          <button
            onClick={handleReconnect}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-white text-amber-900 hover:bg-amber-50 active:bg-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Reconectando...' : 'Tentar Reconectar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact status badge for header / tools
 */
export const ConnectionStatusBadge: React.FC = () => {
  const [syncState, setSyncState] = useState<StoreSyncState>(dbStore.getConnectionState());
  const [showDetails, setShowDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setSyncState(dbStore.getConnectionState());
    });
    return () => unsub();
  }, []);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncing(true);
    await dbStore.syncWithSupabase();
    setIsSyncing(false);
  };

  const handleToggleSim = (e: React.MouseEvent) => {
    e.stopPropagation();
    dbStore.toggleSimulateOffline(!syncState.isSimulatingOffline);
  };

  const isOnline = syncState.status === 'online' && !syncState.isSimulatingOffline;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/70'
        }`}
        title="Status da Conexão com o Supabase"
      >
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
        </span>
        <span className="hidden sm:inline font-bold">
          {isOnline ? 'Supabase Conectado' : 'Modo Offline'}
        </span>
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 animate-fade-in text-[#343A40]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#C76B4A]" />
              Status de Dados
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isOnline ? 'ONLINE (SUPABASE)' : 'OFFLINE (CACHE)'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-600 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Fonte primária:</span>
              <span className="font-semibold text-[#343A40]">
                {isOnline ? 'Supabase (PostgreSQL)' : 'Cache Local (Offline)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Última Sincronização:</span>
              <span className="font-medium">
                {syncState.lastSyncTime
                  ? new Date(syncState.lastSyncTime).toLocaleTimeString('pt-BR')
                  : 'Pendente'}
              </span>
            </div>
            {syncState.error && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                {syncState.error}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-2 px-3 bg-[#C76B4A] hover:bg-[#b05838] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Supabase'}</span>
            </button>

            <button
              onClick={handleToggleSim}
              className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              {syncState.isSimulatingOffline ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Desativar Teste Offline</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simular Queda / Testar Fallback</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
