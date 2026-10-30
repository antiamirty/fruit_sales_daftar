import React, { useState } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';

interface EmployeeSalaryReportProps {
  onClose: () => void;
}

export const EmployeeSalaryReport: React.FC<EmployeeSalaryReportProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [fromDate, setFromDate] = useState('2024/01/11');
  const [toDate, setToDate] = useState('2026/10/11');
  const [selectedEmp, setSelectedEmp] = useState(db.employees?.[0]?.name || 'محمد أحمد');

  const spinDate = (
    current: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    days: number
  ) => {
    try {
      const parts = current.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setter(`${y}/${m}/${day}`);
      }
    } catch {
      // ignore
    }
  };

  // Filter salaries for selected employee
  const filteredSalaries = (db.employee_salaries || []).filter(
    s => s.employee_name === selectedEmp
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-4xl h-[92vh] flex flex-col bg-[#008080] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
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
            <span>تقرير مرتب موظف</span>
            <span className="w-3.5 h-3.5 rounded-full bg-teal-800 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              📋
            </span>
          </div>
        </div>

        {/* Content Canvas (مطابق للصورة 9) */}
        <div className="flex-1 bg-[#008080] p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Top Row: Date Range and Employee Select */}
            <div className="flex items-center justify-between text-xs font-bold text-white mb-6 flex-wrap gap-4">
              {/* Dates */}
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-bold">من</span>
                <div className="flex items-center bg-white border border-slate-700 px-2 py-0.5 shadow-inner">
                  <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                    {fromDate}
                  </span>
                </div>

                <span className="text-white text-sm font-bold">الى</span>
                <div className="flex items-center bg-white border border-slate-700 px-2 py-0.5 shadow-inner">
                  <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                    {toDate}
                  </span>
                </div>
              </div>

              {/* Employee Selection Box */}
              <div className="flex items-center gap-2 bg-white/90 p-1 border border-slate-400 text-slate-900">
                <span className="font-bold text-xs text-slate-800">الموظف:</span>
                <select
                  value={selectedEmp}
                  onChange={e => setSelectedEmp(e.target.value)}
                  className="bg-[#0055aa] text-white text-xs font-bold py-0.5 px-3 outline-none"
                >
                  {db.employees.map((e, eIdx) => (
                    <option key={`rep_emp_${e.code}_${eIdx}`} value={e.name} className="bg-white text-slate-900">
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Central White Table (المبلغ والتاريخ) */}
            <div className="w-full max-w-lg bg-white border border-slate-500 shadow-md">
              {/* Header */}
              <div className="grid grid-cols-2 bg-[#f0f0f0] border-b border-slate-400 text-center text-xs font-bold text-slate-900">
                <div className="py-1 border-l border-slate-400">التاريخ</div>
                <div className="py-1">المبلغ</div>
              </div>

              {/* Data Rows */}
              <div className="min-h-[200px] max-h-[350px] overflow-y-auto">
                {filteredSalaries.length > 0 ? (
                  filteredSalaries.map((sal, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 border-b border-slate-200 text-xs py-1 px-2 hover:bg-blue-50 text-center"
                    >
                      <div className="border-l border-slate-200 font-mono text-slate-800">
                        {sal.date}
                      </div>
                      <div className="font-mono font-bold text-blue-900">
                        {sal.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    لا توجد مسحوبات مرتبات مسجلة لهذا الموظف في هذه الفترة
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => window.print()}
              className="w-12 h-9 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center text-slate-900 shadow-md active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              title="طباعة التقرير"
            >
              <Printer className="w-6 h-6 text-slate-900" />
            </button>

            <button
              className="px-8 py-1.5 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold text-slate-900 shadow-md active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
            >
              عرض
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
