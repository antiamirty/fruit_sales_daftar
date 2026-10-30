import React, { useState, useEffect, useRef } from 'react';
import { wholesaleStore } from '../services/storage';
import { Category } from '../types/schema';
import { normalizeArabic } from '../utils/arabic';
import { Minus, Square, X, Printer as LucidePrinter } from 'lucide-react';

interface CategoriesWindowProps {
  onClose?: () => void;
}

export const CategoriesWindow: React.FC<CategoriesWindowProps> = ({ onClose }) => {
  // داتا ويندو الاستعراض (dw_categories) وداتا ويندو الإضافة (dw_categories_add)
  const [dataObject, setDataObject] = useState<'dw_categories' | 'dw_categories_add'>('dw_categories');
  const [browseCategories, setBrowseCategories] = useState<Category[]>(() => wholesaleStore.getState().categories || []);
  const [addRows, setAddRows] = useState<Category[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // تحديث قائمة الأصناف فوراً عند جلب البيانات أو تحديث قاعدة البيانات
  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setBrowseCategories(wholesaleStore.getState().categories || []);
    });
    return () => unsub();
  }, []);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // التمرير التلقائي السلس إلى السطر المحدد في جدول الأصناف
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

  // دالة مساعدة لتوليد كود صنف فريد
  const getNextAvailableCatCode = (currentAddRows: Category[]): number => {
    const usedCodes = new Set([
      ...browseCategories.map(c => Number(c.cat_code)),
      ...currentAddRows.map(c => Number(c.cat_code))
    ]);
    const maxExisting = browseCategories.reduce((max, c) => Math.max(max, Number(c.cat_code) || 0), 0);
    let candidate = maxExisting + 1;
    while (usedCodes.has(candidate)) {
      candidate++;
    }
    return candidate;
  };

  useEffect(() => {
    if (dataObject === 'dw_categories_add' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [dataObject, addRows.length]);

  // زر الإضافة (+)
  const handleAddButton = () => {
    if (dataObject === 'dw_categories_add') {
      const nextCode = getNextAvailableCatCode(addRows);
      const newCat: Category = {
        id: Date.now() + addRows.length + 1,
        cat_code: nextCode,
        cat_name: '',
        byaaa: 10,
        byaaa_s: 8,
        hold: false
      };
      setAddRows(prev => [...prev, newCat]);
      setSelectedIdx(addRows.length);
      showToast(`تم فتح سطر جديد لإضافة صنف ثانٍ (كود: ${nextCode})`);
    } else {
      setDataObject('dw_categories_add');
      const nextCode = getNextAvailableCatCode([]);
      const firstCat: Category = {
        id: Date.now(),
        cat_code: nextCode,
        cat_name: '',
        byaaa: 10,
        byaaa_s: 8,
        hold: false
      };
      setAddRows([firstCat]);
      setSelectedIdx(0);
      showToast(`فتح داتا ويندو الإضافة (dw_categories_add) - كود تلقائي: ${nextCode}`);
    }
  };

  // زر الحذف (-)
  const handleDeleteButton = () => {
    if (dataObject === 'dw_categories') {
      showToast('⚠️ في شاشة الاستعراض لا يمكن الحذف، الحذف والتعديل للاسم من شاشة التعديلات');
      return;
    }

    if (addRows.length <= 1) {
      setAddRows([]);
      setDataObject('dw_categories');
      setSelectedIdx(0);
      showToast('تم إلغاء الإضافة والرجوع لشاشة استعراض الأصناف');
    } else {
      setAddRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(prev => Math.max(0, prev - 1));
      showToast('تم حذف السطر من داتا ويندو الإضافة');
    }
  };

  // تعديل الحقول:
  // في الاستعراض: فقط اسم الصنف والكود للقراءة فقط، وكل شيء آخر (بياعة عادية، بياعة مجاملة، معلق) متاح للتعديل
  // في الإضافة: كل الحقول بما فيها الاسم قابلة للتعديل
  const handleFieldChange = (index: number, field: keyof Category, value: any) => {
    if (dataObject === 'dw_categories_add') {
      setAddRows(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    } else {
      if (field === 'cat_name' || field === 'cat_code') return;
      setBrowseCategories(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    }
  };

  // زر حفظ مع فحص دقيق لمنع تكرار أي صنف أو كود
  const handleSave = () => {
    if (dataObject === 'dw_categories_add') {
      const validRows = addRows.filter(r => r.cat_name.trim() !== '');
      if (validRows.length === 0) {
        showToast('⚠️ يرجى كتابة اسم الصنف أولاً أو الضغط على (-) للإلغاء والعودة.');
        return;
      }

      // التحقق من فرادة كود الصنف واسمه
      const seenCodes = new Set<number>();
      const seenNames = new Set<string>();

      for (const row of validRows) {
        const codeNum = Number(row.cat_code);
        if (!codeNum || codeNum <= 0) {
          showToast(`⚠️ يرجى إدخال كود رقمي صحيح وموجب للصنف [${row.cat_name}].`);
          return;
        }

        if (seenCodes.has(codeNum)) {
          showToast(`⚠️ خطأ: كود الصنف (${codeNum}) مكرر في أسطر الإضافة!`);
          return;
        }
        seenCodes.add(codeNum);

        const existCode = browseCategories.find(c => Number(c.cat_code) === codeNum);
        if (existCode) {
          showToast(`⚠️ خطأ: كود الصنف (${codeNum}) مسجل بالفعل مسبقاً للصنف [${existCode.cat_name}]! يمنع تكرار الأكواد.`);
          return;
        }

        const normName = normalizeArabic(row.cat_name);
        if (seenNames.has(normName)) {
          showToast(`⚠️ خطأ: اسم الصنف [${row.cat_name}] مكرر في أسطر الإضافة!`);
          return;
        }
        seenNames.add(normName);

        const existName = browseCategories.find(c => normalizeArabic(c.cat_name) === normName);
        if (existName) {
          showToast(`⚠️ خطأ: اسم الصنف [${row.cat_name}] مسجل مسبقاً بكود (${existName.cat_code})! يمنع تكرار الأصناف.`);
          return;
        }
      }

      const curState = wholesaleStore.getState();
      const updated = [...browseCategories, ...validRows];
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          categories: updated
        })
      );
      setBrowseCategories(updated);
      setDataObject('dw_categories');
      setAddRows([]);
      setSelectedIdx(updated.length - 1);
      showToast(`✓ تم حفظ ${validRows.length} صنف جديد بنجاح والرجوع لشاشة الاستعراض.`);
    } else {
      // حفظ التعديلات على الأصناف الحالية (بياعة عادية، بياعة مجاملة، معلق)
      const curState = wholesaleStore.getState();
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          categories: browseCategories
        })
      );
      showToast('✓ تم حفظ التعديلات على الأصناف (البياعة العادية والمجاملة، معلق) بنجاح.');
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const currentRows = dataObject === 'dw_categories_add' ? addRows : browseCategories;
  const isAddMode = dataObject === 'dw_categories_add';

  return (
    <div className="flex justify-center items-start py-2 min-h-full select-none" dir="rtl">
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
              {isAddMode ? 'الأصناف - إضافة صنف جديد (dw_categories_add)' : 'الأصناف (استعراض)'}
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
              title={isAddMode ? "إضافة سطر صنف آخر (+)" : "فتح داتا ويندو الإضافة (+)"}
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
              title="حفظ بيانات وتعديلات الأصناف"
              className="w-12 h-7 bg-[#bbf0bb] hover:bg-[#aee6ae] active:bg-[#9bd49b] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-black text-[13px] font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] cursor-pointer"
            >
              حفظ
            </button>

            <button
              onClick={handlePrint}
              title="طباعة دليل الأصناف"
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

          {/* Groupbox: "الأصناف" المحيط بالجدول */}
          <fieldset className="flex-1 border border-[#808080] p-1.5 pb-2 bg-[#d4d0c8] relative">
            <legend className="text-xs font-bold text-black px-1.5 mr-2 select-none flex items-center gap-2">
              <span>الأصناف</span>
              {isAddMode && (
                <span className="text-[10px] text-amber-900 bg-amber-200 px-1 py-0.2 rounded border border-amber-400 font-normal">
                  داتا ويندو إضافة (dw_categories_add)
                </span>
              )}
            </legend>

            {/* جدول الأصناف - فيرتكال سكرول عادي نيتيف كلاسيكي */}
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
                      <th className="border-l border-[#8faec7] px-3 py-1 text-right min-w-[150px]">اسم الصنف</th>
                      <th className="border-l border-[#8faec7] px-2 py-1 text-center w-16">بياعة عادية</th>
                      <th className="border-l border-[#8faec7] px-2 py-1 text-center w-16">بياعة مجاملة</th>
                      <th className="px-1 py-1 text-center w-14">معلق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((c, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <tr
                          key={`cat_row_${c.id || idx}_${c.cat_code || idx}_${idx}`}
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
                              value={c.cat_code || ''}
                              className="w-full text-center bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                            />
                          </td>

                          {/* اسم الصنف - فقط الاسم للقراءة فقط في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-2 py-0.5 text-right font-bold text-black">
                            {isAddMode ? (
                              <input
                                ref={idx === 0 ? nameInputRef : undefined}
                                type="text"
                                value={c.cat_name}
                                onChange={e => handleFieldChange(idx, 'cat_name', e.target.value)}
                                placeholder="اكتب اسم الصنف الجديد..."
                                className="w-full bg-yellow-50 focus:bg-white outline-none font-bold text-blue-900 border border-blue-400 px-1 py-0"
                              />
                            ) : (
                              <input
                                type="text"
                                readOnly
                                value={c.cat_name}
                                title="اسم الصنف للقراءة فقط في الاستعراض (التعديل يتم من شاشة التعديلات)"
                                className="w-full bg-transparent outline-none font-bold text-black border-none p-0 cursor-default"
                              />
                            )}
                          </td>

                          {/* بياعة عادية - قابلة للتعديل مباشرة في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-1 py-0.5 text-center font-bold text-black">
                            <input
                              type="number"
                              value={c.byaaa ?? 10}
                              onChange={e => handleFieldChange(idx, 'byaaa', Number(e.target.value))}
                              className="w-full text-center bg-transparent focus:bg-yellow-50 outline-none font-bold text-black border-none p-0"
                            />
                          </td>

                          {/* بياعة مجاملة - قابلة للتعديل مباشرة في الاستعراض */}
                          <td className="border-l border-[#c8d4df] px-1 py-0.5 text-center font-bold text-black">
                            <input
                              type="number"
                              value={c.byaaa_s ?? 8}
                              onChange={e => handleFieldChange(idx, 'byaaa_s', Number(e.target.value))}
                              className="w-full text-center bg-transparent focus:bg-yellow-50 outline-none font-bold text-black border-none p-0"
                            />
                          </td>

                          {/* معلق - نشط وقابل للتعديل مباشرة في الاستعراض */}
                          <td className="px-1 py-0.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!c.hold}
                              onChange={e => handleFieldChange(idx, 'hold', e.target.checked)}
                              className="w-3.5 h-3.5 cursor-pointer accent-rose-700"
                              title={c.hold ? 'صنف معلق' : 'تحديد كصنف معلق'}
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
                <h3 className="font-bold text-base text-slate-800">معاينة طباعة - دليل الأصناف</h3>
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
                    <th className="p-2 border-l border-slate-300 text-right">اسم الصنف</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">بياعة عادية</th>
                    <th className="p-2 border-l border-slate-300 text-center w-16">بياعة مجاملة</th>
                    <th className="p-2 text-center w-16">معلق</th>
                  </tr>
                </thead>
                <tbody>
                  {browseCategories.map((c, i) => (
                    <tr key={`print_cat_${c.id}_${i}`} className="border-b border-slate-200">
                      <td className="p-1.5 border-l border-slate-200 text-center">{i + 1}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{c.cat_code}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold">{c.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{c.byaaa}</td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono">{c.byaaa_s}</td>
                      <td className="p-1.5 text-center">{c.hold ? '✓' : '-'}</td>
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
