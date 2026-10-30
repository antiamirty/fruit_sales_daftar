import React, { useState, useEffect, useRef } from 'react';
import { wholesaleStore } from '../services/storage';
import { Supplier } from '../types/schema';
import { normalizeArabic } from '../utils/arabic';
import { Minus, Square, X, Printer as LucidePrinter } from 'lucide-react';

interface SuppliersWindowProps {
  onClose?: () => void;
}

export const SuppliersWindow: React.FC<SuppliersWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const initialSuppliers: Supplier[] = db.suppliers;

  // داتا ويندو الاستعراض (dw_suppliers) وداتا ويندو الإضافة (dw_suppliers_add)
  const [dataObject, setDataObject] = useState<'dw_suppliers' | 'dw_suppliers_add'>('dw_suppliers');
  const [browseSuppliers, setBrowseSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [addRows, setAddRows] = useState<Supplier[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // تحديث الموردين فوراً عند تغير أو استيراد مخزن البيانات
  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setBrowseSuppliers(wholesaleStore.getState().suppliers || []);
    });
    return () => unsub();
  }, []);

  // التمرير التلقائي السلس إلى السطر المحدد في الجدول
  useEffect(() => {
    if (tableRef.current) {
      const rowEl = tableRef.current.querySelector(`[data-row-idx="${selectedIdx}"]`);
      if (rowEl) {
        rowEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIdx]);

  const handleScrollUp = () => {
    setSelectedIdx(prev => Math.max(0, prev - 1));
    tableRef.current?.scrollBy({ top: -32, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    setSelectedIdx(prev => Math.min(currentRows.length - 1, prev + 1));
    tableRef.current?.scrollBy({ top: 32, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getNextAvailableSupId = (currentAddRows: Supplier[]): number => {
    const usedIds = new Set([
      ...browseSuppliers.map(s => Number(s.sup_id)),
      ...currentAddRows.map(s => Number(s.sup_id))
    ]);
    const maxExisting = browseSuppliers.reduce((max, s) => Math.max(max, Number(s.sup_id) || 0), 0);
    let candidate = maxExisting + 1;
    while (usedIds.has(candidate)) {
      candidate++;
    }
    return candidate;
  };

  useEffect(() => {
    if (dataObject === 'dw_suppliers_add' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [dataObject, addRows.length]);

  // منطق زر الإضافة (+)
  const handleAddButton = () => {
    if (dataObject === 'dw_suppliers_add') {
      const nextId = getNextAvailableSupId(addRows);
      const newRow: Supplier = {
        sup_id: nextId,
        sup_name: '',
        sup_address: '',
        sup_mobile: '',
        hold: false,
        comission: 0.1
      };
      setAddRows(prev => [...prev, newRow]);
      setSelectedIdx(addRows.length);
      showToast(`تم فتح سطر جديد لإضافة مورد ثانٍ (كود: ${nextId})`);
    } else {
      setDataObject('dw_suppliers_add');
      const nextId = getNextAvailableSupId([]);
      const firstRow: Supplier = {
        sup_id: nextId,
        sup_name: '',
        sup_address: '',
        sup_mobile: '',
        hold: false,
        comission: 0.1
      };
      setAddRows([firstRow]);
      setSelectedIdx(0);
      showToast(`فتح داتا ويندو الإضافة (dw_suppliers_add) - كود تلقائي: ${nextId}`);
    }
  };

  // منطق زر الحذف (-)
  const handleDeleteButton = () => {
    if (dataObject === 'dw_suppliers') {
      showToast('⚠️ في شاشة الاستعراض لا يمكن الحذف، الحذف والتعديل للاسم من شاشة التعديلات');
      return;
    }

    if (addRows.length <= 1) {
      setAddRows([]);
      setDataObject('dw_suppliers');
      setSelectedIdx(0);
      showToast('تم إلغاء الإضافة والرجوع لشاشة استعراض الموردين');
    } else {
      setAddRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(prev => Math.max(0, prev - 1));
      showToast('تم حذف السطر من داتا ويندو الإضافة');
    }
  };

  // تعديل الحقول:
  // في الاستعراض: فقط اسم المورد والكود للقراءة فقط، وكل شيء آخر (عمولة، معلق، عنوان، موبيل) قابل للتعديل
  // في الإضافة: كل الحقول بما فيها الاسم قابلة للتعديل
  const handleFieldChange = (index: number, field: keyof Supplier, value: any) => {
    if (dataObject === 'dw_suppliers_add') {
      setAddRows(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    } else {
      if (field === 'sup_name' || field === 'sup_id') return;
      setBrowseSuppliers(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    }
  };

  // زر حفظ
  const handleSave = () => {
    if (dataObject === 'dw_suppliers_add') {
      const validRows = addRows.filter(r => r.sup_name.trim() !== '');
      if (validRows.length === 0) {
        showToast('⚠️ يرجى كتابة اسم المورد أولاً أو الضغط على (-) للإلغاء والعودة.');
        return;
      }

      const seenIds = new Set<number>();
      const seenNames = new Set<string>();

      for (const row of validRows) {
        const supId = Number(row.sup_id);
        if (!supId || supId <= 0) {
          showToast(`⚠️ يرجى إدخال كود رقمي صحيح للمورد [${row.sup_name}].`);
          return;
        }

        if (seenIds.has(supId)) {
          showToast(`⚠️ خطأ: كود المورد (${supId}) مكرر في أسطر الإضافة!`);
          return;
        }
        seenIds.add(supId);

        const existId = browseSuppliers.find(s => Number(s.sup_id) === supId);
        if (existId) {
          showToast(`⚠️ خطأ: كود المورد (${supId}) مسجل بالفعل مسبقاً للمورد [${existId.sup_name}]!`);
          return;
        }

        const normName = normalizeArabic(row.sup_name);
        if (seenNames.has(normName)) {
          showToast(`⚠️ خطأ: اسم المورد [${row.sup_name}] مكرر في أسطر الإضافة!`);
          return;
        }
        seenNames.add(normName);

        const existName = browseSuppliers.find(s => normalizeArabic(s.sup_name) === normName);
        if (existName) {
          showToast(`⚠️ خطأ: اسم المورد [${row.sup_name}] مسجل مسبقاً بكود (${existName.sup_id})! يمنع تكرار الموردين.`);
          return;
        }
      }

      const curState = wholesaleStore.getState();
      const updated = [...browseSuppliers, ...validRows];
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          suppliers: updated
        })
      );
      setBrowseSuppliers(updated);
      setDataObject('dw_suppliers');
      setAddRows([]);
      setSelectedIdx(updated.length - 1);
      showToast(`✓ تم حفظ ${validRows.length} مورد جديد بنجاح والرجوع لشاشة الاستعراض.`);
    } else {
      // حفظ التعديلات على الموردين الحاليين (عمولة، معلق، عنوان، موبيل)
      const curState = wholesaleStore.getState();
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          suppliers: browseSuppliers
        })
      );
      showToast('✓ تم حفظ التعديلات على الموردين (العمولة، معلق، العنوان، الموبيل) بنجاح.');
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const currentRows = dataObject === 'dw_suppliers_add' ? addRows : browseSuppliers;
  const isAddMode = dataObject === 'dw_suppliers_add';

  return (
    <div className="flex justify-center items-start py-2 min-h-full select-none" dir="rtl">
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-[740px] max-w-full bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col font-sans text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar) */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                if (onClose) onClose();
                else window.history.back();
              }}
              title="إغلاق النافذة (Close)"
              className="w-4 h-4 bg-[#d4d0c8] hover:bg-rose-600 hover:text-white border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-800 font-bold cursor-pointer"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </button>
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
              {isAddMode ? 'الموردون - إضافة مورد جديد (dw_suppliers_add)' : 'الموردون (استعراض)'}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-teal-700 bg-gradient-to-tr from-emerald-600 via-teal-400 to-white flex items-center justify-center shadow-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-800"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة: الأزرار على اليمين والجدول على اليسار */}
        <div className="p-3 bg-[#d4d0c8] flex items-start gap-2.5">
          
          {/* الأزرار العمودية على اليمين (إضافة، حذف، حفظ، طباعة، خروج) */}
          <div className="flex flex-col gap-2 pt-1 shrink-0">
            <button
              onClick={handleAddButton}
              title={isAddMode ? "إضافة سطر مورد آخر (+)" : "فتح داتا ويندو الإضافة (+)"}
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
              title="حفظ بيانات وتعديلات الموردين"
              className="w-12 h-7 bg-[#bbf0bb] hover:bg-[#aee6ae] active:bg-[#9bd49b] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-black text-[13px] font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] cursor-pointer"
            >
              حفظ
            </button>

            <button
              onClick={handlePrint}
              title="طباعة دليل الموردين"
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

            <button
              onClick={() => {
                if (onClose) onClose();
              }}
              title="إغلاق شاشة الموردين (خروج)"
              className="w-12 h-7 bg-[#ffdada] hover:bg-[#ffc5c5] active:bg-[#fca5a5] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-rose-950 text-[12px] font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] cursor-pointer mt-1"
            >
              خروج
            </button>
          </div>

          {/* Groupbox: "الموردون" المحيط بالجدول */}
          <fieldset className="flex-1 border border-[#808080] p-1.5 pb-2 bg-[#d4d0c8] relative">
            <legend className="text-xs font-bold text-black px-1.5 mr-2 select-none flex items-center gap-2">
              <span>الموردون</span>
              {isAddMode && (
                <span className="text-[10px] text-amber-900 bg-amber-200 px-1 py-0.2 rounded border border-amber-400 font-normal">
                  داتا ويندو إضافة (dw_suppliers_add)
                </span>
              )}
            </legend>

            {/* جدول الموردين - فيرتكال سكرول عادي نيتيف كلاسيكي */}
            <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white shadow-inner flex flex-col h-[380px] overflow-hidden">
              <div
                ref={tableRef}
                dir="ltr"
                className="w-full flex-1 overflow-y-scroll overflow-x-auto normal-scrollbar outline-none"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIdx(prev => Math.min(currentRows.length - 1, prev + 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIdx(prev => Math.max(0, prev - 1));
                  } else if (e.key === 'PageDown') {
                    e.preventDefault();
                    setSelectedIdx(prev => Math.min(currentRows.length - 1, prev + 8));
                  } else if (e.key === 'PageUp') {
                    e.preventDefault();
                    setSelectedIdx(prev => Math.max(0, prev - 8));
                  }
                }}
              >
                <div dir="rtl" className="min-w-full">
                  <table className="w-full border-collapse text-xs font-sans text-right select-text">
                  <thead>
                    <tr className="bg-[#adc7dc] text-black font-bold border-b border-[#7c9db7] sticky top-0 z-10 text-[11px]">
                      <th className="border-l border-[#8faec7] px-2 py-1 text-center w-16">الكود</th>
                      <th className="border-l border-[#8faec7] px-3 py-1 text-right min-w-[150px]">اسم المورد</th>
                      <th className="border-l border-[#8faec7] px-2 py-1 text-center w-16">عمولة</th>
                      <th className="border-l border-[#8faec7] px-1 py-1 text-center w-12">معلق</th>
                      <th className="border-l border-[#8faec7] px-2 py-1 text-right min-w-[120px]">العنوان</th>
                      <th className="px-2 py-1 text-right min-w-[110px]">الموبيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((s, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <tr
                          key={`sup_row_${s.sup_id || idx}_${idx}`}
                          data-row-idx={idx}
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
                              value={s.sup_id || ''}
                              className="w-full text-center bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                            />
                          </td>

                          {/* اسم المورد - فقط الاسم للقراءة فقط في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-2 py-0.5 text-right font-bold text-black">
                            {isAddMode ? (
                              <input
                                ref={idx === 0 ? nameInputRef : undefined}
                                type="text"
                                value={s.sup_name}
                                onChange={e => handleFieldChange(idx, 'sup_name', e.target.value)}
                                placeholder="اكتب اسم المورد الجديد..."
                                className="w-full bg-yellow-50 focus:bg-white outline-none font-bold text-blue-900 border border-blue-400 px-1 py-0"
                              />
                            ) : (
                              <input
                                type="text"
                                readOnly
                                value={s.sup_name}
                                title="اسم المورد للقراءة فقط في الاستعراض (التعديل يتم من شاشة التعديلات)"
                                className="w-full bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                              />
                            )}
                          </td>

                          {/* عمولة المورد مطابقة تماماً لقاعدة البيانات كما هي (مثال: 0.1 أو 0.06 أو 0.10) */}
                          <td className="border-l border-[#c8d4df] px-1 py-0.5 text-center font-bold text-black">
                            <input
                              type="number"
                              step="0.01"
                              value={s.comission !== undefined ? s.comission : 0.1}
                              onChange={e => {
                                const v = parseFloat(e.target.value);
                                handleFieldChange(idx, 'comission', isNaN(v) ? 0 : v);
                              }}
                              title="عمولة المورد كما في قاعدة البيانات (مثل: 0.1 أو 0.06)"
                              className="w-full text-center bg-transparent focus:bg-yellow-50 outline-none font-bold text-blue-900 border-none p-0"
                            />
                          </td>

                          {/* معلق - نشط وقابل للتعديل مباشرة في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-1 py-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!s.hold}
                              onChange={e => handleFieldChange(idx, 'hold', e.target.checked)}
                              className="w-3.5 h-3.5 cursor-pointer accent-rose-700"
                              title={s.hold ? 'مورد معلق' : 'تحديد كمعلق'}
                            />
                          </td>

                          {/* العنوان - قابل للتعديل مباشرة في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-2 py-0.5 text-right">
                            <input
                              type="text"
                              value={s.sup_address || ''}
                              onChange={e => handleFieldChange(idx, 'sup_address', e.target.value)}
                              placeholder=""
                              className="w-full bg-transparent focus:bg-yellow-50 outline-none text-black border-none px-1 p-0"
                            />
                          </td>

                          {/* الموبيل - قابل للتعديل مباشرة في الاستعراض */}
                          <td className="px-2 py-0.5 text-right">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={s.sup_mobile || ''}
                              onChange={e => handleFieldChange(idx, 'sup_mobile', e.target.value)}
                              placeholder=""
                              className="w-full bg-transparent focus:bg-yellow-50 outline-none text-black font-mono border-none px-1 p-0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                <h3 className="font-bold text-base text-slate-800">معاينة طباعة - دليل الموردين</h3>
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
                    <th className="p-2 border-l border-slate-300 text-right">اسم المورد</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">عمولة</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">معلق</th>
                    <th className="p-2 border-l border-slate-300 text-right">العنوان</th>
                    <th className="p-2 text-right">الموبيل</th>
                  </tr>
                </thead>
                <tbody>
                  {browseSuppliers.map((s, i) => (
                    <tr key={`print_sup_${s.sup_id}_${i}`} className="border-b border-slate-200">
                      <td className="p-1.5 border-l border-slate-200 text-center">{i + 1}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{s.sup_id}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold">{s.sup_name}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{s.comission}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center">{s.hold ? '✓' : '-'}</td>
                      <td className="p-1.5 border-l border-slate-200">{s.sup_address || '-'}</td>
                      <td className="p-1.5 font-mono">{s.sup_mobile || '-'}</td>
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
