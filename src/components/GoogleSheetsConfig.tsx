import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, ExternalLink, Key } from 'lucide-react';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { SPREADSHEET_ID_DATA, SHEETS_VIEW_URL } from '@/lib/sheetsConfig';
import { toast } from 'sonner';

export default function GoogleSheetsConfig() {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error('Будь ласка, введіть API ключ');
      return;
    }

    setIsConnecting(true);
    try {
      realGoogleSheetsService.setApiKey(apiKey);
      
      // Test connection by trying to fetch data
      await realGoogleSheetsService.fetchUSDTData();
      
      setIsConnected(true);
      toast.success('Успішно підключено до Google Sheets!');
      
      // Save API key to localStorage (in production, use more secure storage)
      localStorage.setItem('google_sheets_api_key', apiKey);
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Помилка підключення. Перевірте API ключ.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setApiKey('');
    setIsConnected(false);
    localStorage.removeItem('google_sheets_api_key');
    toast.success('Відключено від Google Sheets');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Налаштування Google Sheets
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            Для підключення до вашого Google Sheets потрібен API ключ. 
            <Button variant="link" className="p-0 h-auto" asChild>
              <a 
                href="https://console.developers.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1"
              >
                Отримати API ключ <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Google Sheets API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Введіть ваш API ключ..."
            disabled={isConnected}
          />
        </div>

        <div className="space-y-2">
          <Label>ID вашого документа</Label>
          <div className="p-2 bg-gray-50 rounded text-sm font-mono">
            {SPREADSHEET_ID_DATA}
          </div>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? 'Підключення...' : 'Підключитися'}
            </Button>
          ) : (
            <Button 
              onClick={handleDisconnect} 
              variant="outline"
              className="flex-1"
            >
              Відключитися
            </Button>
          )}
          
          <Button variant="outline" asChild>
            <a 
              href={SHEETS_VIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {isConnected && (
          <Alert>
            <AlertDescription className="text-green-600">
              ✅ Успішно підключено до вашого Google Sheets документа
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}