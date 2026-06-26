import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Database, Trash2, Eye, EyeOff } from 'lucide-react';

interface Props {
  storageSize: string;
  isExporting: boolean;
  isImporting: boolean;
  isClearing: boolean;
  showClearDialog: boolean;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearRequest: () => void;
  onClearDialogChange: (open: boolean) => void;
  onClearConfirm: () => void;
  chartCardShadow: string;
}

export default function BackupSection({
  storageSize, isExporting, isImporting, isClearing, showClearDialog,
  onExport, onImport, onClearRequest, onClearDialogChange, onClearConfirm, chartCardShadow,
}: Props) {
  return (
    <>
      <Card className="border border-[#E5E7EB] hover:border-[#D1D5DB] rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F3F4F6] rounded-xl">
              <Database className="h-5 w-5 text-[#111827]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827]">Бекап даних</p>
              <p className="text-xs text-[#9CA3AF]">Експортуйте або імпортуйте всі ваші дані</p>
            </div>
            <Badge className="ml-auto bg-[#F3F4F6] text-[#6B7280] border-0 rounded-lg font-medium text-xs px-3 py-1">{storageSize}</Badge>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-[#F0FDF4] rounded-2xl border border-[#BBF7D0]">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-[#16A34A]" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#111827]">Повний бекап</p>
                <p className="text-xs text-[#6B7280]">Збережіть всі дані в JSON-файл</p>
              </div>
            </div>
            <Button onClick={onExport} disabled={isExporting} className="rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-medium">
              {isExporting ? 'Експорт...' : 'Експорт'}
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-[#EFF6FF] rounded-2xl border border-[#BFDBFE]">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-[#3B82F6]" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-[#111827]">Відновити з бекапу</p>
                <p className="text-xs text-[#6B7280]">Завантажте раніше збережений JSON-файл</p>
              </div>
            </div>
            <label className={`rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium px-4 py-2 cursor-pointer text-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
              {isImporting ? 'Відновлення...' : 'Імпорт'}
              <input type="file" accept=".json" onChange={onImport} className="hidden" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-[#FEE2E2] rounded-3xl bg-[#FEF2F2] overflow-hidden transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FEE2E2] rounded-xl">
                <Trash2 className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#111827]">Очистити всі дані</p>
                <p className="text-xs text-[#6B7280]">Видалення всіх ставок, стратегій, цілей та налаштувань</p>
              </div>
            </div>
            <Button onClick={onClearRequest} className="rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium">
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Очистити
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={onClearDialogChange}>
        <DialogContent className="rounded-3xl border border-[#E5E7EB]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FEF2F2] rounded-2xl">
                <Trash2 className="h-5 w-5 text-[#DC2626]" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-[#111827]">Очистити всі дані</DialogTitle>
                <DialogDescription className="text-base text-[#6B7280] mt-0.5">
                  Ви впевнені? Всі ставки, стратегії, цілі та налаштування будуть безповоротно видалені.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button variant="outline" onClick={() => onClearDialogChange(false)} className="rounded-3xl border-[#E5E7EB] hover:bg-[#F9FAFB] font-medium h-11 px-5 text-base">Скасувати</Button>
            <Button onClick={onClearConfirm} disabled={isClearing} className="rounded-3xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium h-11 px-5 text-base">
              {isClearing ? 'Очищення...' : 'Очистити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
