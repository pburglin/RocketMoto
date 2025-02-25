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

    // Only inject script for non-authenticated users
    if (!user) {
      const script = '<script id="adsense-script" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8932288265943816" crossorigin="anonymous"></script>';
      document.head.insertAdjacentHTML('beforeend', script);
    }
  }, [user]);

  return null;
}