import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { SupSahb, SupCashback } from '../types/schema';
import { Printer, Minus, Square, X } from 'lucide-react';

interface SupplierSahbWindowProps {
  mode?: 'w_sup_sahb' | 'w_sup_cashback' | string;
  onClose?: () => void;
}

interface SahbRow {
  code: number;
  sup_name: string;
  amount: number;
  trans_date: string;
  descrip: string;
}

export const SupplierSahbWindow: React.FC<SupplierSahbWindowProps> = ({
  mode = 'w_sup_sahb',
  onClose
}) => {
  const db = wholesaleStore.getState();
  const isCashback = mode === 'w_sup_cashback';

  const windowTitle = isCashback ? 'رد مسحوبات الموردين' : 'مسحوبات موردين';
  const groupTitle = isCashback ? 'رد مسحوبات الموردين' : 'مسحوبات الموردين';

  const [transDate, setTransDate] = useState('2026/10/11');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('جاهز (Ready)');

  // الصفوف الأولية
  const [rows, setRows] = useState<SahbRow[]>([
    {
      code: 1,
      sup_name: db.suppliers[0]?.sup_name || 'ابراهيم هلال',
      amount: 0,
      trans_date: '11/10/2026',
      descrip: ''
    }
  ]);

  // إجمالي المبالغ
  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // إضافة سطر جديد (+)
  const handleAddRow = () => {
    const nextCode = (rows.reduce((max, r) => Math.max(max, r.code || 0), 0) || 0) + 1;
    setRows(prev => [
      ...prev,
      {
        code: nextCode,
        sup_name: db.suppliers[0]?.sup_name || 'ابراهيم هلال',
        amount: 0,
        trans_date: '11/10/2026',
        descrip: ''
      }
    ]);
    setSelectedIdx(rows.length);
    setStatusMessage('تمت إضافة سطر جديد');
  };

  // حذف السطر المحدد (-)
  const handleRemoveRow = () => {
    if (rows.length > 1 && selectedIdx >= 0 && selectedIdx < rows.length) {
      setRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(Math.max(0, selectedIdx - 1));
      setStatusMessage('تم حذف السطر المحدد');
    }
  };

  // تعديل الحقول
  const handleFieldChange = (index: number, field: keyof SahbRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // حفظ في قاعدة البيانات
  const handleSave = () => {
    try {
      const curState = wholesaleStore.getState();
      const standardDate = transDate.replace(/\//g, '-');

      if (isCashback) {
        // إضافة إلى sup_cashback
        rows.forEach(r => {
          if (r.amount > 0) {
            wholesaleStore.addSupCashback({
              sup_name: r.sup_name,
              sup_debit: Number(r.amount),
              trans_date: standardDate,
              descrip: r.descrip || 'رد مسحوبات مورد'
            });
          }
        });
      } else {
        // إضافة إلى sup_sahb
        rows.forEach(r => {
          if (r.amount > 0) {
            wholesaleStore.addSupSahb({
              sup_name: r.sup_name,
              sup_credit: Number(r.amount),
              trans_date: standardDate,
              descrip: r.descrip || 'سلفة / مسحوبات مورد'
            });
          }
        });
      }

      setStatusMessage(`تم حفظ الحركات بإجمالي ${totalAmount.toLocaleString()} ج.م بنجاح`);
      setTimeout(() => setStatusMessage('جاهز (Ready)'), 4000);
    } catch (e: any) {
      setStatusMessage(`خطأ في الحفظ: ${e?.message || 'تعذر الحفظ'}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center p-3 bg-[#8c949d] select-none font-sans overflow-auto" dir="rtl">
      
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[840px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto">
        
        {/* 1. شريط عنوان النافذة (Window Title Bar): أزرار التحكم على اليمين والعنوان على اليسار مطابق لشاشة الزبائن */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* أزرار التحكم في النافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-[#d4d0c8] hover:bg-rose-500 hover:text-white border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 active:border-t-[#808080] active:border-l-[#808080]"
                title="إغلاق"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            <button
              type="button"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
              title="تكبير"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          {/* أيقونة واسم النافذة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">{windowTitle}</span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">4-3</span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة (Window Body) */}
        <div className="p-4 flex flex-col gap-3 bg-[#d4d0c8]">
          
          {/* حقل التاريخ الكلاسيكي في أعلى اليسار */}
          <div className="flex justify-start">
            <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5 shadow-inner">
              <input
                type="text"
                value={transDate}
                onChange={e => setTransDate(e.target.value)}
                className="w-24 text-center font-bold text-xs text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* إطار GroupBox الجدول والأزرار الجانبية: الأزرار على اليمين والجدول على اليسار مطابق لشاشة الزبائن */}
          <div className="flex items-start gap-4">
            
            {/* الأزرار العمودية الخارجية على اليمين */}
            <div className="flex flex-col gap-2 pt-2 shrink-0">
              {/* زر إضافة (+) */}
              <button
                type="button"
                onClick={handleAddRow}
                title="إضافة سطر (+)"
                className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
              >
                +
              </button>

              {/* زر حذف (-) */}
              <button
                type="button"
                onClick={handleRemoveRow}
                title="حذف سطر (-)"
                className="w-14 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] active:bg-[#f4a8a8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
              >
                -
              </button>

              {/* زر حفظ الأخضر الفاتح */}
              <button
                type="button"
                onClick={handleSave}
                title="حفظ"
                className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-[13px] font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
              >
                حفظ
              </button>

              {/* زر الطباعة المخصص مع أيقونة الطابعة الكبيرة */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                title="طباعة"
                className="w-14 h-11 bg-white hover:bg-slate-50 active:bg-slate-200 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 mt-1 active:border-t-[#404040] active:border-l-[#404040]"
              >
                <Printer className="w-7 h-7 text-slate-800" />
                <span className="text-[7.5px] font-bold text-slate-700 mt-0.5">طباعة</span>
              </button>

              {/* زر خروج */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-14 h-7 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-slate-300 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow mt-2 active:border-t-[#404040] active:border-l-[#404040]"
                >
                  خروج
                </button>
              )}
            </div>

            {/* إطار GroupBox الجدول على اليسار */}
            <div className="flex-1 relative border border-slate-500 pt-3 pb-2 px-2 bg-[#d4d0c8]">
              <span className="absolute -top-2.5 right-3 bg-[#d4d0c8] px-1.5 text-xs text-slate-700 font-bold">
                {groupTitle}
              </span>

              {/* جدول البيانات DataWindow */}
              <div className="border border-slate-600 bg-white overflow-hidden">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold select-none">
                      <th className="border-l border-slate-400 py-1.5 px-3 text-right">وصف</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">التاريخ</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">المبلغ</th>
                      <th className="border-l border-slate-400 py-1.5 px-3 text-right w-44">المورد</th>
                      <th className="py-1.5 px-2 w-16">الكود</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const isSelected = selectedIdx === idx;
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedIdx(idx)}
                          className={`cursor-pointer border-b border-slate-200 ${
                            isSelected ? 'bg-blue-50 font-bold' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          {/* وصف */}
                          <td className="border-l border-slate-300 py-1 px-2 text-right">
                            <input
                              type="text"
                              value={row.descrip}
                              onChange={e => handleFieldChange(idx, 'descrip', e.target.value)}
                              className="w-full text-right bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>

                          {/* التاريخ */}
                          <td className="border-l border-slate-300 py-1 px-1 text-center">
                            <span>{row.trans_date}</span>
                          </td>

                          {/* المبلغ */}
                          <td className="border-l border-slate-300 py-1 px-2">
                            <input
                              type="number"
                              value={row.amount || ''}
                              onChange={e => handleFieldChange(idx, 'amount', Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>

                          {/* المورد */}
                          <td className="border-l border-slate-300 py-1 px-2 text-right">
                            <select
                              value={row.sup_name}
                              onChange={e => handleFieldChange(idx, 'sup_name', e.target.value)}
                              className="w-full bg-[#0055ea] text-white font-bold outline-none px-1 py-0.5 cursor-pointer"
                            >
                              {db.suppliers.map((s, sIdx) => (
                                <option key={`ssw_sup_${s.sup_id}_${sIdx}`} value={s.sup_name} className="bg-white text-slate-900">
                                  {s.sup_name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* الكود */}
                          <td className="py-1 px-2 font-mono text-slate-900">
                            {row.code}
                          </td>
                        </tr>
                      );
                    })}

                    {Array.from({ length: Math.max(0, 6 - rows.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-6 border-b border-slate-200">
                        <td className="border-l border-slate-300"></td>
                        <td className="border-l border-slate-300"></td>
                        <td className="border-l border-slate-300"></td>
                        <td className="border-l border-slate-300"></td>
                        <td></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* صف الإجمالي */}
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">اجمالي</span>
                  <div className="bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-3 py-0.5 text-center font-bold text-xs min-w-20 shadow-inner text-slate-950 font-mono">
                    {totalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

            </div>



          </div>

        </div>

        {/* 3. شريط الحالة السفلي */}
        <div className="bg-[#cfd5dc] border-t border-slate-400 px-3 py-1 flex items-center justify-between text-xs text-slate-700">
          <span className="font-mono">{statusMessage}</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span>الإجمالي: <strong>{totalAmount.toLocaleString()} ج.م</strong></span>
          </div>
        </div>

      </div>

      {/* نافذة معاينة الطباعة */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border-4 border-slate-700 shadow-2xl p-4 text-slate-900" dir="rtl">
            <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
              <h2 className="text-lg font-black">{db.company.branch || 'محل 67 - سوق الجملة'}</h2>
              <h3 className="text-sm font-bold text-slate-700">{windowTitle}</h3>
              <p className="text-xs text-slate-500 font-mono">التاريخ: {transDate}</p>
            </div>

            <div className="mb-4">
              <table className="w-full text-xs text-center border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-1 border border-slate-300">الكود</th>
                    <th className="p-1 border border-slate-300">المورد</th>
                    <th className="p-1 border border-slate-300">المبلغ</th>
                    <th className="p-1 border border-slate-300">الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300 font-mono">{r.code}</td>
                      <td className="p-1 border border-slate-300 font-bold">{r.sup_name}</td>
                      <td className="p-1 border border-slate-300 font-mono font-bold text-rose-800">{r.amount.toLocaleString()} ج.م</td>
                      <td className="p-1 border border-slate-300">{r.descrip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-400">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
