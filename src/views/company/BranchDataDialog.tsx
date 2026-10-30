import React, { useState } from 'react';
import { X, Minus, Square } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';

interface BranchDataDialogProps {
  onClose: () => void;
}

export const BranchDataDialog: React.FC<BranchDataDialogProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [tel, setTel] = useState(db.company.tel || '');
  const [branch, setBranch] = useState(db.company.branch.includes('محل 67') ? 'محل 67' : db.company.branch || 'محل 67');
  const [wahba, setWahba] = useState<number | string>(db.company.wahba || 50);
  const [msg, setMsg] = useState('');

  const handleSave = () => {
    wholesaleStore.updateBranchInfo({
      tel,
      branch,
      wahba: Number(wahba) || 0
    });
    setMsg('تم حفظ بيانات الفرع بنجاح');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-lg bg-[#b8b8b8] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
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
            <span>بيانات الفرع</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              🏢
            </span>
          </div>
        </div>

        {/* Dialog Body (مطابق للصورة 2) */}
        <div className="p-8 flex flex-col items-center justify-center bg-[#b8b8b8] min-h-[220px]">
          {/* DataWindow Box */}
          <div className="w-full max-w-sm bg-[#c9dbe9] border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 shadow-md">
            {/* Header */}
            <div className="bg-[#b3d1ea] border-b border-slate-400 py-1 text-center text-xs font-bold text-slate-800">
              بيانات الفرع
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-3 bg-[#cde0f0] border-b border-slate-400 text-center text-xs font-bold text-slate-800">
              <div className="py-1 border-l border-slate-400">الهاتف</div>
              <div className="py-1 border-l border-slate-400">الفرع</div>
              <div className="py-1">الوهبة</div>
            </div>

            {/* Table Row (Data Inputs) */}
            <div className="grid grid-cols-3 bg-white border-b border-slate-400 text-center text-xs">
              <div className="border-l border-slate-300 p-0.5">
                <input
                  type="text"
                  value={tel}
                  onChange={e => setTel(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="w-full text-center text-xs outline-none bg-transparent"
                />
              </div>
              <div className="border-l border-slate-300 p-0.5">
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full text-center text-xs font-bold text-slate-900 outline-none bg-transparent"
                />
              </div>
              <div className="p-0.5">
                <input
                  type="number"
                  value={wahba}
                  onChange={e => setWahba(e.target.value)}
                  className="w-full text-center text-xs font-bold text-slate-900 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* حفظ Button */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              onClick={handleSave}
              className="px-8 py-1 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black font-bold text-xs text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
            >
              حفظ
            </button>

            {msg && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-400">
                {msg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
