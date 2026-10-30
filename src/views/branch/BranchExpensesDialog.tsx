import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Plus, Printer, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';
import { BranchExp } from '../../types/schema';

interface BranchExpensesDialogProps {
  onClose: () => void;
}

export const BranchExpensesDialog: React.FC<BranchExpensesDialogProps> = ({ onClose }) => {
  const [db, setDb] = useState(() => wholesaleStore.getState());
  const [transDate, setTransDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expName, setExpName] = useState('عمالة وشيل ومشال');
  const [customExpName, setCustomExpName] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const [amount, setAmount] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setDb({ ...wholesaleStore.getState() });
    });
    return unsub;
  }, []);

  const spinDate = (days: number) => {
    try {
      const d = new Date(transDate);
      d.setDate(d.getDate() + days);
      setTransDate(d.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  };

  const handleAddNewRow = () => {
    setIsAddMode(true);
    setSelectedRowId(null);
    setAmount('');
    setNotes('');
    setMessage('تم فتح داتا ويندو إضافة مصروف جديد');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteButton = () => {
    if (!isAddMode) {
      setMessage('⚠️ في شاشة الاستعراض لا يمكن الحذف، الحذف والتعديل من شاشة التعديلات');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setIsAddMode(false);
    setAmount('');
    setNotes('');
    setMessage('تم إلغاء الإضافة والرجوع لشاشة الاستعراض');
    setTimeout(() => setMessage(''), 2500);
  };

  const handleSave = () => {
    if (!isAddMode) {
      setMessage('شاشة الاستعراض للقراءة فقط. لإضافة مصروف اضغط (+)، وللتعديل افتح شاشة التعديلات.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const finalName = expName === 'أخرى (اكتب يدوياً)' ? customExpName.trim() : expName.trim();
    const numAmount = Number(amount);

    if (!finalName) {
      setMessage('يرجى تحديد بند المصروف');
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setMessage('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    wholesaleStore.addBranchExp({
      exp_name: finalName,
      exp_amount: numAmount,
      date: transDate,
      notes: notes.trim()
    });

    setMessage(`✓ تم تسجيل المصروف (${finalName}) بمبلغ ${numAmount.toLocaleString()} ج بنجاح`);
    setTimeout(() => setMessage(''), 3500);
    setIsAddMode(false);
    setAmount('');
    setNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalExpenses = db.branch_exps.reduce((sum, e) => sum + (e.exp_amount || 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-[#cfcfcf] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
        {/* Title Bar (Classic PowerBuilder Style) */}
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
            <span>مصروفات الفرع (w_branch_exps)</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              🏢
            </span>
          </div>
        </div>

        {/* Dialog Header / Controls Box */}
        <div className="p-3 bg-[#e0ded8] border-b border-slate-400 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* أزرار التحكم الكلاسيكية (+ و - وحفظ وطباعة) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddNewRow}
                title="إضافة مصروف جديد (+)"
                className={`w-8 h-8 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center justify-center font-bold text-lg shadow-sm cursor-pointer ${
                  isAddMode ? 'bg-amber-100 ring-1 ring-amber-400' : 'bg-[#ece9d8] hover:bg-white active:bg-slate-300'
                }`}
              >
                <Plus className="w-5 h-5 text-emerald-800 stroke-[3]" />
              </button>

              <button
                onClick={handleDeleteButton}
                title={isAddMode ? "إلغاء الإضافة (-)" : "حذف (غير متاح في الاستعراض)"}
                className={`w-8 h-8 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center justify-center font-bold text-lg shadow-sm ${
                  isAddMode ? 'bg-[#fcdada] hover:bg-[#f8c4c4] cursor-pointer' : 'bg-[#ece9d8] text-slate-400 cursor-not-allowed opacity-80'
                }`}
              >
                <Minus className="w-5 h-5 text-rose-800 stroke-[3]" />
              </button>

              <button
                onClick={handleSave}
                title="حفظ المصروف"
                className="px-4 h-8 bg-[#c2e2c2] hover:bg-[#b0d8b0] active:bg-[#9ecc9e] border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center gap-1.5 text-xs font-bold text-slate-900 shadow-sm cursor-pointer"
              >
                <span>حفظ</span>
              </button>

              <button
                onClick={handlePrint}
                title="طباعة"
                className="w-8 h-8 bg-[#ece9d8] hover:bg-white active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center justify-center text-slate-900 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-800" />
              </button>
            </div>

            {/* حقل التاريخ الدوار */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">التاريخ:</span>
              <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5">
                <input
                  type="text"
                  value={transDate}
                  onChange={e => setTransDate(e.target.value)}
                  className="w-24 text-center text-xs font-bold font-mono outline-none text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* حقول إدخال الصف الجديد */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 bg-[#f4f2ee] p-2 border border-slate-300">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700">بند المصروف:</label>
              <select
                value={expName}
                onChange={e => setExpName(e.target.value)}
                className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-xs px-2 py-1 font-bold outline-none"
              >
                {db.expenses.map((e, idx) => (
                  <option key={`bed_exp_${e.exp_id}_${idx}`} value={e.exp_name}>
                    {e.exp_name}
                  </option>
                ))}
                <option value="أخرى (اكتب يدوياً)">أخرى (اكتب يدوياً)...</option>
              </select>
              {expName === 'أخرى (اكتب يدوياً)' && (
                <input
                  type="text"
                  placeholder="اكتب بند المصروف هنا..."
                  value={customExpName}
                  onChange={e => setCustomExpName(e.target.value)}
                  className="mt-1 bg-white border border-slate-400 text-xs px-2 py-1 font-bold outline-none"
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700">المبلغ (ج):</label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-xs px-2 py-1 font-bold text-slate-900 outline-none text-left font-mono"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-700">ملاحظات وبيان الصرف:</label>
              <input
                type="text"
                placeholder="بيان المصروف أو اسم المستلم..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white text-xs px-2 py-1 font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          {message && (
            <div className="mt-2 text-xs font-bold text-blue-900 bg-blue-100 border border-blue-400 px-2 py-1">
              {message}
            </div>
          )}
        </div>

        {/* DataWindow Table (PowerBuilder Style) */}
        <div className="flex-1 bg-[#cfcfcf] p-3 overflow-auto flex flex-col">
          <div className="bg-[#b3d1ea] border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 p-1 mb-2 font-bold text-xs text-slate-900 text-center shadow-sm">
            كشف حركة مصروفات الفرع المسجلة
          </div>

          <div className="flex-1 bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white overflow-auto shadow-inner">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-[#c2daf0] sticky top-0 border-b-2 border-slate-400 select-none">
                <tr className="text-slate-900 font-bold">
                  <th className="p-1.5 border-l border-slate-400 text-center w-12">م</th>
                  <th className="p-1.5 border-l border-slate-400 text-center w-28">التاريخ</th>
                  <th className="p-1.5 border-l border-slate-400">بند المصروف</th>
                  <th className="p-1.5 border-l border-slate-400 text-left w-28 font-mono">المبلغ (ج)</th>
                  <th className="p-1.5">الملاحظات والبيان</th>
                </tr>
              </thead>
              <tbody>
                {db.branch_exps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      لا توجد مصروفات فرع مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  db.branch_exps.map((exp, idx) => {
                    const isSelected = selectedRowId === exp.id;
                    return (
                      <tr
                        key={`bed_row_${exp.id}_${idx}`}
                        onClick={() => setSelectedRowId(exp.id)}
                        className={`border-b border-slate-200 cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-200 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50 hover:bg-sky-50'
                        }`}
                      >
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {exp.date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-bold text-slate-900">
                          {exp.exp_name}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-left font-mono font-bold text-rose-700">
                          {exp.exp_amount.toLocaleString()}
                        </td>
                        <td className="p-1.5 text-slate-700">
                          {exp.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Totals (Classic PowerBuilder status bar) */}
          <div className="mt-2 bg-[#dcdad4] border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white p-2 flex items-center justify-between text-xs font-bold text-slate-900">
            <div>
              <span>عدد الحركات: </span>
              <span className="font-mono text-blue-900">{db.branch_exps.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>إجمالي مصروفات الفرع:</span>
              <span className="bg-white px-3 py-1 border border-slate-400 font-mono text-sm text-rose-700">
                {totalExpenses.toLocaleString()} ج
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
