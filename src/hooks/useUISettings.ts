import { useState, useEffect } from 'react';

interface UISettings {
  theme: 'light' | 'dark' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  cardSize: 'compact' | 'standard' | 'large';
  showSections: {
    stats: boolean;
    charts: boolean;
    matches: boolean;
  };
  customCSS: string;
}

const defaultSettings: UISettings = {
  theme: 'light',
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  fontFamily: 'Inter',
  fontSize: 14,
  borderRadius: 8,
  cardSize: 'standard',
  showSections: {
    stats: true,
    charts: true,
    matches: true
  },
  customCSS: ''
};

export function useUISettings() {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ui-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading UI settings:', error);
      }
    }
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--secondary', settings.secondaryColor);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--border-radius', `${settings.borderRadius}px`);
    
    // Apply theme class
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${settings.theme}`);
    
    // Apply custom CSS
    let customStyleElement = document.getElementById('custom-css');
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'custom-css';
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = settings.customCSS;
  }, [settings]);

  const getCardSizeClass = () => {
    switch (settings.cardSize) {
      case 'compact': return 'p-3';
      case 'large': return 'p-8';
      default: return 'p-6';
    }
  };

  return {
    settings,
    setSettings,
    getCardSizeClass
  };
}