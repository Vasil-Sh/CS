import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface Props {
  searchQuery: string;
  riskFilter: string;
  sortBy: 'roi' | 'profit' | 'name';
  sortOrder: 'asc' | 'desc';
  onSearchChange: (v: string) => void;
  onRiskFilterChange: (v: string) => void;
  onSortByChange: (v: 'roi' | 'profit' | 'name') => void;
  onSortOrderToggle: () => void;
}

/** Pure component: filter/search/sort controls for strategy list */
export default function StrategyFilters({
  searchQuery, riskFilter, sortBy, sortOrder,
  onSearchChange, onRiskFilterChange, onSortByChange, onSortOrderToggle,
}: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} />
            <Input placeholder="Пошук стратегій..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 rounded-xl border-gray-200" />
          </div>

          <Select value={riskFilter} onValueChange={onRiskFilterChange}>
            <SelectTrigger className="w-full md:w-48 rounded-xl border-gray-200">
              <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
              <SelectValue placeholder="Фільтр за ризиком" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі рівні ризику</SelectItem>
              <SelectItem value="Low">Низький ризик</SelectItem>
              <SelectItem value="Medium">Середній ризик</SelectItem>
              <SelectItem value="High">Високий ризик</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as 'roi' | 'profit' | 'name')}>
            <SelectTrigger className="w-full md:w-48 rounded-xl border-gray-200">
              <ArrowUpDown className="h-4 w-4 mr-2" strokeWidth={1.5} />
              <SelectValue placeholder="Сортування" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">За ROI</SelectItem>
              <SelectItem value="profit">За прибутком</SelectItem>
              <SelectItem value="name">За назвою</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onSortOrderToggle} className="rounded-xl border-gray-200">
            {sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      </div>
    </div>
  );
}
