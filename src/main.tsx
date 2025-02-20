import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { LocationProvider } from './lib/location';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <LocationProvider>
          <App />
        </LocationProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);