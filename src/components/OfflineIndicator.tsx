import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncToSupabase } = useOfflineSync();
  const { language } = useLanguage();

  const getText = () => {
    if (language === 'marathi') {
      return {
        offline: 'ऑफलाइन',
        online: 'ऑनलाइन',
        pending: 'सिंक बाकी',
        syncing: 'सिंक होत आहे...',
      };
    } else if (language === 'hindi') {
      return {
        offline: 'ऑफलाइन',
        online: 'ऑनलाइन',
        pending: 'सिंक बाकी',
        syncing: 'सिंक हो रहा है...',
      };
    }
    return {
      offline: 'Offline',
      online: 'Online',
      pending: 'Pending sync',
      syncing: 'Syncing...',
    };
  };

  const text = getText();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2">
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1">
          <WifiOff className="h-3 w-3" />
          {text.offline}
        </Badge>
      )}
      
      {isOnline && pendingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 px-3 py-1 cursor-pointer"
          onClick={() => syncToSupabase()}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              {text.syncing}
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3" />
              {pendingCount} {text.pending}
            </>
          )}
        </Badge>
      )}
    </div>
  );
};
