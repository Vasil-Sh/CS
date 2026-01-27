import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Calculator, AlertTriangle, Info } from 'lucide-react';
import { googleSheetsService } from '@/lib/googleSheets';
import { realGoogleSheetsService } from '@/lib/realGoogleSheets';
import { riskyTeamsService, RiskyTeam } from '@/lib/riskyTeamsService';
import { toast } from 'sonner';

interface BettingFormProps {
  onRecordAdded?: () => void;
}

export default function BettingForm({ onRecordAdded }: BettingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Основна інформація про матч
    date: new Date().toISOString().split('T')[0],
    tournament: '',
    team1: '',
    team2: '',
    matchLink: '',
    
    // Деталі прогнозу
    betType: '',
    selection: '', // На кого/що ставимо
    odds: '',
    bookmaker: '',
    amount: '',
    currency: 'UAH',
    
    // Аналіз
    myProbability: '',
    impliedProbability: '',
    value: '',
    confidence: '',
    
    // Стратегія та ризик
    strategy: '',
    riskLevel: '',
    bankrollPercentage: '',
    
    // Причини та нотатки
    reason: '',
    keyFactors: '',
    concerns: '',
    notes: '',
    
    // Результат (заповнюється пізніше)
    result: 'Pending',
    actualResult: '',
    profit: '',
    roi: ''
  });

  // Check for risky teams when team names change
  const [teamRisks, setTeamRisks] = useState<{
    team1Risk: RiskyTeam | null;
    team2Risk: RiskyTeam | null;
  }>({ team1Risk: null, team2Risk: null });

  useEffect(() => {
    if (formData.team1 || formData.team2) {
      const risks = riskyTeamsService.checkMatchRisks(formData.team1, formData.team2);
      setTeamRisks(risks);
      
      // Auto-populate concerns field with risky team info
      const riskyTeams = [];
      if (risks.team1Risk) {
        riskyTeams.push(`${formData.team1}: ${risks.team1Risk.notes || risks.team1Risk.status}`);
      }
      if (risks.team2Risk) {
        riskyTeams.push(`${formData.team2}: ${risks.team2Risk.notes || risks.team2Risk.status}`);
      }
      
      if (riskyTeams.length > 0 && !formData.concerns) {
        setFormData(prev => ({
          ...prev,
          concerns: riskyTeams.join('\n')
        }));
      }
    }
  }, [formData.team1, formData.team2]);

  const calculateImpliedProbability = (odds: number) => {
    if (odds > 0) {
      return ((1 / odds) * 100).toFixed(1);
    }
    return '0';
  };

  const calculateValue = () => {
    const odds = parseFloat(formData.odds);
    const myProb = parseFloat(formData.myProbability);
    
    if (odds && myProb) {
      const impliedProb = (1 / odds) * 100;
      const value = myProb - impliedProb;
      return value.toFixed(1);
    }
    return '0';
  };

  const calculateBankrollPercentage = () => {
    const amount = parseFloat(formData.amount);
    const bankroll = 10000; // Можна зробити налаштовуваним
    
    if (amount && bankroll) {
      return ((amount / bankroll) * 100).toFixed(1);
    }
    return '0';
  };

  const handleOddsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      odds: value,
      impliedProbability: calculateImpliedProbability(parseFloat(value))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const record = {
        // Основна інформація
        date: formData.date,
        match: `${formData.team1} vs ${formData.team2}`,
        tournament: formData.tournament,
        team1: formData.team1,
        team2: formData.team2,
        matchLink: formData.matchLink,
        
        // Деталі прогнозу
        betType: formData.betType,
        selection: formData.selection,
        odds: parseFloat(formData.odds),
        bookmaker: formData.bookmaker,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        
        // Аналіз
        myProbability: parseFloat(formData.myProbability),
        impliedProbability: parseFloat(formData.impliedProbability),
        value: parseFloat(calculateValue()),
        confidence: formData.confidence,
        
        // Стратегія
        strategy: formData.strategy,
        riskLevel: formData.riskLevel,
        bankrollPercentage: parseFloat(calculateBankrollPercentage()),
        
        // Причини
        reason: formData.reason,
        keyFactors: formData.keyFactors,
        concerns: formData.concerns,
        notes: formData.notes,
        
        // Результат
        result: 'Pending',
        actualResult: '',
        profit: 0,
        roi: 0
      };

      // Prepare riskyTeam field based on detected risks
      let riskyTeamField = 'Немає';
      const riskyTeams = [];
      if (teamRisks.team1Risk) {
        riskyTeams.push(formData.team1);
      }
      if (teamRisks.team2Risk) {
        riskyTeams.push(formData.team2);
      }
      if (riskyTeams.length > 0) {
        riskyTeamField = riskyTeams.join(', ');
      }

      // Додаємо до обох сервісів для сумісності
      await googleSheetsService.addBettingRecord({
        date: formData.date,
        matchLink: formData.matchLink,
        match: `${formData.team1} vs ${formData.team2}`,
        risk: formData.riskLevel,
        strategyCompliance: 'Так',
        betType: formData.betType,
        reason: formData.reason,
        odds: parseFloat(formData.odds),
        myProbability: parseFloat(formData.myProbability),
        value: parseFloat(calculateValue()),
        amount: parseFloat(formData.amount),
        result: 'Очікується',
        riskyTeam: riskyTeamField
      });

      await realGoogleSheetsService.addRecord(record);
      
      toast.success('Запис успішно додано до системи!');
      
      // Очищаємо форму
      setFormData({
        date: new Date().toISOString().split('T')[0],
        tournament: '',
        team1: '',
        team2: '',
        matchLink: '',
        betType: '',
        selection: '',
        odds: '',
        bookmaker: '',
        amount: '',
        currency: 'UAH',
        myProbability: '',
        impliedProbability: '',
        value: '',
        confidence: '',
        strategy: '',
        riskLevel: '',
        bankrollPercentage: '',
        reason: '',
        keyFactors: '',
        concerns: '',
        notes: '',
        result: 'Pending',
        actualResult: '',
        profit: '',
        roi: ''
      });
      setTeamRisks({ team1Risk: null, team2Risk: null });

      onRecordAdded?.();
    } catch (error) {
      toast.error('Помилка при додаванні запису');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = calculateValue();
  const isValuePositive = parseFloat(value) > 0;
  const bankrollPerc = calculateBankrollPercentage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Додати новий запис
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основна інформація про матч */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📅 Інформація про матч</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="tournament">Турнір</Label>
                <Input
                  id="tournament"
                  value={formData.tournament}
                  onChange={(e) => setFormData({...formData, tournament: e.target.value})}
                  placeholder="ESL Pro League, BLAST Premier..."
                />
              </div>
              
              <div>
                <Label htmlFor="matchLink">Посилання на матч</Label>
                <Input
                  id="matchLink"
                  value={formData.matchLink}
                  onChange={(e) => setFormData({...formData, matchLink: e.target.value})}
                  placeholder="https://hltv.org/match/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="team1">Команда 1</Label>
                <Input
                  id="team1"
                  value={formData.team1}
                  onChange={(e) => setFormData({...formData, team1: e.target.value})}
                  placeholder="NAVI"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="team2">Команда 2</Label>
                <Input
                  id="team2"
                  value={formData.team2}
                  onChange={(e) => setFormData({...formData, team2: e.target.value})}
                  placeholder="G2"
                  required
                />
              </div>
            </div>

            {/* Risky Teams Warning */}
            {(teamRisks.team1Risk || teamRisks.team2Risk) && (
              <Alert className="rounded-2xl border-2 border-orange-300 bg-orange-50">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-bold text-orange-900">⚠️ Попередження про ризикові команди!</p>
                    
                    {teamRisks.team1Risk && (
                      <div className="p-3 bg-white rounded-xl border-2 border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">{formData.team1}</span>
                          <Badge className={riskyTeamsService.getStatusColor(teamRisks.team1Risk.status)}>
                            {riskyTeamsService.getStatusIcon(teamRisks.team1Risk.status)} {teamRisks.team1Risk.status}
                          </Badge>
                        </div>
                        {teamRisks.team1Risk.notes && (
                          <p className="text-sm text-gray-700">{teamRisks.team1Risk.notes}</p>
                        )}
                      </div>
                    )}
                    
                    {teamRisks.team2Risk && (
                      <div className="p-3 bg-white rounded-xl border-2 border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">{formData.team2}</span>
                          <Badge className={riskyTeamsService.getStatusColor(teamRisks.team2Risk.status)}>
                            {riskyTeamsService.getStatusIcon(teamRisks.team2Risk.status)} {teamRisks.team2Risk.status}
                          </Badge>
                        </div>
                        {teamRisks.team2Risk.notes && (
                          <p className="text-sm text-gray-700">{teamRisks.team2Risk.notes}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2 p-2 bg-orange-100 rounded-lg mt-2">
                      <Info className="h-4 w-4 text-orange-700 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-800 font-medium">
                        Ця інформація автоматично додана до поля "Ризики та занепокоєння". Ви можете редагувати її за потреби.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Деталі прогнозу */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">💰 Деталі прогнозу</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="betType">Тип прогнозу</Label>
                <Select value={formData.betType} onValueChange={(value) => setFormData({...formData, betType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть тип прогнозу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Match Winner">Переможець матчу</SelectItem>
                    <SelectItem value="Map Winner">Переможець карти</SelectItem>
                    <SelectItem value="Total Maps">Тотал карт</SelectItem>
                    <SelectItem value="Handicap">Фора</SelectItem>
                    <SelectItem value="First Map">Перша карта</SelectItem>
                    <SelectItem value="Pistol Round">Пістолетний раунд</SelectItem>
                    <SelectItem value="Over/Under Rounds">Тотал раундів</SelectItem>
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
                  value={formData.odds}
                  onChange={(e) => handleOddsChange(e.target.value)}
                  placeholder="1.65"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bookmaker">Букмекер</Label>
                <Select value={formData.bookmaker} onValueChange={(value) => setFormData({...formData, bookmaker: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Букмекер" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bet365">Bet365</SelectItem>
                    <SelectItem value="Pinnacle">Pinnacle</SelectItem>
                    <SelectItem value="1xBet">1xBet</SelectItem>
                    <SelectItem value="GG.bet">GG.bet</SelectItem>
                    <SelectItem value="Parimatch">Parimatch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Сума</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Валюта</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UAH">UAH</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Аналіз */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Аналіз</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="myProbability">Моя ймовірність (%)</Label>
                <Input
                  id="myProbability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.myProbability}
                  onChange={(e) => setFormData({...formData, myProbability: e.target.value})}
                  placeholder="70"
                  required
                />
              </div>

              <div>
                <Label htmlFor="impliedProbability">Ймовірність букмекера (%)</Label>
                <Input
                  id="impliedProbability"
                  value={formData.impliedProbability}
                  readOnly
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="confidence">Впевненість</Label>
                <Select value={formData.confidence} onValueChange={(value) => setFormData({...formData, confidence: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Рівень впевненості" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низька</SelectItem>
                    <SelectItem value="Medium">Середня</SelectItem>
                    <SelectItem value="High">Висока</SelectItem>
                    <SelectItem value="Very High">Дуже висока</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>% від банкролу</Label>
                <div className="p-2 bg-gray-50 rounded text-sm">
                  {bankrollPerc}%
                </div>
              </div>
            </div>
          </div>

          {/* Стратегія та ризик */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🎯 Стратегія</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strategy">Стратегія</Label>
                <Select value={formData.strategy} onValueChange={(value) => setFormData({...formData, strategy: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть стратегію" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Strategy">Основна стратегія</SelectItem>
                    <SelectItem value="Underdog">Стратегія андердогів</SelectItem>
                    <SelectItem value="Totals">Тотали та фори</SelectItem>
                    <SelectItem value="Live Betting">Лайв прогнози</SelectItem>
                    <SelectItem value="Experimental">Експериментальна</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="riskLevel">Рівень ризику</Label>
                <Select value={formData.riskLevel} onValueChange={(value) => setFormData({...formData, riskLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть ризик" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низький</SelectItem>
                    <SelectItem value="Medium">Середній</SelectItem>
                    <SelectItem value="High">Високий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Причини та аналіз */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📝 Аналіз та причини</h3>
            
            <div>
              <Label htmlFor="reason">Основна причина прогнозу</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Чому ви робите цей прогноз? Основні аргументи..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyFactors">Ключові фактори</Label>
                <Textarea
                  id="keyFactors"
                  value={formData.keyFactors}
                  onChange={(e) => setFormData({...formData, keyFactors: e.target.value})}
                  placeholder="Форма команд, статистика, мотивація..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="concerns">Ризики та занепокоєння</Label>
                <Textarea
                  id="concerns"
                  value={formData.concerns}
                  onChange={(e) => setFormData({...formData, concerns: e.target.value})}
                  placeholder="Що може пійти не так..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Додаткові нотатки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Будь-які додаткові коментарі..."
                rows={2}
              />
            </div>
          </div>

          {/* Розрахунки */}
          {formData.odds && formData.myProbability && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Автоматичні розрахунки
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Value:</span>
                  <Badge variant={isValuePositive ? 'default' : 'destructive'}>
                    {isValuePositive ? '+' : ''}{value}%
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Потенційний виграш:</span>
                  <span className="font-medium">
                    {formData.amount ? (parseFloat(formData.amount) * parseFloat(formData.odds || '0')).toFixed(2) : '0'} {formData.currency}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Потенційний профіт:</span>
                  <span className="font-medium text-green-600">
                    +{formData.amount ? ((parseFloat(formData.amount) * parseFloat(formData.odds || '0')) - parseFloat(formData.amount)).toFixed(2) : '0'} {formData.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Додавання запису...' : 'Додати запис до системи'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}