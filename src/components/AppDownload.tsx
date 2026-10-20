import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, Apple, Download, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AppDownloadSection: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const [showHelp, setShowHelp] = useState(false);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (window.self !== window.top) {
        window.open(window.location.href, '_blank');
        return;
      }
      setShowHelp(true);
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center">
              <Check className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('download.installed') || 'App Installed!'}</h3>
              <p className="text-sm text-muted-foreground">{t('download.installed_desc') || 'You can now use the app from your home screen'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center">
            <Download className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t('download.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {t('download.description')}
        </p>

        {isIOS ? (
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">{t('download.ios_install') || 'Install on iPhone/iPad:'}</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>{t('download.ios_step1') || 'Tap the Share button'}</li>
              <li>{t('download.ios_step2') || 'Scroll and tap "Add to Home Screen"'}</li>
              <li>{t('download.ios_step3') || 'Tap "Add" to install'}</li>
            </ol>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-auto py-3 flex-col gap-1 hover:bg-foreground hover:text-background transition-colors col-span-2"
              onClick={handleInstall}
              disabled={!deferredPrompt}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-xs font-medium">
                {deferredPrompt 
                  ? (t('download.install_now') || 'Install App') 
                  : (t('download.open_browser') || 'Open in Chrome to Install')}
              </span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppDownloadSection;
