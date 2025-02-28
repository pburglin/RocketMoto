import { useEffect } from 'react';
import { useAuth } from '../lib/auth';

export function AdsenseScript() {
  const { user } = useAuth();

  useEffect(() => {
    // Check if the user is signed in
    if (user) {
      // If the user is signed in, remove the adsense script
      const existingScript = document.getElementById('adsense-script');
      if (existingScript) {
        existingScript.remove();
      }
    }
  }, [user]);

  return null;
}