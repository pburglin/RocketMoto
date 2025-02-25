import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize theme from local storage or profile
    try {
      const storedTheme = localStorage.getItem('theme');
      const initialTheme = profile?.theme || storedTheme || 'light';
      setThemeState(initialTheme as Theme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    setIsInitialized(true);
  }, []);

  // Sync profile theme with local storage when profile loads
  useEffect(() => {
    if (isInitialized && profile?.theme) {
      try {
        localStorage.setItem('theme', profile.theme);
        setThemeState(profile.theme as Theme);
        document.documentElement.classList.toggle('dark', profile.theme === 'dark');
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    }
  }, [profile, isInitialized]);

  async function setTheme(newTheme: Theme) {
    if (!user) return;

    try {
      // Update local storage first for immediate feedback
      localStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');

      // Then update the database
      const { error } = await supabase
        .from('users')
        .update({ theme: newTheme })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}