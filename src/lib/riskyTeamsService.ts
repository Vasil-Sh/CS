// Service for managing risky teams list
export interface RiskyTeam {
  name: string;
  game: string;
  status: string;
  notes: string;
}

const INITIAL_RISKY_TEAMS: RiskyTeam[] = [
  { name: 'Liquid', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Fish123', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Passion Ua', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Nemiga', game: 'CS', status: 'БАН', notes: '' },
  { name: 'Team Falcons', game: 'Дота', status: 'БАН', notes: 'В якій би не були вони формі, ніколи на них не ставити!!!!' },
  { name: 'Tyloo', game: 'CS', status: 'Рідко', notes: 'Рідко коли вистрілює як команда - хіба проти слабких опонентів' },
  { name: 'Mouz', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Не можна на них ставити коли грають у плей ін, тільки стадія відбору!' },
  { name: 'Parivision', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд. Уникати коли грають проти: 1.BB' },
  { name: 'Tundra', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5. Уникати коли грають проти: Xtreme Gaming' },
  { name: 'Aurora', game: 'Дота', status: 'БАН', notes: 'Уникати цю команду' },
  { name: 'Team Spirit', game: 'Дота', status: 'Обережно', notes: 'Не на загальну перемогу, тому тільки на +1.5, це команда клоунів і тому ризик того не вартий. Не ставити коли вони грають проти: Парі - BB - Falcons' },
  { name: 'B8', game: 'CS', status: 'Обережно', notes: 'Проти сильніших команд - краще не варто ставити - але на 1 карту з форою можна взяти' },
  { name: 'Furia', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти' },
  { name: 'Virtuspro', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток' },
  { name: 'Monte', game: 'CS', status: 'БАН', notes: 'Раки - дуже рідко на них варто щось ставити хіба якийсь виняток - також варто пропускати матчі коли вони грають з рівними командами' },
  { name: 'Astralis', game: 'CS', status: 'Нестабільні', notes: 'Максимально нестабільні - Не на загальну перемогу, тільки на вибіркові карти - і то проти слабших команд, проти рівних вони ледь вивозять. Не виправданий ризик' },
  { name: 'Falcons', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають фінал! Не дуже стабільна команда - якщо програють 1 карту то 2 можна взяти від них фору раундів, але краще брати +1.5' },
  { name: 'Bestia', game: 'CS', status: 'БАН', notes: 'Раки - краще не варто взагалі на цю команду дивитись - не стабільна команда' },
  { name: 'G2Areas', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабких команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'The Mongolz', game: 'CS', status: 'Нестабільні', notes: 'Зараз не стабільні - краще ставити проти них, або уникати їх матчі' },
  { name: 'Natus Vincere', game: 'CS', status: 'Обережно', notes: 'Не ставити на них, коли грають проти рівних команд! Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Vitality', game: 'CS', status: 'Обережно', notes: 'Не ставити коли: 1.Фінали 2. проти - Маузів, Фурії' },
  { name: 'Eternal Fire', game: 'CS', status: 'БАН', notes: 'Команда яка частіше програє, дуже погана гра від них зазвичай, краще проти них з форою на карту +1.5' },
  { name: 'Nexus', game: 'CS', status: 'Обережно', notes: 'Раки - хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Oddik', game: 'CS', status: 'Обережно', notes: 'Раки - Не на загальну перемогу, тільки на вибіркові карти, але краще проти них ставити' },
  { name: '9Z', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну перемогу, тільки на вибіркові карти - у фіналі або пів фіналах виглядають - нестабільні' },
  { name: 'Mibr', game: 'CS', status: 'БАН', notes: 'Раки - На тір 1 взагалі нічого не можуть - можна взяти коли грають локальні бразильські матчі а так то не варто на них дивитись' },
  { name: 'Parivision', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркову карту Даст - поки не дуже стабільні' },
  { name: 'Tnl', game: 'CS', status: 'БАН', notes: 'Раки - грають дуже агресивно і проти трішки кращих команд то ніколи не працює - хіба проти слабших команд' },
  { name: 'Betclic', game: 'CS', status: 'БАН', notes: 'Раки - Дуже не стабільна команда' },
  { name: 'Sangal', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Ence', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Spirit Academy', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору +4.5' },
  { name: 'Fut', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Fluxo', game: 'CS', status: 'Обережно', notes: 'Хіба проти ноунейм команд - краще на загальну перемогу брати' },
  { name: '1Win', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда - більшість вони програють' },
  { name: 'ZeroTen', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Eclot', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Fnatic', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Mouz', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Cph Wolves', game: 'CS', status: 'Обережно', notes: 'Хіба проти слабших команд і то якщо програють одну карту ставити на них з форою' },
  { name: 'Amkal', game: 'CS', status: 'БАН', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда' },
  { name: 'Wopa', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'BIG', game: 'CS', status: 'БАН', notes: 'Хіба проти слабших команд і то краще з форою' },
  { name: 'M80', game: 'CS', status: 'Нестабільні', notes: 'Краще не варто взагалі на цю команду дивитись - нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 і більше' },
  { name: 'Ninjas In Pyjamas', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'G2', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні, краще брати проти них, коли грають проти сильніших команд і рівних' },
  { name: '3Dmax', game: 'CS', status: 'Нестабільні', notes: 'Нестабільна команда, але все ж якщо то ставити на них тільки з форою +3.5 або фора на карту +1.5' },
  { name: 'Aurora', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'Nrg', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні! Не на загальну перемогу, тільки на мейн карту і то тільки на фору' },
  { name: 'Inner Circle', game: 'CS', status: 'Обережно', notes: 'Не на загальну перемогу, тільки на мейн карту і то тільки на фору. Агресивно грають і переважно це не працює - а далі в них ідеї нема якщо агресія валиться' },
  { name: 'Gamerlegion', game: 'CS', status: 'БАН', notes: 'Рандом команда - Не на загальну перемогу, якщо виграють першу карту то варто 2 від них скіпнути - краще уникати команду' },
  { name: 'Legacy', game: 'CS', status: 'Обережно', notes: 'Краще уникати проти рівних команд - можуть взяти в хороший день проти топ1, але більшість ігор програють і не варто на них ставити' },
  { name: 'Galorys', game: 'CS', status: 'Обережно', notes: 'Команда рандом - тому тільки 1.5 на них - або краще проти них' },
  { name: 'Johnny Speeds', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Gun5', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Zero Tenacity', game: 'CS', status: 'БАН', notes: 'Команда рандом - краще уникати її - хіба проти них якщо грають проти рівних собі команд' },
  { name: 'Sinners', game: 'CS', status: 'Обережно', notes: 'На загальну перемогу не варто, а от одну карту від них можна' },
  { name: 'Cybershoke', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Favbet', game: 'CS', status: 'Нестабільні', notes: 'Не дуже стабільна команда якщо грають проти рівної команди можна взяти одну карту' },
  { name: 'Faze', game: 'CS', status: 'Нестабільні', notes: 'Зараз на спаді - краще не ставити на них коли вони грають проти рівних команд' },
  { name: '9Ine', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Ecstatic', game: 'CS', status: 'Обережно', notes: 'Не на загальну від них - тільки на мейн карту і то якщо брати тільки з форою' },
  { name: 'Betera', game: 'CS', status: 'Нестабільні', notes: 'Не на загальну від них - виглядають нестабільно' },
  { name: 'Spirit', game: 'CS', status: 'Нестабільні', notes: 'Не стабільні поки! Не на загальну перемогу, тільки на вибіркові карти і то тільки на фору' },
  { name: 'GenOne', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'ARCRED', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Venom', game: 'CS', status: 'БАН', notes: 'Не ставити на цю команду, рандом команда' },
  { name: 'Novaq', game: 'CS', status: 'Обережно', notes: 'Команда однієї карти, тому тільки 1.5 на них' },
  { name: 'Bb Team', game: 'Дота', status: 'Обережно', notes: 'Одну карту від них можна брати з форою +1.5, але ризиковано коли грають проти рівних команд тому краще пропускати такі матчі' },
  { name: 'Heroic', game: 'Дота', status: 'Обережно', notes: 'Досить слабка команда, можна брати проти них загальну перемогу, але краще сейв ставка +1.5 з експресом' },
  { name: 'OG', game: 'Дота', status: 'Обережно', notes: '+1.5 проти рівної команди може зайти' }
];

class RiskyTeamsService {
  private storageKey = 'admin_risky_teams';

  getRiskyTeams(): RiskyTeam[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : INITIAL_RISKY_TEAMS;
    } catch (error) {
      console.error('Error loading risky teams:', error);
      return INITIAL_RISKY_TEAMS;
    }
  }

  // Normalize team name for comparison - removes spaces, special chars, converts to lowercase
  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/[^a-z0-9]/g, ''); // Remove special characters
  }

  checkTeamRisk(teamName: string): RiskyTeam | null {
    if (!teamName || teamName.trim() === '') {
      return null;
    }

    const teams = this.getRiskyTeams();
    const normalizedInput = this.normalizeTeamName(teamName);
    
    // First try exact match (normalized)
    let match = teams.find(team => 
      this.normalizeTeamName(team.name) === normalizedInput
    );

    // If no exact match, try partial match (input contains team name or vice versa)
    if (!match) {
      match = teams.find(team => {
        const normalizedTeam = this.normalizeTeamName(team.name);
        return normalizedInput.includes(normalizedTeam) || normalizedTeam.includes(normalizedInput);
      });
    }

    return match || null;
  }

  checkMatchRisks(team1: string, team2: string): { team1Risk: RiskyTeam | null; team2Risk: RiskyTeam | null } {
    return {
      team1Risk: this.checkTeamRisk(team1),
      team2Risk: this.checkTeamRisk(team2)
    };
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'БАН':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Нестабільні':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Обережно':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Рідко':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'БАН':
        return '🚫';
      case 'Нестабільні':
        return '⚠️';
      case 'Обережно':
        return '⚡';
      case 'Рідко':
        return '🔵';
      default:
        return '❓';
    }
  }
}

export const riskyTeamsService = new RiskyTeamsService();