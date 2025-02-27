import { useEffect } from 'react';
import { useAuth } from '../lib/auth';

export function AdsenseScript() {
  const { user } = useAuth();

  useEffect(() => {
    // Always check for and remove any existing script first
    const existingScript = document.getElementById('adsense-script');
    if (existingScript) {
      existingScript.remove();
    }

  }, [user]);

  return null;
}