import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { BranchExp } from '../types/schema';
import {
  Coins,
  Plus,
  Trash2,
  Save,
  Search,
  CheckCircle,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';

interface BranchExpensesWindowProps {
  onClose?: () => void;
}

export const BranchExpensesWindow: React.FC<BranchExpensesWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const [expName, setExpName] = useState(db.expenses[0]?.exp_name || 'عمالة وشيل ومشال');
  const [customExpName, setCustomExpName] = useState('');
  const [expAmount, setExpAmount] = useState<number>(150);
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = expName === 'أخرى (اكتب يدوياً)' ? customExpName.trim() : expName;
    if (!finalName || expAmount <= 0) return;

    wholesaleStore.addBranchExp({
      exp_name: finalName,
      exp_amount: Number(expAmount),
      date: expDate,
      notes: notes
    });

    setSuccessMsg(`تم تسجيل مصروف الفرع (${finalName}) بمبلغ ${expAmount.toLocaleString()} ج وخصمه من الخزينة.`);
    setTimeout(() => setSuccessMsg(''), 4000);

    setExpAmount(0);
    setNotes('');
  };

  const filteredExps = db.branch_exps.filter(
    e => e.exp_name.includes(searchQuery) || (e.notes && e.notes.includes(searchQuery))
  );

  const totalExps = db.branch_exps.reduce((sum, e) => sum + e.exp_amount, 0);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>مصروفات الفرع التشغيلية (w_branch_exps)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">dw_branch_exps</span>
            </h1>
            <p className="text-xs text-slate-500">
              تسجيل وتصنيف نفقات تشغيل الباكة والمحل اليومية (عمالة، شيالة، بوفيه، كهرباء، صيانة)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-lg text-xs">
            <span className="text-rose-600 block text-[10px]">إجمالي مصروفات الفرع المسجلة:</span>
            <span className="font-mono font-black text-rose-800 text-base">{totalExps.toLocaleString()} جنيه</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="إغلاق الشاشة"
              className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shadow-xs"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. النموذج والجدول */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* نموذج الإدخال */}
        <form onSubmit={handleAddExpense} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-rose-600" />
            <span>تسجيل سند صرف مصروف فرع</span>
          </h3>

          <div>
            <label className="block text-slate-600 font-medium mb-1">بند المصروف (exp_name) *</label>
            <select
              value={expName}
              onChange={e => setExpName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-bold focus:outline-emerald-600"
            >
              {db.expenses.map((e, idx) => (
                <option key={`bew_exp_${e.exp_id}_${idx}`} value={e.exp_name}>
                  {e.exp_name}
                </option>
              ))}
              <option value="أخرى (اكتب يدوياً)">-- أخرى (اكتب يدوياً) --</option>
            </select>
          </div>

          {expName === 'أخرى (اكتب يدوياً)' && (
            <div>
              <label className="block text-slate-600 font-medium mb-1">اسم البند يدوياً *</label>
              <input
                type="text"
                placeholder="اكتب اسم البند..."
                value={customExpName}
                onChange={e => setCustomExpName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-slate-600 font-bold mb-1">مبلغ المصروف (ج) *</label>
            <input
              type="number"
              min="1"
              value={expAmount}
              onChange={e => setExpAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-rose-300 rounded px-3 py-2 font-mono text-center font-black text-rose-800 text-lg shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">تاريخ الصرف</label>
            <input
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">البيان / تفاصيل المصروف</label>
            <input
              type="text"
              placeholder="مثال: شاي وسكر ومياه لعمال التنزيل"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold shadow flex items-center justify-center gap-1.5 mt-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ المصروف والخصم من الخزينة</span>
          </button>
        </form>

        {/* جدول المصروفات */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-800">سجل مصروفات الفرع (dw_branch_exps)</span>
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في المصروفات..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs w-44"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2 w-12">#</th>
                  <th className="p-2 w-24">التاريخ</th>
                  <th className="p-2">بند المصروف</th>
                  <th className="p-2 font-bold text-rose-800">المبلغ</th>
                  <th className="p-2">البيان / ملاحظات</th>
                  <th className="p-2 text-center w-12">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExps.map((exp, idx) => (
                  <tr key={`exp_${exp.id}_${idx}`} className="hover:bg-slate-50">
                    <td className="p-2 font-mono text-slate-400">#{exp.id}</td>
                    <td className="p-2 font-mono text-slate-500">{exp.date}</td>
                    <td className="p-2 font-bold text-slate-800">{exp.exp_name}</td>
                    <td className="p-2 font-mono font-bold text-rose-700">{exp.exp_amount.toLocaleString()} ج</td>
                    <td className="p-2 text-slate-500">{exp.notes || '-'}</td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => wholesaleStore.deleteBranchExp(exp.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
