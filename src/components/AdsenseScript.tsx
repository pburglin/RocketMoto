import { useEffect } from 'react';
import { useAuth } from '../lib/auth';

export function AdsenseScript() {
  const { user } = useAuth();

  useEffect(() => {
    // Only inject script for non-authenticated users
    if (!user) {
      const script = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8932288265943816" crossorigin="anonymous"></script>';
      document.head.insertAdjacentHTML('beforeend', script);
    } else {
      // Remove script if it exists when user becomes authenticated
      const existingScript = document.getElementById('adsense-script');
      if (existingScript) {
        existingScript.remove();
      }
    }
  }, [user]);

  return null;
}