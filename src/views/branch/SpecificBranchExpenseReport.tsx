import React, { useState } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';

interface SpecificBranchExpenseReportProps {
  onClose: () => void;
}

export const SpecificBranchExpenseReport: React.FC<SpecificBranchExpenseReportProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [fromDate, setFromDate] = useState('2026/01/01');
  const [toDate, setToDate] = useState('2026/10/11');
  const [selectedExpName, setSelectedExpName] = useState(
    db.expenses[0]?.exp_name || 'عمالة وشيل ومشال'
  );

  const spinDate = (which: 'from' | 'to', days: number) => {
    try {
      const current = which === 'from' ? fromDate : toDate;
      const parts = current.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const formatted = `${y}/${m}/${day}`;
        if (which === 'from') setFromDate(formatted);
        else setToDate(formatted);
      }
    } catch {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // فلترة الحركات
  const fromIso = fromDate.replace(/\//g, '-');
  const toIso = toDate.replace(/\//g, '-');

  const filteredExps = db.branch_exps.filter(e => {
    const matchesName = e.exp_name === selectedExpName;
    const matchesDate = e.date >= fromIso && e.date <= toIso;
    return matchesName && matchesDate;
  });

  const totalAmount = filteredExps.reduce((sum, e) => sum + (e.exp_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-[#cfcfcf] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#8ca8cb] via-[#b8cde4] to-[#8ca8cb] border-b border-slate-500 px-2 py-1 flex items-center justify-between shrink-0">
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
            <span>تقرير مصروف معين للفرع (w_rep_branch_specific_exp)</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              📊
            </span>
          </div>
        </div>

        {/* Filters Top Bar */}
        <div className="bg-[#e4e2dc] border-b border-slate-400 p-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* اختيار بند المصروف */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">بند المصروف:</span>
              <select
                value={selectedExpName}
                onChange={e => setSelectedExpName(e.target.value)}
                className="bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white text-xs px-2 py-1 font-bold text-slate-900 outline-none"
              >
                {db.expenses.map((e, idx) => (
                  <option key={`sbe_exp_${e.exp_id}_${idx}`} value={e.exp_name}>
                    {e.exp_name}
                  </option>
                ))}
              </select>
            </div>

            {/* من تاريخ */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">من:</span>
              <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5">
                <input
                  type="text"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-24 text-center text-xs font-bold font-mono outline-none text-slate-900"
                />
              </div>
            </div>

            {/* الى تاريخ */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">إلى:</span>
              <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5">
                <input
                  type="text"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-24 text-center text-xs font-bold font-mono outline-none text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#ece9d8] hover:bg-white active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center gap-1.5 text-xs font-bold text-slate-900 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Body Canvas (Classic PowerBuilder Deep Teal #008080) */}
        <div className="flex-1 bg-[#008080] p-4 overflow-auto flex flex-col items-center">
          {/* Printable Report Card */}
          <div className="w-full max-w-3xl bg-white border-2 border-slate-800 shadow-2xl p-6 min-h-[450px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="border-b-2 border-slate-800 pb-3 mb-4 text-center">
                <h1 className="text-base font-extrabold text-blue-900">
                  أبو حسن لتجارة الفاكهة بالجملة
                </h1>
                <h2 className="text-xs font-bold text-slate-700 mt-1">
                  سوق الجملة 6 أكتوبر - عنبر 1 محل 67 فاكهة
                </h2>
                <div className="inline-block mt-2 px-4 py-1 bg-slate-100 border border-slate-400 font-bold text-xs text-slate-900 rounded">
                  تقرير مصروف ({selectedExpName}) عن الفترة من {fromDate} إلى {toDate}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-right text-xs border border-slate-400 border-collapse">
                <thead className="bg-[#d4e4f4] border-b-2 border-slate-500">
                  <tr className="font-bold text-slate-900">
                    <th className="p-2 border border-slate-400 text-center w-12">م</th>
                    <th className="p-2 border border-slate-400 text-center w-28">التاريخ</th>
                    <th className="p-2 border border-slate-400">البيان / المستلم</th>
                    <th className="p-2 border border-slate-400 text-left w-32 font-mono">المبلغ (ج)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500 font-medium">
                        لا توجد حركات مسجلة لهذا المصروف في هذه الفترة
                      </td>
                    </tr>
                  ) : (
                    filteredExps.map((e, idx) => (
                      <tr key={`sbe_row_${e.id}_${idx}`} className="border-b border-slate-300 hover:bg-slate-50">
                        <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-mono">
                          {e.date}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-800">
                          {e.notes || e.exp_name}
                        </td>
                        <td className="p-2 border border-slate-300 text-left font-mono font-bold text-rose-700">
                          {e.exp_amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer Banner */}
            <div className="mt-6 pt-3 border-t-2 border-slate-800 flex items-center justify-between text-xs font-bold">
              <div className="text-slate-700">
                <span>عدد الحركات المنصرفة: </span>
                <span className="font-mono text-blue-900">{filteredExps.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  إجمالي منصرف ({selectedExpName}):
                </span>
                <span className="px-3 py-1 bg-rose-50 border-2 border-rose-600 font-mono text-base font-extrabold text-rose-800">
                  {totalAmount.toLocaleString()} ج
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
