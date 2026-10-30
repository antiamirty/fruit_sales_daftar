import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square, Printer } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';
import { Owner } from '../../types/schema';

interface OwnersDialogProps {
  onClose: () => void;
}

export const OwnersDialog: React.FC<OwnersDialogProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const initialOwners: Owner[] = (db.owners && db.owners.length > 0)
    ? db.owners
    : [
        { code: 1, name: 'أبو حسن' },
        { code: 2, name: 'محل ابو حسن' }
      ];

  // داتا ويندو الاستعراض (dw_owners) وداتا ويندو الإضافة (dw_owners_add)
  const [dataObject, setDataObject] = useState<'dw_owners' | 'dw_owners_add'>('dw_owners');
  const [browseOwners, setBrowseOwners] = useState<Owner[]>(initialOwners);
  const [addRows, setAddRows] = useState<Owner[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [msg, setMsg] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dataObject === 'dw_owners_add' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [dataObject, addRows.length]);

  // زر الإضافة (+)
  const handleAddButton = () => {
    const maxCode = browseOwners.reduce((max, o) => Math.max(max, o.code || 0), 0);

    if (dataObject === 'dw_owners_add') {
      const nextRow = addRows.length + 1;
      const nextCode = maxCode + nextRow;
      const newOwner: Owner = { code: nextCode, name: '' };
      setAddRows(prev => [...prev, newOwner]);
      setSelectedIndex(addRows.length);
      setMsg(`تم فتح سطر جديد لإضافة شريك ثانٍ (كود: ${nextCode})`);
    } else {
      setDataObject('dw_owners_add');
      const nextCode = maxCode + 1;
      const firstOwner: Owner = { code: nextCode, name: '' };
      setAddRows([firstOwner]);
      setSelectedIndex(0);
      setMsg(`فتح داتا ويندو الإضافة (dw_owners_add) - كود تلقائي: ${nextCode}`);
    }
    setTimeout(() => setMsg(''), 3500);
  };

  // زر الحذف (-)
  const handleDeleteButton = () => {
    if (dataObject === 'dw_owners') {
      setMsg('⚠️ في شاشة الاستعراض لا يمكن الحذف، الحذف والتعديل من شاشة التعديلات');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    if (addRows.length <= 1) {
      setAddRows([]);
      setDataObject('dw_owners');
      setSelectedIndex(0);
      setMsg('تم إلغاء الإضافة والرجوع لشاشة استعراض الشركاء');
    } else {
      setAddRows(prev => prev.filter((_, idx) => idx !== selectedIndex));
      setSelectedIndex(prev => Math.max(0, prev - 1));
      setMsg('تم حذف السطر من داتا ويندو الإضافة');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  // تعديل الحقول في داتا ويندو الإضافة فقط
  const handleAddRowNameChange = (idx: number, newName: string) => {
    setAddRows(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: newName };
      return next;
    });
  };

  // زر حفظ
  const handleSave = () => {
    if (dataObject === 'dw_owners') {
      setMsg('شاشة الاستعراض للقراءة فقط. لإضافة شريك اضغط (+)، وللتعديل افتح شاشة التعديلات.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    const validRows = addRows.filter(o => o.name.trim() !== '');
    if (validRows.length === 0) {
      setMsg('⚠️ يرجى كتابة اسم الشريك أولاً أو الضغط على (-) للإلغاء والعودة.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    const updated = [...browseOwners, ...validRows];
    wholesaleStore.saveOwners(updated);
    setBrowseOwners(updated);
    setDataObject('dw_owners');
    setAddRows([]);
    setSelectedIndex(updated.length - 1);
    setMsg(`✓ تم حفظ ${validRows.length} شريك جديد بنجاح والرجوع لشاشة الاستعراض.`);
    setTimeout(() => setMsg(''), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentRows = dataObject === 'dw_owners_add' ? addRows : browseOwners;
  const isAddMode = dataObject === 'dw_owners_add';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-lg bg-[#b8b8b8] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
        {/* Title Bar (Classic Windows) */}
        <div className="bg-gradient-to-r from-[#8ca8cb] via-[#b8cde4] to-[#8ca8cb] border-b border-slate-500 px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] hover:bg-rose-600 hover:text-white border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="إغلاق"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            <button
              className="w-5 h-4 bg-[#ece9d8] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تكبير"
            >
              <Square className="w-2 h-2" />
            </button>
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>{isAddMode ? 'الشركاء - إضافة شريك جديد (dw_owners_add)' : 'الشركاء (استعراض)'}</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              👥
            </span>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="p-6 bg-[#b8b8b8] flex items-start justify-center gap-4 min-h-[260px]">
          {/* Action Buttons (+ , - , حفظ , طباعة) */}
          <div className="flex flex-col gap-2 pt-6 shrink-0">
            <button
              onClick={handleAddButton}
              className={`w-10 h-8 border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer ${
                isAddMode ? 'bg-amber-100 ring-1 ring-amber-400' : 'bg-[#ece9d8] hover:bg-white'
              }`}
              title={isAddMode ? "إضافة سطر شريك آخر (+)" : "فتح داتا ويندو الإضافة (+)"}
            >
              +
            </button>

            <button
              onClick={handleDeleteButton}
              className={`w-10 h-8 border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white ${
                isAddMode ? 'bg-[#fcdada] hover:bg-[#f8c4c4] cursor-pointer' : 'bg-[#ece9d8] text-slate-400 cursor-not-allowed opacity-80'
              }`}
              title={isAddMode ? "حذف سطر الإضافة / إلغاء (-)" : "حذف (غير متاح في الاستعراض)"}
            >
              -
            </button>

            <button
              onClick={handleSave}
              className="w-10 h-8 bg-[#c2e2c2] hover:bg-[#b0d8b0] active:bg-[#9ecc9e] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white cursor-pointer"
              title="حفظ بيانات الشركاء"
            >
              حفظ
            </button>

            <button
              onClick={handlePrint}
              className="w-10 h-10 bg-white hover:bg-slate-100 border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center shadow-sm p-1 cursor-pointer"
              title="طباعة"
            >
              <Printer className="w-6 h-6 text-slate-800" />
            </button>
          </div>

          {/* Group Box (DataWindow Container) */}
          <fieldset className="flex-1 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-3 pt-1 bg-[#b8b8b8]">
            <legend className="px-1 text-xs font-bold text-slate-900 select-none flex items-center gap-2">
              <span>بيانات الشركاء</span>
              {isAddMode && (
                <span className="text-[10px] text-amber-900 bg-amber-200 px-1 rounded border border-amber-400 font-normal">
                  داتا ويندو إضافة
                </span>
              )}
            </legend>

            <div className="bg-white border-2 border-t-slate-800 border-l-slate-800 border-b-white border-r-white shadow-inner max-h-[190px] overflow-y-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-[#b8cde4] text-slate-900 font-bold border-b border-slate-400 text-center sticky top-0 z-10">
                    <th className="py-1 px-2 border-l border-slate-400 w-16">الكود</th>
                    <th className="py-1 px-3 text-right">الاسم</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((o, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <tr
                        key={`owner_${o.code || idx}_${idx}`}
                        onClick={() => setSelectedIndex(idx)}
                        className={`cursor-pointer border-b border-slate-200 ${
                          isSelected ? 'bg-blue-100' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="py-1 px-2 border-l border-slate-200 text-center font-mono font-bold text-slate-800">
                          {o.code}
                        </td>
                        <td className="py-1 px-2">
                          {isAddMode ? (
                            <input
                              ref={idx === 0 ? nameInputRef : undefined}
                              type="text"
                              value={o.name}
                              onChange={e => handleAddRowNameChange(idx, e.target.value)}
                              placeholder="اكتب اسم الشريك الجديد..."
                              className="w-full bg-yellow-50 focus:bg-white border border-blue-400 px-1 py-0.5 font-bold text-slate-900 outline-none"
                            />
                          ) : (
                            <span className="font-bold text-slate-900 select-text px-1" title="شاشة استعراض (التعديل من شاشة التعديلات)">
                              {o.name}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {msg && (
              <div className="mt-2 text-center text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-400 p-1">
                {msg}
              </div>
            )}
          </fieldset>
        </div>
      </div>
    </div>
  );
};
