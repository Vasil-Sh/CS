import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import StrategyDetailsDialog from './StrategyDetailsDialog';
afterEach(cleanup);
const strategy={name:'Тестова',description:'Опис',riskLevel:'Low' as const,expectedROI:8,criteria:['Аналіз форми'],minOdds:1.3,maxOdds:1.8,activityLimits:{enabled:true,blockAfterLosses:3,blockDurationMinutes:60,actionMode:'warning' as const}};
it('shows honest empty metrics and warning-mode protection',()=>{render(<StrategyDetailsDialog open onOpenChange={()=>{}} strategy={strategy} stats={undefined} isPrimary bets={[]}/>);expect(screen.getByText('Ще немає розрахованих ставок.')).toBeTruthy();expect(screen.getByText('Режим попередження — без блокування додавання ставок.')).toBeTruthy();expect(screen.getAllByText('—')).toHaveLength(3);fireEvent.click(screen.getByRole('button',{name:'Усі правила'}));expect(screen.getByText('Аналіз форми')).toBeTruthy();});
it('closes overview before opening editor',()=>{const close=vi.fn(),edit=vi.fn();render(<StrategyDetailsDialog open onOpenChange={close} strategy={strategy} stats={undefined} isPrimary onEdit={edit}/>);fireEvent.click(screen.getByRole('button',{name:'Редагувати стратегію'}));expect(close).toHaveBeenCalledWith(false);expect(edit).toHaveBeenCalledWith(strategy);});
