import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import CreateStrategyDialog from './CreateStrategyDialog';
afterEach(cleanup);
function start(onSave=vi.fn(),onOpenChange=vi.fn()){
 render(<CreateStrategyDialog open onOpenChange={onOpenChange} strategies={[]} onSave={onSave}/>);
 fireEvent.click(screen.getByRole('button',{name:/Консервативна стратегія/}));
 return {onSave,onOpenChange};
}
it('keeps inputs between steps and requires confirmation to discard',()=>{const {onOpenChange}=start();fireEvent.click(screen.getByRole('button',{name:'Далі'}));expect(screen.getByLabelText('Коефіцієнт від')).toHaveProperty('value','1.3');fireEvent.click(screen.getByRole('button',{name:'Назад'}));expect(screen.getByLabelText('Назва стратегії *')).toHaveProperty('value','Консервативна стратегія');fireEvent.click(screen.getByRole('button',{name:'Скасувати'}));expect(screen.getByRole('alertdialog')).toBeTruthy();expect(onOpenChange).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Продовжити редагування'}));expect(screen.getByLabelText('Назва стратегії *')).toHaveProperty('value','Консервативна стратегія');});
it('retains draft on server error and retries only on request',async()=>{const save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);const {onOpenChange}=start(save);fireEvent.click(screen.getByRole('button',{name:'Далі'}));fireEvent.click(screen.getByRole('button',{name:'Перевірити'}));fireEvent.click(screen.getByRole('button',{name:'Створити стратегію'}));await screen.findByRole('alert');expect(onOpenChange).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Створити стратегію'}));await waitFor(()=>expect(onOpenChange).toHaveBeenCalledWith(false));expect(save).toHaveBeenCalledTimes(2);expect(save.mock.calls[0][0].minOdds).toBe(1.3);});
