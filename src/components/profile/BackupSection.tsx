import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Database, Trash2 } from 'lucide-react';

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
      <Card className="border border-gray-200 hover:border-gray-300 rounded-3xl bg-white overflow-hidden transition-all duration-300" style={{ boxShadow: chartCardShadow }}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl">
              <Database className="h-5 w-5 text-gray-900" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Бекап даних</p>
              <p className="text-xs text-gray-400">Експортуйте або імпортуйте всі ваші дані</p>
            </div>
            <Badge className="ml-auto bg-gray-100 text-gray-500 border-0 rounded-lg font-medium text-xs px-3 py-1">{storageSize}</Badge>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-200">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-green-600" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-gray-900">Повний бекап</p>
                <p className="text-xs text-gray-500">Збережіть всі дані в JSON-файл</p>
              </div>
            </div>
            <Button onClick={onExport} disabled={isExporting} className="rounded-xl bg-green-600 hover:bg-[#15803D] text-white font-medium">
              {isExporting ? 'Експорт...' : 'Експорт'}
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-gray-900">Відновити з бекапу</p>
                <p className="text-xs text-gray-500">Завантажте раніше збережений JSON-файл</p>
              </div>
            </div>
            <label className={`rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 cursor-pointer text-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
              {isImporting ? 'Відновлення...' : 'Імпорт'}
              <input type="file" accept=".json" onChange={onImport} className="hidden" />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-[#FEE2E2] rounded-3xl bg-red-50 overflow-hidden transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#FEE2E2] rounded-xl">
                <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Очистити всі дані</p>
                <p className="text-xs text-gray-500">Видалення всіх ставок, стратегій, цілей та налаштувань</p>
              </div>
            </div>
            <Button onClick={onClearRequest} className="rounded-xl bg-red-600 hover:bg-[#B91C1C] text-white font-medium">
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Очистити
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={onClearDialogChange}>
        <DialogContent className="rounded-3xl border border-gray-200">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-2xl">
                <Trash2 className="h-5 w-5 text-red-600" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">Очистити всі дані</DialogTitle>
                <DialogDescription className="text-base text-gray-500 mt-0.5">
                  Ви впевнені? Всі ставки, стратегії, цілі та налаштування будуть безповоротно видалені.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-3 border-t border-gray-200">
            <Button variant="outline" onClick={() => onClearDialogChange(false)} className="rounded-3xl border-gray-200 hover:bg-gray-50 font-medium h-11 px-5 text-base">Скасувати</Button>
            <Button onClick={onClearConfirm} disabled={isClearing} className="rounded-3xl bg-red-600 hover:bg-[#B91C1C] text-white font-medium h-11 px-5 text-base">
              {isClearing ? 'Очищення...' : 'Очистити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
