import type { RiskyTeam } from '@/data/riskyTeams';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newTeam: RiskyTeam;
  onTeamChange: (team: RiskyTeam) => void;
  onAdd: () => void;
}

export default function AddTeamDialog({ open, onOpenChange, newTeam, onTeamChange, onAdd }: Props) {
  return (
    <div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
          <div className="relative bg-white rounded-3xl border border-[#E5E7EB] p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Додати ризиковану команду</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#374151]">Назва команди</label>
                <input
                  value={newTeam.name}
                  onChange={(e) => onTeamChange({ ...newTeam, name: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
                  placeholder="NAVI, G2, Vitality..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Гра</label>
                <select
                  value={newTeam.game}
                  onChange={(e) => onTeamChange({ ...newTeam, game: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
                >
                  <option value="CS">CS</option>
                  <option value="Дота">Дота</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Статус</label>
                <select
                  value={newTeam.status}
                  onChange={(e) => onTeamChange({ ...newTeam, status: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
                >
                  <option value="БАН">БАН</option>
                  <option value="Нестабільні">Нестабільні</option>
                  <option value="Обережно">Обережно</option>
                  <option value="Рідко">Рідко</option>
                  <option value="Надійна">Надійна</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#374151]">Нотатки</label>
                <textarea
                  value={newTeam.notes}
                  onChange={(e) => onTeamChange({ ...newTeam, notes: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm h-20 resize-none"
                  placeholder="Причина додавання команди..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]">Скасувати</button>
              <button onClick={onAdd} disabled={!newTeam.name.trim()} className="flex-1 h-11 rounded-2xl bg-[#447afc] text-sm font-semibold text-white hover:bg-[#3568d4] disabled:opacity-50">Додати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
