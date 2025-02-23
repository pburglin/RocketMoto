import React, { useState, useEffect, useMemo } from 'react';
import { Download, Share } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type Platform = 'ios' | 'chrome' | 'other';

interface AddToHomescreenProps {
  className?: string;
}

export function AddToHomescreen({ className }: AddToHomescreenProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const platform = useMemo<Platform>(() => {
    if (typeof window === 'undefined') return 'other';
    
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      return 'ios';
    }
    if (ua.includes('chrome')) {
      return 'chrome';
    }
    return 'other';
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }, []);

  useEffect(() => {
    if (platform !== 'chrome' || isStandalone) return;

    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt for the next time
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (isStandalone || platform === 'other') return null;

  if (platform === 'ios') {
    return (
      <>
        <button
          onClick={() => setShowIOSInstructions(true)}
          className={`text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center ${className}`}
        >
          <Share className="h-5 w-5 mr-2" />
          Add to Home Screen
        </button>

        {showIOSInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add to Home Screen
              </h3>
              <ol className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>1. Tap the <Share className="h-5 w-5 inline mx-1" /> Share button</li>
                <li>2. Scroll down and tap "Add to Home Screen"</li>
                <li>3. Tap "Add" to confirm</li>
              </ol>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (platform === 'chrome' && isInstallable) {
    return (
      <button
        onClick={handleInstall}
        className={`text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center ${className}`}
      >
        <Download className="h-5 w-5 mr-2" />
        Add to Home Screen
      </button>
    );
  }

  return null;
}