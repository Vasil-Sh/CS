import { createRoot } from 'react-dom/client';
import { Component, type ReactNode } from 'react';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataService } from './lib/userDataService';
import { validateEnv, getMissingEnvVars } from './lib/envValidation';
import { initErrorMonitoring } from './lib/errorMonitor';
import './index.css';

// Validate environment variables
const env = validateEnv();
if (import.meta.env.DEV) {
  const missing = getMissingEnvVars(env);
  if (missing.length > 0) console.warn('[Env] Missing optional vars:', missing);
}

// Repair any user-scoped keys corrupted by old backup import
UserDataService.repairAllUserKeys();

// In dev mode, aggressively unregister any stale service worker to prevent caching issues
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) {
      reg.unregister();
      console.log('[Dev] Unregistered stale SW:', reg.scope);
    }
  });
  // Also clear any Vite-related caches
  if ('caches' in window) {
    caches.keys().then(names => {
      for (const name of names) {
        if (name.includes('workbox') || name.includes('vite')) {
          caches.delete(name);
          console.log('[Dev] Deleted cache:', name);
        }
      }
    });
  }
}

// Initialize error monitoring in production
if (import.meta.env.PROD) initErrorMonitoring();

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold">Щось пішло не так</h1>
            <p className="text-muted-foreground">Будь ласка, оновіть сторінку</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Оновити
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
