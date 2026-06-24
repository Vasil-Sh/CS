import { createRoot } from 'react-dom/client';
import { Component, type ReactNode } from 'react';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataService } from './lib/userDataService';
import './index.css';

// Repair any user-scoped keys corrupted by old backup import
UserDataService.repairAllUserKeys();

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
