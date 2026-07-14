import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value: string; // DD/MM/YYYY format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Оберіть дату', className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse DD/MM/YYYY string to Date
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  const selectedDate = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'dd/MM/yyyy'));
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal rounded-xl border-gray-200 h-10',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
          {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span className="text-gray-400">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={uk}
          initialFocus
          defaultMonth={selectedDate || new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}