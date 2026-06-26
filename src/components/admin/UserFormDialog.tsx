interface UserData {
  telegram: string; username: string; password: string; priceMonth: string;
  startDate: string; endDate: string; isAdmin: boolean; isLocal?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  user: UserData;
  onUserChange: (user: UserData) => void;
  onSave: () => void;
}

export default function UserFormDialog({ open, onOpenChange, mode, user, onUserChange, onSave }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-3xl border border-[#E5E7EB] p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#111827] mb-4">{mode === 'add' ? 'Додати користувача' : 'Редагувати користувача'}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#374151]">Telegram</label>
            <input value={user.telegram} onChange={(e) => onUserChange({ ...user, telegram: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" placeholder="@username" />
          </div>
          <div>
            <label className="text-sm font-medium text-[#374151]">Username</label>
            <input value={user.username} onChange={(e) => onUserChange({ ...user, username: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" />
          </div>
          {mode === 'add' && (
            <div>
              <label className="text-sm font-medium text-[#374151]">Пароль</label>
              <input value={user.password} onChange={(e) => onUserChange({ ...user, password: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" type="password" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-[#374151]">Ціна / міс</label>
            <input value={user.priceMonth} onChange={(e) => onUserChange({ ...user, priceMonth: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" placeholder="₴500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#374151]">Початок</label>
              <input value={user.startDate} onChange={(e) => onUserChange({ ...user, startDate: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" placeholder="ДД/ММ/РРРР" />
            </div>
            <div>
              <label className="text-sm font-medium text-[#374151]">Кінець</label>
              <input value={user.endDate} onChange={(e) => onUserChange({ ...user, endDate: e.target.value })} className="w-full mt-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm" placeholder="ДД/ММ/РРРР" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="adminCheck" checked={user.isAdmin} onChange={(e) => onUserChange({ ...user, isAdmin: e.target.checked })} className="rounded" />
            <label htmlFor="adminCheck" className="text-sm text-[#374151]">Адміністратор</label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]">Скасувати</button>
          <button onClick={onSave} disabled={!user.telegram.trim() || !user.username.trim()} className="flex-1 h-11 rounded-2xl bg-[#447afc] text-sm font-semibold text-white hover:bg-[#3568d4] disabled:opacity-50">{mode === 'add' ? 'Додати' : 'Зберегти'}</button>
        </div>
      </div>
    </div>
  );
}
