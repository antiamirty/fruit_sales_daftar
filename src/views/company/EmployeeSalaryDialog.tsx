import React, { useState } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';
import { EmployeeSalaryRecord } from '../../types/schema';

interface EmployeeSalaryDialogProps {
  onClose: () => void;
}

export const EmployeeSalaryDialog: React.FC<EmployeeSalaryDialogProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [currentDate, setCurrentDate] = useState('2026/10/11');
  const [salaries, setSalaries] = useState<EmployeeSalaryRecord[]>(
    db.employee_salaries && db.employee_salaries.length > 0
      ? db.employee_salaries
      : [
          { id: 1, code: 1, employee_name: 'محمد أحمد', amount: 4500, date: '2026/10/11' },
          { id: 2, code: 2, employee_name: 'علي إبراهيم', amount: 4000, date: '2026/10/11' }
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
    const nextId = salaries.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
    const defaultEmp = db.employees?.[0]?.name || 'محمد أحمد';
    const defaultCode = db.employees?.[0]?.code || 1;
    const newSalaries = [
      ...salaries,
      { id: nextId, code: defaultCode, employee_name: defaultEmp, amount: 0, date: currentDate }
    ];
    setSalaries(newSalaries);
    setSelectedIndex(newSalaries.length - 1);
  };

  const handleDeleteRow = () => {
    if (salaries.length === 0) return;
    const targetIdx = selectedIndex >= 0 && selectedIndex < salaries.length ? selectedIndex : salaries.length - 1;
    const newSalaries = salaries.filter((_, idx) => idx !== targetIdx);
    setSalaries(newSalaries);
    setSelectedIndex(Math.max(0, newSalaries.length - 1));
  };

  const handleUpdate = (idx: number, field: keyof EmployeeSalaryRecord, value: any) => {
    const updated = [...salaries];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'employee_name') {
      const match = db.employees.find(e => e.name === value);
      if (match) updated[idx].code = match.code;
    }
    setSalaries(updated);
  };

  const handleSave = () => {
    wholesaleStore.saveEmployeeSalaries(salaries);
    setMsg('تم حفظ تسجيل مرتبات الموظفين بنجاح');
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
            <span>تسجيل مرتب موظف</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              💼
            </span>
          </div>
        </div>

        {/* Dialog Body (مطابق للصورة 6) */}
        <div className="p-6 bg-[#b8b8b8] flex flex-col gap-3 min-h-[300px]">
          {/* Top Date Picker */}
          <div className="flex items-center justify-start">
            <div className="flex items-center bg-white border-2 border-slate-700 px-3 py-0.5 shadow-inner">
              <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                {currentDate}
              </span>
            </div>
          </div>

          {/* Main Area: Buttons on right + Gray DataWindow Table */}
          <div className="flex items-start gap-4">
            {/* Buttons on Right */}
            <div className="flex flex-col gap-2 pt-5">
              <button
                onClick={handleAddRow}
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                title="إضافة سطر صرف مرتب جديد"
              >
                +
              </button>

              <button
                onClick={handleDeleteRow}
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-lg font-bold flex items-center justify-center text-slate-900 shadow-sm active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                title="حذف سطر المرتب"
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
                title="طباعة إيصال صرف المرتب"
              >
                <Printer className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* DataWindow Table (خلفية رمادية مطابقة للصورة 6) */}
            <div className="flex-1 bg-[#a9b7be] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-md">
              {/* Header Box */}
              <div className="bg-[#b3d1ea] border-b border-slate-500 py-1 px-2 text-right text-xs font-bold text-slate-900">
                تسجيل مرتب موظف
              </div>

              {/* Table Column Titles */}
              <div className="grid grid-cols-4 bg-[#cde0f0] border-b border-slate-500 text-center text-xs font-bold text-slate-900">
                <div className="py-1 border-l border-slate-400">التاريخ</div>
                <div className="py-1 border-l border-slate-400">المبلغ</div>
                <div className="py-1 border-l border-slate-400">الموظف</div>
                <div className="py-1">الكود</div>
              </div>

              {/* Rows inside Workspace */}
              <div className="min-h-[160px] max-h-[240px] overflow-y-auto bg-[#a9b7be] p-1 space-y-1">
                {salaries.map((sal, idx) => {
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
                          value={sal.date}
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
                          value={sal.amount || ''}
                          onChange={e => handleUpdate(idx, 'amount', Number(e.target.value))}
                          placeholder="المبلغ"
                          className={`w-full text-center font-bold outline-none bg-transparent ${
                            isSelected ? 'text-white' : 'text-blue-900'
                          }`}
                        />
                      </div>

                      {/* الموظف */}
                      <div className="border-l border-slate-300 p-0.5">
                        <select
                          value={sal.employee_name}
                          onChange={e => handleUpdate(idx, 'employee_name', e.target.value)}
                          className={`w-full text-right outline-none bg-transparent text-xs ${
                            isSelected ? 'text-white bg-[#1a4f82]' : 'text-slate-900 bg-white'
                          }`}
                        >
                          {db.employees.map((e, eIdx) => (
                            <option key={`sal_emp_${e.code}_${eIdx}`} value={e.name}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* الكود */}
                      <div className="p-0.5 text-center font-bold">
                        {sal.code}
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
