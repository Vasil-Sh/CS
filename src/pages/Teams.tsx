import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Users
} from 'lucide-react';
import TeamAnalysis from '@/components/TeamAnalysis';
import csharpDataService from '@/services/csharp-data-service';

interface DatabaseTeam {
  id: number;
  name: string;
  position: number;
  points: number;
  hltvId: number;
}

export default function Teams() {
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, environment: 'Browser' });
  const [databaseTeams, setDatabaseTeams] = useState<DatabaseTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    updateConnectionStatus();
  }, []);

  const updateConnectionStatus = () => {
    const status = csharpDataService.getConnectionStatus();
    setConnectionStatus(status);
  };

  // Load teams from database
  const loadTeamsFromDatabase = async () => {
    try {
      setTeamsLoading(true);
      console.log('🔄 Завантаження команд з бази даних...');
      
      const teamsData = await csharpDataService.getTeamsData();
      console.log('✅ Команди завантажено з C# backend:', teamsData);
      
      setDatabaseTeams(teamsData as DatabaseTeam[]);
    } catch (error) {
      console.error('❌ Помилка завантаження команд:', error);
      // Clear teams data on error
      setDatabaseTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Аналіз команд
          </h1>
          <p className="text-gray-600">Детальний аналіз команд CS2 з інтеграцією C# backend</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={updateConnectionStatus} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Перевірити підключення
          </Button>
          <Button 
            onClick={loadTeamsFromDatabase} 
            disabled={teamsLoading}
            className="flex items-center gap-2"
          >
            {teamsLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Database className="h-4 w-4" />
            )}
            {teamsLoading ? 'Завантаження...' : 'Завантажити команди з бази'}
          </Button>
        </div>
      </div>

      {/* Backend Connection Status */}
      <Alert className={connectionStatus.connected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <div className="flex items-center gap-2">
          {connectionStatus.connected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-yellow-600" />}
          <Database className="h-4 w-4" />
        </div>
        <AlertDescription>
          <strong>Backend Status:</strong> {connectionStatus.environment} 
          {connectionStatus.connected ? 
            ' - З\'єднано з C# SQLite базою даних команд' : 
            ' - Немає підключення до бази даних команд'
          }
        </AlertDescription>
      </Alert>

      {/* Database Teams Status */}
      {databaseTeams.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Завантажено команд з бази:</strong> {databaseTeams.length} команд успішно завантажено з C# backend
          </AlertDescription>
        </Alert>
      )}

      {/* No Data Warning */}
      {!connectionStatus.connected && databaseTeams.length === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>Рекомендація:</strong> Підключіть C# backend для завантаження актуальних даних команд з бази даних.
          </AlertDescription>
        </Alert>
      )}

      <TeamAnalysis />
    </div>
  );
}