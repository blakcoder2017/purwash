import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForceInstall, setShowForceInstall] = useState(false);

  useEffect(() => {
    const checkPWAStatus = () => {
      // Check if app is already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
      
      const installed = isStandalone || isInWebAppiOS || isInWebAppChrome;
      setIsInstalled(installed);

      // Check if user has already been forced to install (bypass for testing)
      const bypassInstall = localStorage.getItem('bypass-pwa-install');
      
      if (!installed && !bypassInstall) {
        setShowForceInstall(true);
      }
      
      setIsLoading(false);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowForceInstall(false);
      setDeferredPrompt(null);
    };

    // Delay check to ensure proper detection
    setTimeout(checkPWAStatus, 1000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowForceInstall(false);
      } else {
        // If user dismisses, show alternative options
      }
      
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support install prompt
      // Show manual install instructions
      window.open('/install-instructions', '_blank');
    }
  };

  const handleBypass = () => {
    localStorage.setItem('bypass-pwa-install', 'true');
    setShowForceInstall(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showForceInstall) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Install Required</h1>
            
            <div className="text-left mb-6">
              <p className="text-gray-600 mb-4">
                For the best experience and full functionality, you must install the PurWash Partner app.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Why install is required:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real-time order notifications</li>
                  <li>• Offline order management</li>
                  <li>• Faster performance</li>
                  <li>• Reliable order processing</li>
                  <li>• Background order updates</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Install PurWash Partner App
                </button>
              )}
              
              <button
                onClick={handleBypass}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Continue in Browser (Limited Features)
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Installation is free and takes just a few seconds
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PWAInstallGuard;
