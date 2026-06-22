import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';

interface CalendarHeatmapProps {
  data: { date: string; count: number; profit: number }[];
}

export default function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-green-200';
    if (count === 2) return 'bg-green-300';
    if (count >= 3) return 'bg-green-500';
    return 'bg-gray-100';
  };

  const getColor = (profit: number) => {
    if (profit > 0) return 'bg-green-500';
    if (profit < 0) return 'bg-red-500';
    return 'bg-gray-300';
  };

  // Генеруємо останні 12 тижнів
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 84); // 12 тижнів назад

    for (let week = 0; week < 12; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = data.find(d => d.date === dateStr) || { date: dateStr, count: 0, profit: 0 };
        
        weekDays.push({
          date: currentDate,
          dateStr,
          count: dayData.count,
          profit: dayData.profit
        });
      }
      weeks.push(weekDays);
    }
    return weeks;
  };

  const weeks = generateWeeks();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-[#EFF6FF] rounded-xl">
            <Calendar className="h-5 w-5 text-[#447afc]" strokeWidth={1.5} />
          </div>
          Календар активності
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="space-y-1">
                {week.map((day, dayIndex) => (
                  <TooltipProvider key={`${weekIndex}-${dayIndex}`}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={`w-3 h-3 rounded-sm ${
                            day.count > 0 ? getColor(day.profit) : 'bg-gray-100'
                          } hover:ring-2 hover:ring-gray-300 transition-all`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">
                            {day.date.toLocaleDateString('uk-UA', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </p>
                          <p>{day.count} ставок</p>
                          {day.profit !== 0 && (
                            <p className={day.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                              {day.profit > 0 ? '+' : ''}{day.profit.toFixed(2)} ₴
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Менше</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm" />
              <div className="w-3 h-3 bg-green-200 rounded-sm" />
              <div className="w-3 h-3 bg-green-300 rounded-sm" />
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
            </div>
            <span>Більше</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}