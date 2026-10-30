import React, { useState, useEffect, useRef } from 'react';
import { wholesaleStore } from '../services/storage';
import { Farm } from '../types/schema';
import { Minus, Square, X, Printer as LucidePrinter } from 'lucide-react';

interface FarmWindowProps {
  mode?: string;
  onClose?: () => void;
}

export const FarmWindow: React.FC<FarmWindowProps> = ({ onClose }) => {
  const [dataObject, setDataObject] = useState<'dw_farms' | 'dw_farms_add'>('dw_farms');
  const [browseFarms, setBrowseFarms] = useState<Farm[]>(() => wholesaleStore.getState().farms || []);
  const [addRows, setAddRows] = useState<Farm[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // تحديث قائمة المزارع فوراً عند جلب البيانات أو تحديث قاعدة البيانات
  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setBrowseFarms(wholesaleStore.getState().farms || []);
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (dataObject === 'dw_farms_add' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [dataObject, addRows.length]);

  // زر الإضافة (+)
  const handleAddButton = () => {
    const maxId = browseFarms.reduce((max, f) => Math.max(max, f.farm_id || 0), 0);

    if (dataObject === 'dw_farms_add') {
      const nextRow = addRows.length + 1;
      const nextId = maxId + nextRow;
      const newRow: Farm = {
        farm_id: nextId,
        sup_name: wholesaleStore.getState().suppliers[0]?.sup_name || '',
        farm_name: '',
        hold: false
      };
      setAddRows(prev => [...prev, newRow]);
      setSelectedIdx(addRows.length);
      showToast(`تم فتح سطر جديد لإضافة مزرعة ثانية (كود: ${nextId})`);
    } else {
      setDataObject('dw_farms_add');
      const nextId = maxId + 1;
      const firstRow: Farm = {
        farm_id: nextId,
        sup_name: wholesaleStore.getState().suppliers[0]?.sup_name || '',
        farm_name: '',
        hold: false
      };
      setAddRows([firstRow]);
      setSelectedIdx(0);
      showToast(`فتح داتا ويندو الإضافة (dw_farms_add) - كود تلقائي: ${nextId}`);
    }
  };

  // زر الحذف (-)
  const handleDeleteButton = () => {
    if (dataObject === 'dw_farms') {
      showToast('⚠️ في شاشة الاستعراض لا يمكن الحذف، الحذف والتعديل للاسم من شاشة التعديلات');
      return;
    }

    if (addRows.length <= 1) {
      setAddRows([]);
      setDataObject('dw_farms');
      setSelectedIdx(0);
      showToast('تم إلغاء الإضافة والرجوع لشاشة استعراض المزارع');
    } else {
      setAddRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(prev => Math.max(0, prev - 1));
      showToast('تم حذف السطر من داتا ويندو الإضافة');
    }
  };

  // تعديل الحقول:
  // في الاستعراض: فقط (معلق) قابل للتعديل مباشرة، بينما اسم المزرعة واسم المورد للقراءة فقط ولا يمكن نقله لمورد آخر
  // في الإضافة: اسم المزرعة واختيار المورد متاحان للإضافة الجديدة
  const handleFieldChange = (index: number, field: keyof Farm, value: any) => {
    if (dataObject === 'dw_farms_add') {
      setAddRows(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    } else {
      // في شاشة الاستعراض: يُمنع تعديل اسم المزرعة أو نقلها لمورد آخر نهائياً! فقط معلق متاح
      if (field !== 'hold') return;
      setBrowseFarms(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    }
  };

  // زر حفظ
  const handleSave = () => {
    if (dataObject === 'dw_farms_add') {
      const validRows = addRows.filter(r => r.farm_name.trim() !== '');
      if (validRows.length === 0) {
        showToast('⚠️ يرجى كتابة اسم المزرعة أولاً أو الضغط على (-) للإلغاء والعودة.');
        return;
      }

      // التحقق من عدم تكرار كود المزرعة أو اسمها للمورد نفسه
      for (const row of validRows) {
        const dupCode = browseFarms.some(b => b.farm_id === row.farm_id);
        if (dupCode) {
          showToast(`⚠️ خطأ: كود المزرعة (${row.farm_id}) مسجل بالفعل مسبقاً! يمنع تكرار الأكواد.`);
          return;
        }

        const normNew = row.farm_name.trim().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
        const dupName = browseFarms.some(b => {
          const normExist = b.farm_name.trim().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
          return normExist === normNew && b.sup_name === row.sup_name;
        });

        if (dupName) {
          showToast(`⚠️ خطأ: المزرعة [${row.farm_name}] مسجلة بالفعل للمورد [${row.sup_name}]! يمنع تكرار المزارع.`);
          return;
        }
      }

      const curState = wholesaleStore.getState();
      const updated = [...browseFarms, ...validRows];
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          farms: updated
        })
      );
      setBrowseFarms(updated);
      setDataObject('dw_farms');
      setAddRows([]);
      setSelectedIdx(updated.length - 1);
      showToast(`✓ تم حفظ ${validRows.length} مزرعة جديدة بنجاح والرجوع لشاشة الاستعراض.`);
    } else {
      // حفظ التعديلات على المزارع الحالية (معلق فقط)
      const curState = wholesaleStore.getState();
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          farms: browseFarms
        })
      );
      showToast('✓ تم حفظ التعديلات على المزارع (معلق) بنجاح.');
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const currentRows = dataObject === 'dw_farms_add' ? addRows : browseFarms;
  const isAddMode = dataObject === 'dw_farms_add';

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-3 select-none" dir="rtl">
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-[740px] max-w-full bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col font-sans text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar) */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          <div className="flex items-center gap-0.5">
            {onClose && (
              <button
                onClick={onClose}
                title="إغلاق"
                className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-800 hover:bg-rose-500 hover:text-white"
              >
                <X className="w-3 h-3 stroke-[3]" />
              </button>
            )}
            <button
              title="تكبير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-800"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              title="تصغير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-800"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 font-bold text-[12px] tracking-wide">
              {isAddMode ? 'المزارع - إضافة مزرعة جديدة (dw_farms_add)' : 'المزارع (استعراض)'}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-teal-700 bg-gradient-to-tr from-emerald-600 via-teal-400 to-white flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-800"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة: الأزرار على اليمين والجدول على اليسار */}
        <div className="p-3 bg-[#d4d0c8] flex items-start gap-2.5">
          
          {/* الأزرار الـ 4 العمودية على اليمين */}
          <div className="flex flex-col gap-2 pt-1 shrink-0">
            <button
              onClick={handleAddButton}
              title={isAddMode ? "إضافة سطر مزرعة أخرى (+)" : "فتح داتا ويندو الإضافة (+)"}
              className={`w-12 h-7 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-black text-base font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] cursor-pointer ${
                isAddMode ? 'bg-amber-100 ring-1 ring-amber-400' : 'bg-[#d4d0c8] hover:bg-[#e2e0da]'
              }`}
            >
              +
            </button>

            <button
              onClick={handleDeleteButton}
              title={isAddMode ? "حذف سطر الإضافة / إلغاء (-)" : "حذف (غير متاح في الاستعراض)"}
              className={`w-12 h-7 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-black text-base font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] ${
                isAddMode ? 'bg-[#fcdada] hover:bg-[#f8c4c4] cursor-pointer' : 'bg-[#d4d0c8] text-slate-400 cursor-not-allowed opacity-80'
              }`}
            >
              -
            </button>

            <button
              onClick={handleSave}
              title="حفظ بيانات وتعديلات المزارع"
              className="w-12 h-7 bg-[#bbf0bb] hover:bg-[#aee6ae] active:bg-[#9bd49b] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-black text-[13px] font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] cursor-pointer"
            >
              حفظ
            </button>

            <button
              onClick={handlePrint}
              title="طباعة دليل المزارع"
              className="w-12 h-10 bg-white hover:bg-slate-50 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center shadow-xs cursor-pointer p-0.5"
            >
              <svg className="w-9 h-6.5" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="1" width="18" height="8" rx="0.5" fill="#ffffff" stroke="#333333" strokeWidth="1" />
                <line x1="12" y1="4" x2="24" y2="4" stroke="#888888" strokeWidth="0.8" />
                <line x1="12" y1="6" x2="21" y2="6" stroke="#888888" strokeWidth="0.8" />
                <rect x="3" y="8" width="30" height="11" rx="2" fill="#2d3748" stroke="#1a202c" strokeWidth="1" />
                <rect x="7" y="13" width="22" height="10" rx="1" fill="#edf2f7" stroke="#4a5568" strokeWidth="1" />
                <rect x="10" y="15" width="16" height="7" fill="#ffffff" stroke="#cbd5e0" strokeWidth="0.8" />
                <line x1="12" y1="18" x2="24" y2="18" stroke="#718096" strokeWidth="0.8" />
                <line x1="12" y1="20" x2="20" y2="20" stroke="#718096" strokeWidth="0.8" />
                <circle cx="28" cy="11" r="1" fill="#48bb78" />
              </svg>
            </button>
          </div>

          {/* Groupbox: "المزارع" المحيط بالجدول */}
          <fieldset className="flex-1 border border-[#808080] p-1.5 pb-2 bg-[#d4d0c8] relative">
            <legend className="text-xs font-bold text-black px-1.5 mr-2 select-none flex items-center gap-2">
              <span>المزارع</span>
              {isAddMode && (
                <span className="text-[10px] text-amber-900 bg-amber-200 px-1 py-0.2 rounded border border-amber-400 font-normal">
                  داتا ويندو إضافة (dw_farms_add)
                </span>
              )}
            </legend>

            <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white shadow-inner flex overflow-hidden">
              
              {/* شريط التمرير على اليمين */}
              <div className="w-4 bg-[#e0ded8] border-l border-[#8f9ca6] flex flex-col justify-between items-center py-0.5 select-none shrink-0">
                <button
                  onClick={() => setSelectedIdx(prev => Math.max(0, prev - 1))}
                  className="w-3.5 h-3.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#606060] border-r-[#606060] flex items-center justify-center text-[7px] text-black"
                >
                  ▲
                </button>
                <div className="w-2.5 h-16 bg-[#c4c0b8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-xs my-auto"></div>
                <button
                  onClick={() => setSelectedIdx(prev => Math.min(currentRows.length - 1, prev + 1))}
                  className="w-3.5 h-3.5 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#606060] border-r-[#606060] flex items-center justify-center text-[7px] text-black"
                >
                  ▼
                </button>
              </div>

              {/* جدول المزارع */}
              <div className="flex-1 overflow-x-auto max-h-[260px] overflow-y-auto">
                <table className="w-full border-collapse text-xs font-sans text-right select-text">
                  <thead>
                    <tr className="bg-[#adc7dc] text-black font-bold border-b border-[#7c9db7] sticky top-0 z-10 text-[11px]">
                      <th className="border-l border-[#8faec7] px-2 py-1 text-center w-16">الكود</th>
                      <th className="border-l border-[#8faec7] px-3 py-1 text-right min-w-[150px]">اسم المزرعة</th>
                      <th className="border-l border-[#8faec7] px-3 py-1 text-right min-w-[150px]">المورد التابع له</th>
                      <th className="px-1 py-1 text-center w-14">معلق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((f, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <tr
                          key={`farm_row_${f.farm_id || idx}_${idx}`}
                          onClick={() => setSelectedIdx(idx)}
                          className={`border-b border-[#c8d4df] h-6 transition-none ${
                            isSelected
                              ? 'bg-[#eaf1f8]'
                              : idx % 2 === 1
                              ? 'bg-[#f8fafc]'
                              : 'bg-white'
                          }`}
                        >
                          {/* الكود */}
                          <td className="border-l border-[#c8d4df] px-1 py-0.5 text-center font-bold text-black">
                            <input
                              type="number"
                              readOnly
                              value={f.farm_id || ''}
                              className="w-full text-center bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                            />
                          </td>

                          {/* اسم المزرعة - فقط الاسم للقراءة فقط في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-2 py-0.5 text-right font-bold text-black">
                            {isAddMode ? (
                              <input
                                ref={idx === 0 ? nameInputRef : undefined}
                                type="text"
                                value={f.farm_name}
                                onChange={e => handleFieldChange(idx, 'farm_name', e.target.value)}
                                placeholder="اكتب اسم المزرعة الجديدة..."
                                className="w-full bg-yellow-50 focus:bg-white outline-none font-bold text-blue-900 border border-blue-400 px-1 py-0"
                              />
                            ) : (
                              <input
                                type="text"
                                readOnly
                                value={f.farm_name}
                                title="اسم المزرعة للقراءة فقط في الاستعراض (التعديل يتم من شاشة التعديلات)"
                                className="w-full bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                              />
                            )}
                          </td>

                          {/* المورد التابع له - للقراءة فقط في الاستعراض ولا يمكن نقله لمورد آخر إلا في الإضافة الجديدة */}
                          <td className="border-l border-[#c8d4df] px-2 py-0.5 text-right font-bold text-black">
                            {isAddMode ? (
                              <select
                                value={f.sup_name}
                                onChange={e => handleFieldChange(idx, 'sup_name', e.target.value)}
                                className="w-full bg-yellow-50 focus:bg-white outline-none text-black border border-blue-400 py-0 text-xs font-bold cursor-pointer"
                              >
                                {wholesaleStore.getState().suppliers.map((s, sIdx) => (
                                  <option key={`sup_opt_${s.sup_id}_${sIdx}`} value={s.sup_name}>
                                    {s.sup_name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                readOnly
                                value={f.sup_name}
                                title="المورد التابع له للقراءة فقط في الاستعراض (المزرعة مرتبطة بموردها دائماً)"
                                className="w-full bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                              />
                            )}
                          </td>

                          {/* معلق - نشط وقابل للتعديل مباشرة في الاستعراض */}
                          <td className="px-1 py-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!f.hold}
                              onChange={e => handleFieldChange(idx, 'hold', e.target.checked)}
                              className="w-3.5 h-3.5 cursor-pointer accent-rose-700"
                              title={f.hold ? 'مزرعة معلقة' : 'تحديد كمعلقة'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </fieldset>

        </div>

        {toastMessage && (
          <div className="mx-3 mb-2 px-2 py-1 bg-emerald-100 border border-emerald-400 text-emerald-900 text-[11px] font-bold text-center shadow-xs">
            {toastMessage}
          </div>
        )}

      </div>

      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-700 shadow-2xl p-6 w-[700px] max-w-full text-slate-900 rounded font-sans">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <LucidePrinter className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-base text-slate-800">معاينة طباعة - دليل المزارع</h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-6 h-6 border border-slate-400 bg-slate-100 flex items-center justify-center text-xs font-bold hover:bg-rose-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-300 max-h-[350px] overflow-y-auto mb-4">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-2 border-l border-slate-300 text-center w-12">م</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">الكود</th>
                    <th className="p-2 border-l border-slate-300 text-right">اسم المزرعة</th>
                    <th className="p-2 border-l border-slate-300 text-right">المورد</th>
                    <th className="p-2 text-center w-16">معلق</th>
                  </tr>
                </thead>
                <tbody>
                  {browseFarms.map((f, i) => (
                    <tr key={`print_farm_${f.farm_id}_${i}`} className="border-b border-slate-200">
                      <td className="p-1.5 border-l border-slate-200 text-center">{i + 1}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{f.farm_id}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold">{f.farm_name}</td>
                      <td className="p-1.5 border-l border-slate-200">{f.sup_name}</td>
                      <td className="p-1.5 text-center">{f.hold ? '✓' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  window.print();
                  setShowPrintModal(false);
                }}
                className="px-4 py-1.5 bg-blue-700 text-white font-bold text-xs rounded hover:bg-blue-800"
              >
                إرسال إلى الطابعة
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 bg-slate-200 text-slate-800 text-xs rounded hover:bg-slate-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
