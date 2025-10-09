import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calculator, DollarSign, Link, AlertTriangle, Calendar, Trophy, Target, TrendingUp } from 'lucide-react';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { toast } from 'sonner';

interface CS2BettingFormProps {
  onRecordAdded?: () => void;
}

interface RiskyTeam {
  name: string;
  comment: string;
}

export default function CS2BettingForm({ onRecordAdded }: CS2BettingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingMatch, setIsParsingMatch] = useState(false);
  const [lastAddedBet, setLastAddedBet] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Основна інформація про матч
    date: new Date().toISOString().split('T')[0],
    matchUrl: '',
    tournament: '',
    team1: '',
    team2: '',
    format: 'BO3',
    
    // Ризиковані команди
    riskyTeams: [] as RiskyTeam[],
    
    // Інформація про ставку
    betType: '',
    selection: '',
    odds: '',
    stake: '',
    bookmaker: '',
    
    // Аналіз
    confidence: '',
    strategy: '',
    reasoning: '',
    keyFactors: '',
    
    // Ризик-менеджмент
    riskLevel: '',
    
    // Додаткова інформація
    notes: ''
  });

  // Функція для завантаження ризикованих команд з localStorage
  const loadRiskyTeamsFromStorage = () => {
    try {
      const saved = localStorage.getItem('riskyTeams');
      if (saved) {
        const savedTeams = JSON.parse(saved);
        return savedTeams.map((team: any) => ({
          name: team.name,
          comment: team.comment
        }));
      }
    } catch (error) {
      console.error('Error loading risky teams from storage:', error);
    }
    return [];
  };

  // Покращений парсинг інформації з HLTV URL
  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      // URL format: https://www.hltv.org/matches/2386647/500-vs-kono-nodwin-clutch-series-1
      const urlParts = url.split('/');
      const matchInfo = urlParts[urlParts.length - 1];
      
      if (matchInfo) {
        const parts = matchInfo.split('-');
        
        // Знаходимо індекс "vs"
        const vsIndex = parts.findIndex(part => part === 'vs');
        
        if (vsIndex > 0 && vsIndex < parts.length - 1) {
          // Команда 1: все до "vs"
          const team1Parts = parts.slice(0, vsIndex);
          const team1 = team1Parts.join(' ').toUpperCase();
          
          // Решта після "vs"
          const afterVs = parts.slice(vsIndex + 1);
          
          // Відомі турніри та їх варіанти
          const tournamentKeywords = [
            'esl', 'pro', 'league', 'season',
            'blast', 'premier', 'spring', 'fall', 'groups', 'finals',
            'iem', 'katowice', 'cologne', 'sydney', 'beijing',
            'major', 'championship', 'pgl', 'antwerp', 'stockholm',
            'faceit', 'london', 'eleague', 'dreamhack', 'masters',
            'nodwin', 'clutch', 'series'
          ];
          
          // Знаходимо початок турніру
          let tournamentStartIndex = -1;
          for (let i = 0; i < afterVs.length; i++) {
            if (tournamentKeywords.some(keyword => 
              afterVs[i].toLowerCase().includes(keyword.toLowerCase())
            )) {
              tournamentStartIndex = i;
              break;
            }
          }
          
          let team2, tournament;
          
          if (tournamentStartIndex > 0) {
            // Команда 2: від початку до турніру
            const team2Parts = afterVs.slice(0, tournamentStartIndex);
            team2 = team2Parts.join(' ').toUpperCase();
            
            // Турнір: решта
            const tournamentParts = afterVs.slice(tournamentStartIndex);
            tournament = tournamentParts.join(' ').replace(/-/g, ' ').toUpperCase();
          } else if (tournamentStartIndex === 0) {
            // Якщо турнір починається відразу після команди
            // Беремо перші 1-2 слова як команду
            team2 = afterVs.slice(0, 2).join(' ').toUpperCase();
            tournament = afterVs.slice(2).join(' ').replace(/-/g, ' ').toUpperCase();
          } else {
            // Fallback: розділяємо навпіл
            const midPoint = Math.ceil(afterVs.length / 2);
            team2 = afterVs.slice(0, midPoint).join(' ').toUpperCase();
            tournament = afterVs.slice(midPoint).join(' ').replace(/-/g, ' ').toUpperCase();
          }
          
          // Очищення назв
          team2 = team2.replace(/\s+/g, ' ').trim();
          tournament = tournament.replace(/\s+/g, ' ').trim();
          
          // Покращення назв турнірів
          tournament = tournament
            .replace(/ESL PRO LEAGUE/g, 'ESL Pro League')
            .replace(/BLAST PREMIER/g, 'BLAST Premier')
            .replace(/IEM /g, 'IEM ')
            .replace(/SEASON (\d+)/g, 'Season $1')
            .replace(/NODWIN CLUTCH SERIES/g, 'NODWIN Clutch Series');
          
          setFormData(prev => ({
            ...prev,
            team1: team1,
            team2: team2,
            tournament: tournament || 'Unknown Tournament'
          }));
          
          // Завантажуємо ризиковані команди з localStorage
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          console.log('Saved risky teams:', savedRiskyTeams);
          console.log('Team1:', team1, 'Team2:', team2);
          
          // Автоматично додаємо ризиковані команди якщо вони є в списку
          const riskyTeamsFound: RiskyTeam[] = [];
          
          savedRiskyTeams.forEach((riskyTeam: any) => {
            const teamName = riskyTeam.name.toLowerCase();
            const team1Lower = team1.toLowerCase();
            const team2Lower = team2.toLowerCase();
            
            console.log(`Checking team: ${teamName} against ${team1Lower} and ${team2Lower}`);
            
            // Перевіряємо точне співпадіння або часткове співпадіння
            if (team1Lower.includes(teamName) || teamName.includes(team1Lower) ||
                team2Lower.includes(teamName) || teamName.includes(team2Lower)) {
              console.log(`Found risky team: ${riskyTeam.name}`);
              riskyTeamsFound.push({
                name: riskyTeam.name,
                comment: riskyTeam.comment
              });
            }
          });
          
          console.log('Risky teams found:', riskyTeamsFound);
          
          if (riskyTeamsFound.length > 0) {
            setFormData(prev => ({
              ...prev,
              riskyTeams: riskyTeamsFound
            }));
            toast.warning(`Знайдено ${riskyTeamsFound.length} ризикованих команд!`);
          }
          
          toast.success('Інформацію про матч успішно отримано!');
        } else {
          toast.error('Не вдалося знайти "vs" у посиланні');
        }
      }
    } catch (error) {
      toast.error('Помилка при парсингу URL матчу');
      console.error(error);
    } finally {
      setIsParsingMatch(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, matchUrl: url }));
    
    // Автоматично парсимо URL якщо він схожий на HLTV
    if (url.includes('hltv.org/matches/')) {
      parseMatchFromUrl(url);
    }
  };

  const removeRiskyTeam = (index: number) => {
    setFormData(prev => ({
      ...prev,
      riskyTeams: prev.riskyTeams.filter((_, i) => i !== index)
    }));
  };

  const calculateExpectedValue = () => {
    const odds = parseFloat(formData.odds);
    const confidence = parseFloat(formData.confidence);
    
    if (odds && confidence) {
      const impliedProbability = (1 / odds) * 100;
      const expectedValue = ((confidence / 100) * (odds - 1)) - ((1 - confidence / 100) * 1);
      return (expectedValue * 100).toFixed(2);
    }
    return '0';
  };

  const calculatePotentialProfit = () => {
    const odds = parseFloat(formData.odds);
    const stake = parseFloat(formData.stake);
    
    if (odds && stake) {
      return ((odds - 1) * stake).toFixed(2);
    }
    return '0';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const record = {
        date: formData.date,
        match: `${formData.team1} vs ${formData.team2}`,
        team1: formData.team1,
        team2: formData.team2,
        tournament: formData.tournament,
        format: formData.format,
        matchUrl: formData.matchUrl,
        betType: `${formData.betType} - ${formData.selection}`,
        odds: parseFloat(formData.odds),
        amount: parseFloat(formData.stake),
        result: 'Pending' as const,
        profit: 0,
        roi: 0,
        strategy: formData.strategy,
        riskyTeams: formData.riskyTeams,
        notes: `${formData.reasoning}\n\nKey Factors: ${formData.keyFactors}\n\nNotes: ${formData.notes}`
      };

      await realGoogleSheetsService.addRecord(record);
      
      // Зберігаємо додану ставку для відображення
      setLastAddedBet(record);
      
      toast.success('Ставка успішно додана!');
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        matchUrl: '',
        tournament: '',
        team1: '',
        team2: '',
        format: 'BO3',
        riskyTeams: [],
        betType: '',
        selection: '',
        odds: '',
        stake: '',
        bookmaker: '',
        confidence: '',
        strategy: '',
        reasoning: '',
        keyFactors: '',
        riskLevel: '',
        notes: ''
      });

      onRecordAdded?.();
    } catch (error) {
      toast.error('Помилка при додаванні ставки');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const expectedValue = calculateExpectedValue();
  const potentialProfit = calculatePotentialProfit();
  const isValuePositive = parseFloat(expectedValue) > 0;

  return (
    <div className="space-y-6">
      {/* Основна форма */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ліва колонка - Основна інформація */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Додати нову ставку CS2
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Дата та URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Дата матчу</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="format">Формат</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BO1">BO1</SelectItem>
                        <SelectItem value="BO3">BO3</SelectItem>
                        <SelectItem value="BO5">BO5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* HLTV URL */}
                <div>
                  <Label htmlFor="matchUrl">HLTV URL матчу</Label>
                  <div className="flex gap-2">
                    <Input
                      id="matchUrl"
                      value={formData.matchUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://www.hltv.org/matches/2386647/500-vs-kono-nodwin-clutch-series-1"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => parseMatchFromUrl(formData.matchUrl)}
                      disabled={isParsingMatch || !formData.matchUrl}
                    >
                      <Link className="h-4 w-4" />
                      {isParsingMatch ? 'Парсинг...' : 'Парсити'}
                    </Button>
                  </div>
                </div>

                {/* Автоматично заповнена інформація */}
                {(formData.team1 || formData.team2 || formData.tournament) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                    <div>
                      <Label>Команда 1</Label>
                      <div className="font-medium text-green-700">{formData.team1}</div>
                    </div>
                    <div>
                      <Label>Команда 2</Label>
                      <div className="font-medium text-green-700">{formData.team2}</div>
                    </div>
                    <div>
                      <Label>Турнір</Label>
                      <div className="font-medium text-green-700">{formData.tournament}</div>
                    </div>
                  </div>
                )}

                {/* Деталі ставки */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Деталі ставки
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="betType">Тип ставки</Label>
                      <Select value={formData.betType} onValueChange={(value) => setFormData({...formData, betType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть тип ставки" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Match Winner">Переможець матчу</SelectItem>
                          <SelectItem value="Map Winner">Переможець карти</SelectItem>
                          <SelectItem value="Total Maps">Тотал карт</SelectItem>
                          <SelectItem value="Handicap">Фора</SelectItem>
                          <SelectItem value="First Map">Перша карта</SelectItem>
                          <SelectItem value="Pistol Round">Пістолетний раунд</SelectItem>
                          <SelectItem value="Total Rounds">Тотал раундів</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="selection">Вибір</Label>
                      <Input
                        id="selection"
                        value={formData.selection}
                        onChange={(e) => setFormData({...formData, selection: e.target.value})}
                        placeholder="NAVI, Over 2.5, +1.5..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="odds">Коефіцієнт</Label>
                      <Input
                        id="odds"
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={formData.odds}
                        onChange={(e) => setFormData({...formData, odds: e.target.value})}
                        placeholder="1.65"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stake">Сума ставки (₴)</Label>
                      <Input
                        id="stake"
                        type="number"
                        min="1"
                        value={formData.stake}
                        onChange={(e) => setFormData({...formData, stake: e.target.value})}
                        placeholder="100"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confidence">Впевненість (%)</Label>
                      <Input
                        id="confidence"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.confidence}
                        onChange={(e) => setFormData({...formData, confidence: e.target.value})}
                        placeholder="70"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bookmaker">Букмекер</Label>
                      <Select value={formData.bookmaker} onValueChange={(value) => setFormData({...formData, bookmaker: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Parimatch">Parimatch</SelectItem>
                          <SelectItem value="1xBet">1xBet</SelectItem>
                          <SelectItem value="FavBet">FavBet</SelectItem>
                          <SelectItem value="Bet365">Bet365</SelectItem>
                          <SelectItem value="GG.bet">GG.bet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? 'Додавання...' : 'Додати ставку'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Права колонка - Розрахунки та ризиковані команди */}
        <div className="space-y-6">
          {/* Розрахунки */}
          {formData.odds && formData.stake && formData.confidence && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Розрахунки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Потенційний прибуток:</span>
                  <span className="font-semibold text-green-600">+{potentialProfit} ₴</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expected Value:</span>
                  <Badge variant={isValuePositive ? 'default' : 'destructive'}>
                    {isValuePositive ? '+' : ''}{expectedValue}%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Макс. програш:</span>
                  <span className="font-semibold text-red-600">-{formData.stake} ₴</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Рекомендація</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {isValuePositive ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Позитивна очікувана вартість - рекомендована ставка
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Негативна очікувана вартість - обережно
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ризиковані команди - тільки відображення */}
          {formData.riskyTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Ризиковані команди
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.riskyTeams.map((riskyTeam, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-red-50 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="font-medium text-red-800">{riskyTeam.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRiskyTeam(index)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          ✕
                        </Button>
                      </div>
                      <p className="text-xs text-red-700">{riskyTeam.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Щойно додана ставка */}
      {lastAddedBet && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Trophy className="h-5 w-5" />
              Ставка успішно додана!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{lastAddedBet.match}</span>
                </div>
                <Badge variant="outline">{lastAddedBet.betType}</Badge>
                <Badge variant="secondary">{lastAddedBet.format}</Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">{lastAddedBet.date}</span>
                <span className="font-medium">₴{lastAddedBet.amount}</span>
                <span className="text-gray-600">@{lastAddedBet.odds}</span>
                <Badge variant="secondary">Очікується</Badge>
                <span className="text-green-600 font-medium">
                  +{((lastAddedBet.odds - 1) * lastAddedBet.amount).toFixed(2)} ₴
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}