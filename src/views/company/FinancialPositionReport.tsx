import React, { useState } from 'react';
import { X, Minus, Square, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { wholesaleStore } from '../../services/storage';

interface FinancialPositionReportProps {
  onClose: () => void;
}

export const FinancialPositionReport: React.FC<FinancialPositionReportProps> = ({ onClose }) => {
  const [asOfDate, setAsOfDate] = useState('2026/10/11');
  const [data, setData] = useState(() => wholesaleStore.getFinancialPosition(asOfDate));

  const handleRefresh = () => {
    setData(wholesaleStore.getFinancialPosition(asOfDate));
  };

  const spinDate = (days: number) => {
    try {
      const parts = asOfDate.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + days);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setAsOfDate(`${y}/${m}/${day}`);
      }
    } catch {
      // ignore
    }
  };

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
            <span>المركز المالي في تاريخ</span>
            <span className="w-3.5 h-3.5 rounded-full bg-blue-700 border border-slate-700 flex items-center justify-center text-[8px] text-white font-mono">
              🏛️
            </span>
          </div>
        </div>

        {/* Content Canvas (رمادي كلاسيكي مطابق للصورة 11) */}
        <div className="flex-1 bg-[#cfcfcf] p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Top Date Picker */}
            <div className="flex items-center justify-start mb-6">
              <div className="flex items-center bg-white border border-slate-700 px-2 py-0.5 shadow-inner">
                <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {asOfDate}
                </span>
              </div>
            </div>

            {/* Central White Card (مطابق تماماً للصورة 11) */}
            <div className="w-full max-w-xl bg-white border border-slate-400 p-8 shadow-md mx-auto">
              {/* Header Box */}
              <div className="border border-slate-800 py-1 text-center font-bold text-xs text-slate-900 mb-6 bg-slate-50">
                المركز المالي في تاريخ
              </div>

              {/* Rows */}
              <div className="space-y-4 text-xs font-bold">
                {/* رصيد الخزينة */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-900">رصيد الخزينة</span>
                  <div className="w-36 py-1 px-2 border border-slate-700 text-center font-mono font-bold text-slate-900 bg-white">
                    {data.cashBalance.toLocaleString()}
                  </div>
                </div>

                {/* رصيد الزمام */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-900">رصيد الزمام</span>
                  <div className="w-36 py-1 px-2 border border-slate-700 text-center font-mono font-bold text-slate-900 bg-white">
                    {data.zemamBalance.toLocaleString()}
                  </div>
                </div>

                {/* رصيد الموردين */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-900">رصيد الموردين</span>
                  <div className="w-36 py-1 px-2 border border-slate-700 text-center font-mono font-bold text-slate-900 bg-white">
                    {data.suppliersBalance.toLocaleString()}
                  </div>
                </div>

                {/* رصيد مستلزمات تعبئة */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-900">رصيد مستلزمات تعبئة</span>
                  <div className="w-36 py-1 px-2 border border-slate-700 text-center font-mono font-bold text-slate-900 bg-white">
                    {data.packagingBalance.toLocaleString()}
                  </div>
                </div>

                {/* الاجمالي */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-slate-300">
                  <div className="border border-slate-800 px-4 py-0.5 font-bold">
                    الاجمالي
                  </div>
                  <div className="w-36 py-1 px-2 border-2 border-black text-center font-mono font-extrabold text-blue-900 bg-white shadow-inner text-sm">
                    {data.totalBalance.toLocaleString()}
                  </div>
                </div>
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
              onClick={handleRefresh}
              className="px-8 py-1.5 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold text-slate-900 shadow-md active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
            >
              المركز المالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
