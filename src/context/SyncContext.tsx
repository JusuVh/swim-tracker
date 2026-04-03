import React, { createContext, useContext, useState } from 'react';

interface SyncContextType {
  isSyncMenuOpen: boolean;
  openSyncMenu: () => void;
  closeSyncMenu: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);

  const openSyncMenu = () => setIsSyncMenuOpen(true);
  const closeSyncMenu = () => setIsSyncMenuOpen(false);

  return (
    <SyncContext.Provider value={{ isSyncMenuOpen, openSyncMenu, closeSyncMenu }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
