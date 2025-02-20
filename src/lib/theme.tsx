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

  useEffect(() => {
    // Initialize theme from profile
    if (profile?.theme) {
      setThemeState(profile.theme as Theme);
      document.documentElement.classList.toggle('dark', profile.theme === 'dark');
    }
  }, [profile]);

  async function setTheme(newTheme: Theme) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ theme: newTheme })
        .eq('id', user.id);

      if (error) throw error;

      setThemeState(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
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