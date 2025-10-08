import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import MatchCard from '@/components/MatchCard';
import StatsChart from '@/components/StatsChart';
import { mockMatches, mockTeams } from '@/data/mockData';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Target, 
  Layout, 
  Settings, 
  Download, 
  Upload, 
  RefreshCw,
  Save,
  Eye,
  Grid3X3,
  RotateCcw,
  Check
} from 'lucide-react';

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

export default function Dashboard() {
  const [settings, setSettings] = useState<UISettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('widgets');

  const upcomingMatches = mockMatches.filter(match => match.status === 'upcoming');
  const safeRecommendations = mockMatches.filter(match => match.prediction.recommendation === 'safe').length;
  
  const teamPerformanceData = mockTeams.map(team => ({
    name: team.name,
    winRate: team.winRate,
    rating: team.rating * 100
  }));

  const recentMatchesData = [
    { date: '01.10', matches: 12, predictions: 9 },
    { date: '02.10', matches: 8, predictions: 6 },
    { date: '03.10', matches: 15, predictions: 11 },
    { date: '04.10', matches: 10, predictions: 8 },
    { date: '05.10', matches: 14, predictions: 10 },
    { date: '06.10', matches: 9, predictions: 7 },
  ];

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ui-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
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

  const saveSettings = () => {
    localStorage.setItem('ui-settings', JSON.stringify(settings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('ui-settings');
  };

  const exportSettings = () => {
    const exportData = { settings };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cs2-analytics-ui-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          if (importData.settings) setSettings(importData.settings);
        } catch (error) {
          console.error('Error importing settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const updateSetting = (key: keyof UISettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: keyof UISettings['showSections']) => {
    setSettings(prev => ({
      ...prev,
      showSections: {
        ...prev.showSections,
        [section]: !prev.showSections[section]
      }
    }));
  };

  const getCardSizeClass = () => {
    switch (settings.cardSize) {
      case 'compact': return 'p-3';
      case 'large': return 'p-8';
      default: return 'p-6';
    }
  };

  if (previewMode) {
    return (
      <div className="space-y-6" style={{ 
        fontSize: `${settings.fontSize}px`,
        fontFamily: settings.fontFamily 
      }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: settings.primaryColor }}>
              Панель управління (Preview)
            </h1>
            <p style={{ color: settings.secondaryColor }}>
              Огляд аналітики CS2 матчів та рекомендацій
            </p>
          </div>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Вийти з Preview
          </Button>
        </div>

        {/* Preview Content with Applied Settings */}
        {settings.showSections.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className={getCardSizeClass()} style={{ borderRadius: `${settings.borderRadius}px` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Сьогоднішні матчі</CardTitle>
                <Trophy className="h-4 w-4" style={{ color: settings.secondaryColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                  {upcomingMatches.length}
                </div>
                <p className="text-xs" style={{ color: settings.secondaryColor }}>
                  +2 порівняно з вчора
                </p>
              </CardContent>
            </Card>

            <Card className={getCardSizeClass()} style={{ borderRadius: `${settings.borderRadius}px` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Безпечні ставки</CardTitle>
                <TrendingUp className="h-4 w-4" style={{ color: settings.secondaryColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: settings.accentColor }}>
                  {safeRecommendations}
                </div>
                <p className="text-xs" style={{ color: settings.secondaryColor }}>
                  Високий рівень впевненості
                </p>
              </CardContent>
            </Card>

            <Card className={getCardSizeClass()} style={{ borderRadius: `${settings.borderRadius}px` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Відстежувані команди</CardTitle>
                <Users className="h-4 w-4" style={{ color: settings.secondaryColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: settings.primaryColor }}>
                  {mockTeams.length}
                </div>
                <p className="text-xs" style={{ color: settings.secondaryColor }}>
                  Топ команди світу
                </p>
              </CardContent>
            </Card>

            <Card className={getCardSizeClass()} style={{ borderRadius: `${settings.borderRadius}px` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Точність прогнозів</CardTitle>
                <Target className="h-4 w-4" style={{ color: settings.secondaryColor }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: settings.accentColor }}>78%</div>
                <p className="text-xs" style={{ color: settings.secondaryColor }}>
                  За останній місяць
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {settings.showSections.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsChart
              title="Продуктивність команд"
              data={teamPerformanceData}
              dataKey="winRate"
              xAxisKey="name"
              color={settings.accentColor}
            />
            
            <StatsChart
              title="Активність прогнозування"
              data={recentMatchesData}
              type="line"
              dataKey="predictions"
              xAxisKey="date"
              color={settings.primaryColor}
            />
          </div>
        )}

        {settings.showSections.matches && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: settings.primaryColor }}>
                Найближчі матчі
              </h2>
              <Badge variant="secondary">{upcomingMatches.length} матчів</Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingMatches.slice(0, 4).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Панель управління
        </h1>
        <p className="text-gray-600">Налаштування інтерфейсу та персоналізація</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Віджет Система
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Загальні налаштування
          </TabsTrigger>
        </TabsList>

        {/* Widget System */}
        <TabsContent value="widgets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Система віджетів та Preview</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewMode(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveSettings}>
                <Save className="h-4 w-4 mr-2" />
                Зберегти
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Система віджетів
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Layout className="h-4 w-4" />
                <AlertDescription>
                  <strong>Віджет система в розробці</strong><br />
                  Тут буде drag & drop інтерфейс для налаштування компонентів dashboard.
                  Функції: перетягування віджетів, зміна розмірів, додавання нових компонентів.
                </AlertDescription>
              </Alert>
              
              <div className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Grid3X3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Drag & Drop Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Перетягуйте віджети для створення персонального dashboard
                </p>
                <Button variant="outline" disabled>
                  <Layout className="h-4 w-4 mr-2" />
                  Активувати конструктор (скоро)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Відображення секцій
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showStats">Статистичні картки</Label>
                  <Switch
                    id="showStats"
                    checked={settings.showSections.stats}
                    onCheckedChange={() => toggleSection('stats')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showCharts">Графіки та діаграми</Label>
                  <Switch
                    id="showCharts"
                    checked={settings.showSections.charts}
                    onCheckedChange={() => toggleSection('charts')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showMatches">Найближчі матчі</Label>
                  <Switch
                    id="showMatches"
                    checked={settings.showSections.matches}
                    onCheckedChange={() => toggleSection('matches')}
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="cardSize">Розмір карток</Label>
                  <Select value={settings.cardSize} onValueChange={(value: 'compact' | 'standard' | 'large') => updateSetting('cardSize', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Компактні</SelectItem>
                      <SelectItem value="standard">Стандартні</SelectItem>
                      <SelectItem value="large">Великі</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Import/Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Управління налаштуваннями
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Експорт
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <label htmlFor="import-settings" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Імпорт
                    </label>
                  </Button>
                  <input
                    id="import-settings"
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </div>

                <Button variant="outline" onClick={resetSettings} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Скинути до стандартних
                </Button>

                <Button onClick={saveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Зберегти всі налаштування
                </Button>

                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    Налаштування автоматично зберігаються в localStorage браузера
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}