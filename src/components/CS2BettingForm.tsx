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

interface BetRecord {
  date: string;
  match: string;
  team1: string;
  team2: string;
  tournament: string;
  format: string;
  matchUrl: string;
  betType: string;
  odds: number;
  amount: number;
  originalAmount: number;
  currency: string;
  exchangeRate: number | null;
  result: 'Pending';
  profit: number;
  roi: number;
  strategy: string;
  riskyTeams: RiskyTeam[];
  notes: string;
}

export default function CS2BettingForm({ onRecordAdded }: CS2BettingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingMatch, setIsParsingMatch] = useState(false);
  const [lastAddedBet, setLastAddedBet] = useState<BetRecord | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    matchUrl: '',
    tournament: '',
    team1: '',
    team2: '',
    format: 'BO3',
    riskyTeams: [] as RiskyTeam[],
    betType: '',
    betCategory: 'Ординар',
    selection: '',
    odds: '',
    stake: '',
    currency: 'UAH',
    exchangeRate: '41',
    bookmaker: '',
    confidence: '',
    strategy: '',
    reasoning: '',
    keyFactors: '',
    riskLevel: '',
    notes: ''
  });

  const loadRiskyTeamsFromStorage = (): RiskyTeam[] => {
    try {
      const saved = localStorage.getItem('riskyTeams');
      if (saved) {
        const savedTeams = JSON.parse(saved) as RiskyTeam[];
        return savedTeams.map((team: RiskyTeam) => ({
          name: team.name,
          comment: team.comment
        }));
      }
    } catch (error) {
      console.error('Error loading risky teams from storage:', error);
    }
    return [];
  };

  const parseMatchFromUrl = async (url: string) => {
    setIsParsingMatch(true);
    try {
      const urlParts = url.split('/');
      const matchInfo = urlParts[urlParts.length - 1];
      
      if (matchInfo) {
        const parts = matchInfo.split('-');
        const vsIndex = parts.findIndex(part => part === 'vs');
        
        if (vsIndex > 0 && vsIndex < parts.length - 1) {
          const team1Parts = parts.slice(0, vsIndex);
          const team1 = team1Parts.join(' ').toUpperCase();
          const afterVs = parts.slice(vsIndex + 1);
          
          const tournamentKeywords = [
            'esl', 'pro', 'league', 'season',
            'blast', 'premier', 'spring', 'fall', 'groups', 'finals',
            'iem', 'katowice', 'cologne', 'sydney', 'beijing',
            'major', 'championship', 'pgl', 'antwerp', 'stockholm',
            'faceit', 'london', 'eleague', 'dreamhack', 'masters',
            'nodwin', 'clutch', 'series'
          ];
          
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
            const team2Parts = afterVs.slice(0, tournamentStartIndex);
            team2 = team2Parts.join(' ').toUpperCase();
            const tournamentParts = afterVs.slice(tournamentStartIndex);
            tournament = tournamentParts.join(' ').replace(/-/g, ' ').toUpperCase();
          } else if (tournamentStartIndex === 0) {
            team2 = afterVs.slice(0, 2).join(' ').toUpperCase();
            tournament = afterVs.slice(2).join(' ').replace(/-/g, ' ').toUpperCase();
          } else {
            const midPoint = Math.ceil(afterVs.length / 2);
            team2 = afterVs.slice(0, midPoint).join(' ').toUpperCase();
            tournament = afterVs.slice(midPoint).join(' ').replace(/-/g, ' ').toUpperCase();
          }
          
          team2 = team2.replace(/\s+/g, ' ').trim();
          tournament = tournament.replace(/\s+/g, ' ').trim();
          
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
          
          const savedRiskyTeams = loadRiskyTeamsFromStorage();
          const riskyTeamsFound: RiskyTeam[] = [];
          
          savedRiskyTeams.forEach((riskyTeam: RiskyTeam) => {
            const teamName = riskyTeam.name.toLowerCase();
            const team1Lower = team1.toLowerCase();
            const team2Lower = team2.toLowerCase();
            
            if (team1Lower.includes(teamName) || teamName.includes(team1Lower) ||
                team2Lower.includes(teamName) || teamName.includes(team2Lower)) {
              riskyTeamsFound.push({
                name: riskyTeam.name,
                comment: riskyTeam.comment
              });
            }
          });
          
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

  const convertToUAH = (amount: number, currency: string, rate: number) => {
    if (currency === 'USD') {
      return amount * rate;
    }
    return amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const stakeAmount = parseFloat(formData.stake);
      const exchangeRate = parseFloat(formData.exchangeRate);
      
      const stakeInUAH = convertToUAH(stakeAmount, formData.currency, exchangeRate);
      
      const betTypeWithCategory = formData.betCategory === 'Експрес' 
        ? `${formData.betType} - ${formData.selection} (Експрес)`
        : `${formData.betType} - ${formData.selection}`;
      
      const record: BetRecord = {
        date: formData.date,
        match: `${formData.team1} vs ${formData.team2}`,
        team1: formData.team1,
        team2: formData.team2,
        tournament: formData.tournament,
        format: formData.format,
        matchUrl: formData.matchUrl,
        betType: betTypeWithCategory,
        odds: parseFloat(formData.odds),
        amount: stakeInUAH,
        originalAmount: stakeAmount,
        currency: formData.currency,
        exchangeRate: formData.currency === 'USD' ? exchangeRate : null,
        result: 'Pending' as const,
        profit: 0,
        roi: 0,
        strategy: formData.strategy,
        riskyTeams: formData.riskyTeams,
        notes: `${formData.reasoning}\n\nKey Factors: ${formData.keyFactors}\n\nNotes: ${formData.notes}`
      };

      await realGoogleSheetsService.addRecord(record);
      
      setLastAddedBet(record);
      
      toast.success('Ставка успішно додана!');
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        matchUrl: '',
        tournament: '',
        team1: '',
        team2: '',
        format: 'BO3',
        riskyTeams: [],
        betType: '',
        betCategory: 'Ординар',
        selection: '',
        odds: '',
        stake: '',
        currency: 'UAH',
        exchangeRate: '41',
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

  const getCurrencySymbol = () => {
    return formData.currency === 'USD' ? '$' : '₴';
  };

  const potentialProfitInCurrency = calculatePotentialProfit();
  const stakeInCurrency = formData.stake;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Plus className="h-5 w-5" />
                Додати нову ставку CS2
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-gray-700 font-medium">Дата матчу</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="format" className="text-gray-700 font-medium">Формат</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                      <SelectTrigger className="rounded-xl">
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

                <div>
                  <Label htmlFor="matchUrl" className="text-gray-700 font-medium">HLTV URL матчу</Label>
                  <div className="flex gap-2">
                    <Input
                      id="matchUrl"
                      value={formData.matchUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://www.hltv.org/matches/2386647/500-vs-kono-nodwin-clutch-series-1"
                      className="flex-1 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => parseMatchFromUrl(formData.matchUrl)}
                      disabled={isParsingMatch || !formData.matchUrl}
                      className="rounded-xl"
                    >
                      <Link className="h-4 w-4" />
                      {isParsingMatch ? 'Парсинг...' : 'Парсити'}
                    </Button>
                  </div>
                </div>

                {(formData.team1 || formData.team2 || formData.tournament) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-2xl">
                    <div>
                      <Label className="text-gray-700 font-medium">Команда 1</Label>
                      <div className="font-medium text-green-700">{formData.team1}</div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Команда 2</Label>
                      <div className="font-medium text-green-700">{formData.team2}</div>
                    </div>
                    <div>
                      <Label className="text-gray-700 font-medium">Турнір</Label>
                      <div className="font-medium text-green-700">{formData.tournament}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <DollarSign className="h-4 w-4" />
                    Деталі ставки
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="betCategory" className="text-gray-700 font-medium">Категорія ставки</Label>
                      <Select value={formData.betCategory} onValueChange={(value) => setFormData({...formData, betCategory: value})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ординар">Ординар</SelectItem>
                          <SelectItem value="Експрес">Експрес</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="betType" className="text-gray-700 font-medium">Тип ставки</Label>
                      <Select value={formData.betType} onValueChange={(value) => setFormData({...formData, betType: value})}>
                        <SelectTrigger className="rounded-xl">
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
                      <Label htmlFor="selection" className="text-gray-700 font-medium">Вибір</Label>
                      <Input
                        id="selection"
                        value={formData.selection}
                        onChange={(e) => setFormData({...formData, selection: e.target.value})}
                        placeholder="NAVI, Over 2.5, +1.5..."
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor="odds" className="text-gray-700 font-medium">Коефіцієнт</Label>
                      <Input
                        id="odds"
                        type="number"
                        step="0.01"
                        min="1.01"
                        value={formData.odds}
                        onChange={(e) => setFormData({...formData, odds: e.target.value})}
                        placeholder="1.65"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="currency" className="text-gray-700 font-medium">Валюта</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UAH">₴ UAH</SelectItem>
                          <SelectItem value="USD">$ USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="stake" className="text-gray-700 font-medium">Сума ставки</Label>
                      <Input
                        id="stake"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.stake}
                        onChange={(e) => setFormData({...formData, stake: e.target.value})}
                        placeholder="100"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    
                    {formData.currency === 'USD' && (
                      <div>
                        <Label htmlFor="exchangeRate" className="text-gray-700 font-medium">Курс USD/UAH</Label>
                        <Input
                          id="exchangeRate"
                          type="number"
                          step="0.01"
                          min="1"
                          value={formData.exchangeRate}
                          onChange={(e) => setFormData({...formData, exchangeRate: e.target.value})}
                          placeholder="41.00"
                          required
                          className="rounded-xl"
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="confidence" className="text-gray-700 font-medium">Впевненість (%)</Label>
                      <Input
                        id="confidence"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.confidence}
                        onChange={(e) => setFormData({...formData, confidence: e.target.value})}
                        placeholder="70"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bookmaker" className="text-gray-700 font-medium">Букмекер</Label>
                      <Select value={formData.bookmaker} onValueChange={(value) => setFormData({...formData, bookmaker: value})}>
                        <SelectTrigger className="rounded-xl">
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
                  
                  {formData.currency === 'USD' && formData.stake && formData.exchangeRate && (
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700 font-medium">Сума в UAH (для аналітики):</span>
                        <span className="font-semibold text-blue-900">
                          ₴{convertToUAH(parseFloat(formData.stake), formData.currency, parseFloat(formData.exchangeRate)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium"
                >
                  {isSubmitting ? 'Додавання...' : 'Додати ставку'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {formData.odds && formData.stake && formData.confidence && (
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Calculator className="h-4 w-4" />
                  Розрахунки
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Потенційний прибуток:</span>
                  <span className="font-semibold text-green-600">+{potentialProfitInCurrency} {getCurrencySymbol()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Expected Value:</span>
                  <Badge className={`rounded-full border-0 ${isValuePositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isValuePositive ? '+' : ''}{expectedValue}%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Макс. програш:</span>
                  <span className="font-semibold text-red-600">-{stakeInCurrency} {getCurrencySymbol()}</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Рекомендація</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {isValuePositive ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Позитивна очікувана вартість - рекомендована ставка
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Негативна очікувана вартість - обережно
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {formData.riskyTeams.length > 0 && (
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Ризиковані команди
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.riskyTeams.map((riskyTeam, index) => (
                    <div key={index} className="p-3 border border-red-100 rounded-2xl bg-red-50 space-y-2">
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
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0 rounded-xl"
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

      {lastAddedBet && (
        <Card className="border-0 shadow-lg rounded-3xl bg-green-50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 text-lg font-semibold">
              <Trophy className="h-5 w-5" />
              Ставка успішно додана!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-green-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{lastAddedBet.match}</span>
                </div>
                <Badge className="rounded-full bg-gray-100 text-gray-700 border-0">{lastAddedBet.betType}</Badge>
                <Badge className="rounded-full bg-blue-100 text-blue-700 border-0">{lastAddedBet.format}</Badge>
                {lastAddedBet.currency && (
                  <Badge className="rounded-full bg-purple-100 text-purple-700 border-0">
                    {lastAddedBet.currency}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600 font-medium">{lastAddedBet.date}</span>
                <span className="font-medium text-gray-900">
                  {lastAddedBet.currency === 'USD' ? '$' : '₴'}{lastAddedBet.originalAmount}
                </span>
                <span className="text-gray-600">@{lastAddedBet.odds}</span>
                <Badge className="rounded-full bg-yellow-100 text-yellow-700 border-0">Очікується</Badge>
                <span className="text-green-600 font-semibold">
                  +{((lastAddedBet.odds - 1) * lastAddedBet.originalAmount).toFixed(2)} {lastAddedBet.currency === 'USD' ? '$' : '₴'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}