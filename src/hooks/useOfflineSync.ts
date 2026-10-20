import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface PendingSync {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: number;
}

const PENDING_SYNCS_KEY = 'pending_syncs';
const OFFLINE_DATA_KEY = 'offline_data';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { user } = useAuth();

  // Get pending syncs from localStorage
  const getPendingSyncs = useCallback((): PendingSync[] => {
    try {
      const stored = localStorage.getItem(PENDING_SYNCS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save pending syncs to localStorage
  const savePendingSyncs = useCallback((syncs: PendingSync[]) => {
    localStorage.setItem(PENDING_SYNCS_KEY, JSON.stringify(syncs));
    setPendingCount(syncs.length);
  }, []);

  // Add a new pending sync
  const addPendingSync = useCallback((
    table: string,
    action: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ) => {
    const syncs = getPendingSyncs();
    const newSync: PendingSync = {
      id: crypto.randomUUID(),
      table,
      action,
      data,
      createdAt: Date.now()
    };
    syncs.push(newSync);
    savePendingSyncs(syncs);
    return newSync.id;
  }, [getPendingSyncs, savePendingSyncs]);

  // Save data locally for offline access
  const saveOfflineData = useCallback((key: string, data: unknown) => {
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '{}');
      offlineData[key] = {
        data,
        updatedAt: Date.now()
      };
      localStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }, []);

  // Get offline data
  const getOfflineData = useCallback((key: string) => {
    try {
      const offlineData = JSON.parse(localStorage.getItem(OFFLINE_DATA_KEY) || '{}');
      return offlineData[key]?.data || null;
    } catch {
      return null;
    }
  }, []);

  // Sync all pending operations to Supabase
  const syncToSupabase = useCallback(async () => {
    if (!isOnline || !user || isSyncing) return;

    const syncs = getPendingSyncs();
    if (syncs.length === 0) return;

    setIsSyncing(true);
    const successfulSyncs: string[] = [];

    for (const sync of syncs) {
      try {
        if (sync.action === 'insert') {
          const { error } = await supabase
            .from(sync.table as 'crop_plans' | 'crop_disease_reports' | 'chat_logs' | 'saved_schemes')
            .insert(sync.data as never);
          if (!error) successfulSyncs.push(sync.id);
        } else if (sync.action === 'update') {
          const { id, ...updateData } = sync.data;
          const { error } = await supabase
            .from(sync.table as 'crop_plans' | 'crop_disease_reports' | 'chat_logs' | 'saved_schemes')
            .update(updateData as never)
            .eq('id', id as string);
          if (!error) successfulSyncs.push(sync.id);
        } else if (sync.action === 'delete') {
          const { error } = await supabase
            .from(sync.table as 'crop_plans' | 'crop_disease_reports' | 'chat_logs' | 'saved_schemes')
            .delete()
            .eq('id', sync.data.id as string);
          if (!error) successfulSyncs.push(sync.id);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    }

    // Remove successful syncs
    const remainingSyncs = syncs.filter(s => !successfulSyncs.includes(s.id));
    savePendingSyncs(remainingSyncs);

    if (successfulSyncs.length > 0) {
      toast({
        title: 'Data synced',
        description: `${successfulSyncs.length} item(s) synced successfully`,
      });
    }

    setIsSyncing(false);
  }, [isOnline, user, isSyncing, getPendingSyncs, savePendingSyncs]);

  // Online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Your data will now sync',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Data will be saved locally',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial count
    setPendingCount(getPendingSyncs().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getPendingSyncs]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      syncToSupabase();
    }
  }, [isOnline, user, syncToSupabase]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    addPendingSync,
    saveOfflineData,
    getOfflineData,
    syncToSupabase,
  };
};
