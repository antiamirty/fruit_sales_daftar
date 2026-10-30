import React, { useState } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';
import { OwnerSahbRecord } from '../../types/schema';

interface OwnerWithdrawalsDialogProps {
  onClose: () => void;
}

export const OwnerWithdrawalsDialog: React.FC<OwnerWithdrawalsDialogProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [currentDate, setCurrentDate] = useState('2026/10/11');
  const [withdrawals, setWithdrawals] = useState<OwnerSahbRecord[]>(
    db.owner_sahb_records && db.owner_sahb_records.length > 0
      ? db.owner_sahb_records
      : [
          { id: 1, code: 2, owner_name: 'محل ابو حسن', amount: 15000, date: '2026/10/11' }
        ]
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [msg, setMsg] = useState('');

  const handleDateSpin = (days: number) => {
    try {
      const parts = currentDate.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setCurrentDate(`${y}/${m}/${day}`);
      }
    } catch {
      // fallback
    }
  };

  const handleAddRow = () => {
    const nextId = withdrawals.reduce((max, d) => Math.max(max, d.id || 0), 0) + 1;
    const defaultOwner = db.owners?.[0]?.name || 'محل ابو حسن';
    const defaultCode = db.owners?.[0]?.code || 2;
    const newRecords = [
      ...withdrawals,
      { id: nextId, code: defaultCode, owner_name: defaultOwner, amount: 0, date: currentDate }
    ];
    setWithdrawals(newRecords);
    setSelectedIndex(newRecords.length - 1);
  };

  const handleDeleteRow = () => {
    if (withdrawals.length === 0) return;
    const targetIdx = selectedIndex >= 0 && selectedIndex < withdrawals.length ? selectedIndex : withdrawals.length - 1;
    const newRecords = withdrawals.filter((_, idx) => idx !== targetIdx);
    setWithdrawals(newRecords);
    setSelectedIndex(Math.max(0, newRecords.length - 1));
  };

  const handleUpdate = (idx: number, field: keyof OwnerSahbRecord, value: any) => {
    const updated = [...withdrawals];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'owner_name') {
      const match = db.owners.find(o => o.name === value);
      if (match) updated[idx].code = match.code;
    }
    setWithdrawals(updated);
  };

  const handleSave = () => {
    wholesaleStore.saveOwnerSahbRecords(withdrawals);
    setMsg('تم حفظ مسحوبات الشركاء بنجاح');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-2xl bg-[#b8b8b8] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#8ca8cb] via-[#b8cde4] to-[#8ca8cb] border-b border-slate-500 px-2 py-1 flex items-center justify-between">
          {/* أزرار التحكم بالنافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] hover:bg-rose-600 hover:text-white border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="إغلاق"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            <button
              className="w-5 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تكبير"
            >
              <Square className="w-2 h-2" />
            </button>
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* العنوان والأيقونة على اليسار */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>مسحوبات الشركاء</span>
            <span className="w-3.5 h-3.5 rounded-full bg-rose-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              💸
            </span>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-6 bg-[#b8b8b8] flex flex-col gap-3 min-h-[300px]">
          {/* Top Date Picker */}
          <div className="flex items-center justify-start">
            <div className="flex items-center bg-white border-2 border-slate-700 px-3 py-0.5 shadow-inner">
              <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                {currentDate}
              </span>
            </div>
          </div>

          {/* Main Area: Buttons on right + Cyan DataWindow Table */}
          <div className="flex items-start gap-4">
            {/* Buttons on Right */}
            <div className="flex flex-col gap-2 pt-5">
              <button
                onClick={handleAddRow}
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                title="إضافة سطر مسحوبات جديد"
              >
                +
              </button>

              <button
                onClick={handleDeleteRow}
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                title="حذف سطر المسحوبات"
              >
                -
              </button>

              <button
                onClick={handleSave}
                className="px-4 py-1 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              >
                حفظ
              </button>

              <button
                onClick={() => window.print()}
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center text-slate-800 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                title="طباعة إيصال السحب"
              >
                <Printer className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* DataWindow Table */}
            <div className="flex-1 bg-[#498b8b] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-md">
              {/* Header Box */}
              <div className="bg-[#b3d1ea] border-b border-slate-500 py-1 px-2 text-right text-xs font-bold text-slate-900">
                مسحوبات الشركاء
              </div>

              {/* Table Column Titles */}
              <div className="grid grid-cols-4 bg-[#cde0f0] border-b border-slate-500 text-center text-xs font-bold text-slate-900">
                <div className="py-1 border-l border-slate-400">التاريخ</div>
                <div className="py-1 border-l border-slate-400">المبلغ</div>
                <div className="py-1 border-l border-slate-400">الشريك</div>
                <div className="py-1">الكود</div>
              </div>

              {/* Rows inside Cyan Workspace */}
              <div className="min-h-[160px] max-h-[240px] overflow-y-auto bg-[#498b8b] p-1 space-y-1">
                {withdrawals.map((rec, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`grid grid-cols-4 text-xs items-center border ${
                        isSelected
                          ? 'bg-[#1a4f82] text-white border-amber-300'
                          : 'bg-white/95 text-slate-900 border-slate-400 hover:bg-white'
                      }`}
                    >
                      {/* التاريخ */}
                      <div className="border-l border-slate-300 p-0.5">
                        <input
                          type="text"
                          value={rec.date}
                          onChange={e => handleUpdate(idx, 'date', e.target.value)}
                          className={`w-full text-center outline-none bg-transparent ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        />
                      </div>

                      {/* المبلغ */}
                      <div className="border-l border-slate-300 p-0.5">
                        <input
                          type="number"
                          value={rec.amount || ''}
                          onChange={e => handleUpdate(idx, 'amount', Number(e.target.value))}
                          placeholder="المبلغ"
                          className={`w-full text-center font-bold outline-none bg-transparent ${
                            isSelected ? 'text-white' : 'text-rose-900'
                          }`}
                        />
                      </div>

                      {/* الشريك */}
                      <div className="border-l border-slate-300 p-0.5">
                        <select
                          value={rec.owner_name}
                          onChange={e => handleUpdate(idx, 'owner_name', e.target.value)}
                          className={`w-full text-right outline-none bg-transparent text-xs ${
                            isSelected ? 'text-white bg-[#1a4f82]' : 'text-slate-900 bg-white'
                          }`}
                        >
                          {db.owners.map((o, oIdx) => (
                            <option key={`with_owner_${o.code}_${oIdx}`} value={o.name}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* الكود */}
                      <div className="p-0.5 text-center font-bold">
                        {rec.code}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div className="bg-emerald-100 border-t border-emerald-400 py-1 text-center text-xs font-bold text-emerald-800">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
};
