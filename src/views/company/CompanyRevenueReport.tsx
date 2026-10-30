import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';

interface CompanyRevenueReportProps {
  mode:
    | 'w_company_revenue_today'
    | 'w_company_revenue_period'
    | 'w_company_revenue_fatora'
    | 'w_company_revenue_period_fatora';
  onClose: () => void;
}

export const CompanyRevenueReport: React.FC<CompanyRevenueReportProps> = ({ mode, onClose }) => {
  const isPeriod = mode === 'w_company_revenue_period' || mode === 'w_company_revenue_period_fatora';
  const isFatora = mode === 'w_company_revenue_fatora' || mode === 'w_company_revenue_period_fatora';

  const [singleDate, setSingleDate] = useState('2026/10/11');
  const [fromDate, setFromDate] = useState('2024/01/01');
  const [toDate, setToDate] = useState('2026/10/11');

  // Revenue stats
  const [stats, setStats] = useState(() =>
    wholesaleStore.getCompanyRevenue({
      fromDate: isPeriod ? fromDate.replace(/\//g, '-') : undefined,
      toDate: isPeriod ? toDate.replace(/\//g, '-') : singleDate.replace(/\//g, '-'),
      byFatoraDate: isFatora
    })
  );

  const calculateReport = () => {
    const res = wholesaleStore.getCompanyRevenue({
      fromDate: isPeriod ? fromDate.replace(/\//g, '-') : undefined,
      toDate: isPeriod ? toDate.replace(/\//g, '-') : singleDate.replace(/\//g, '-'),
      byFatoraDate: isFatora
    });
    setStats(res);
  };

  useEffect(() => {
    calculateReport();
  }, [mode, singleDate, fromDate, toDate]);

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

  const getWindowTitle = () => {
    switch (mode) {
      case 'w_company_revenue_today':
        return 'ايراد الشركة';
      case 'w_company_revenue_period':
        return 'ايراد الشركة عن فترة';
      case 'w_company_revenue_fatora':
        return 'ايراد الشركة بتاريخ الفاتورة';
      case 'w_company_revenue_period_fatora':
        return 'ايراد الشركة عن فترة بتاريخ الفاتورة';
    }
  };

  const getReportHeader = () => {
    if (isPeriod) {
      return `تقرير ايراد الشركة من ${fromDate} الى ${toDate}`;
    }
    return `تقرير ايراد الشركة حتى ${singleDate}`;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-2 font-sans select-none" dir="rtl">
      <div className="w-full max-w-4xl h-[92vh] flex flex-col bg-[#008080] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl overflow-hidden">
        {/* Title Bar (Classic Windows Blue/Gray Gradient) */}
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
            <span>{getWindowTitle()}</span>
            <span className="w-3.5 h-3.5 rounded-full bg-teal-800 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              📊
            </span>
          </div>
        </div>

        {/* Report Canvas (الخلفية التركوازية الداكنة #008080) */}
        <div className="flex-1 bg-[#008080] p-6 overflow-y-auto flex flex-col justify-between">
          {/* Top Date Selection Bar */}
          <div className="flex items-center gap-4 text-xs font-bold text-white mb-4">
            {!isPeriod ? (
              /* Single Date Picker */
              <div className="flex items-center bg-white border border-slate-700 px-2 py-0.5 shadow-inner">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {singleDate}
                </span>
              </div>
            ) : (
              /* Date Range Pickers */
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
            )}
          </div>

          {/* White Central Report Box (مطابق للصورة 7 و 8 و 12 و 14) */}
          <div className="w-full max-w-2xl bg-white border border-slate-400 p-6 shadow-xl mx-auto my-2">
            {/* Report Blue Title */}
            <h2 className="text-center text-blue-700 font-bold text-base mb-6 tracking-wide">
              {getReportHeader()}
            </h2>

            {/* Grid 2 Columns: Revenues on Left, Expenses on Right */}
            <div className="grid grid-cols-2 gap-8 text-xs font-bold">
              {/* Left Column: Revenues (الإيرادات) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-blue-800 font-bold">
                    {stats.commission.toLocaleString()}
                  </div>
                  <span className="text-blue-800">العمولة</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-blue-800 font-bold">
                    {stats.byaaa.toLocaleString()}
                  </div>
                  <span className="text-blue-800">بياعة</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-slate-700">
                    {stats.purchaseYields || '0'}
                  </div>
                  <span className="text-blue-800">عوائد مشتريات</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-slate-700">
                    {stats.rentalFloor || '0'}
                  </div>
                  <span className="text-blue-800">فرش عدة</span>
                </div>

                {/* اجمالي ايرادات */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="w-28 py-1 px-2 bg-white border-2 border-black text-center font-mono text-blue-900 font-extrabold text-sm">
                    {stats.totalRevenues.toLocaleString()}
                  </div>
                  <span className="text-blue-900 text-sm font-extrabold">اجمالي ايرادات</span>
                </div>
              </div>

              {/* Right Column: Expenses (المصروفات) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-rose-700">
                    {stats.branchExpsTotal || '0'}
                  </div>
                  <span className="text-rose-700">مصروفات الفرع</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-rose-700">
                    {stats.salariesTotal || '0'}
                  </div>
                  <span className="text-rose-700">المرتبات</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-rose-700">
                    {stats.invoiceAdds || '0'}
                  </div>
                  <span className="text-rose-700">اضافة فواتير</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-28 py-0.5 px-2 bg-white border border-slate-400 text-center font-mono text-slate-700 min-h-[22px]">
                    {stats.priceDiffs || ' '}
                  </div>
                  <span className="text-rose-700">فروق اسعار</span>
                </div>

                {/* اجمالي مصروفات */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="w-28 py-1 px-2 bg-white border-2 border-black text-center font-mono text-rose-800 font-extrabold text-sm">
                    {stats.totalExpenses || '0'}
                  </div>
                  <span className="text-rose-800 text-sm font-extrabold">اجمالي مصروفات</span>
                </div>
              </div>
            </div>

            {/* Bottom Net Revenue Box (صافي الايراد) */}
            <div className="mt-8 flex items-center justify-center gap-4 pt-4 border-t-2 border-slate-300">
              <span className="text-blue-900 font-extrabold text-sm">صافي الايراد</span>
              <div className="w-36 py-1 px-3 bg-white border-2 border-black text-center font-mono text-blue-900 font-black text-base shadow-inner">
                {stats.netRevenue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons (طباعة وعرض) */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => window.print()}
              className="w-12 h-9 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center text-slate-900 shadow-md active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              title="طباعة التقرير"
            >
              <Printer className="w-6 h-6 text-slate-900" />
            </button>

            {isPeriod && (
              <button
                onClick={calculateReport}
                className="px-8 py-1.5 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold text-slate-900 shadow-md active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
              >
                عرض
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
