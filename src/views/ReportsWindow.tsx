import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Building2,
  Truck,
  Scale,
  X
} from 'lucide-react';

interface ReportsWindowProps {
  onClose?: () => void;
}

export const ReportsWindow: React.FC<ReportsWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const todayStr = new Date().toISOString().split('T')[0];

  const salesF = db.fatora_f.filter(f => dateFilter === 'all' || f.trans_date === todayStr);
  const salesBanana = db.fatora_banana.filter(f => dateFilter === 'all' || f.trans_date === todayStr);

  const totalWholesaleSales =
    salesF.reduce((sum, f) => sum + f.tota, 0) +
    salesBanana.reduce((sum, f) => sum + f.totally, 0);

  const totalWeightSold =
    salesF.reduce((sum, f) => sum + f.net_weight, 0) +
    salesBanana.reduce((sum, f) => sum + f.net_weight, 0);

  const totalCommissionsEarned = db.safi_fatora.reduce((sum, s) => sum + s.comission, 0);
  const totalBranchExpenses = db.branch_exps.reduce((sum, e) => sum + e.exp_amount, 0);

  // صافي أرباح الوكالة التشغيلية = العمولات المستقطعة - مصروفات الفرع
  const netAgencyProfit = totalCommissionsEarned - totalBranchExpenses;

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>تقارير المبيعات والأرباح والعمولات (w_reports & w_statistics)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">dw_reports</span>
            </h1>
            <p className="text-xs text-slate-500">
              ملخص إيرادات الوكالة وعمولات النقلات وصافي ربح الفرع بعد خصم المصروفات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                dateFilter === 'all' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              جميع الحركات
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                dateFilter === 'today' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
              }`}
            >
              حركات اليوم فقط
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-semibold shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="إغلاق الشاشة"
              className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded text-xs font-bold shadow-xs transition-all"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. مؤشرات الأداء المالية (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-slate-500 block text-[11px] mb-1">إجمالي حجم التداول والمبيعات:</span>
          <span className="font-mono font-black text-slate-900 text-xl block">
            {totalWholesaleSales.toLocaleString()} ج
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">مجموع فواتير الخضار والفاكهة</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-slate-500 block text-[11px] mb-1">إجمالي الوزن المباع:</span>
          <span className="font-mono font-black text-emerald-700 text-xl block">
            {totalWeightSold.toLocaleString()} كجم
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">{(totalWeightSold / 1000).toFixed(2)} طن</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-slate-500 block text-[11px] mb-1">عمولات الوكالة المحققة:</span>
          <span className="font-mono font-black text-emerald-800 text-xl block">
            +{totalCommissionsEarned.toLocaleString()} ج
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">نسبة العمولة المستقطعة من النقلات</span>
        </div>

        <div className="bg-emerald-950 text-white p-3.5 rounded-lg border border-emerald-900 shadow-sm">
          <span className="text-emerald-300 block text-[11px] mb-1">صافي أرباح الوكالة (Net Profit):</span>
          <span className="font-mono font-black text-emerald-400 text-xl block">
            {netAgencyProfit.toLocaleString()} جنيه
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-1">العمولات - مصروفات تشغيل الفرع</span>
        </div>
      </div>

      {/* 3. تقرير عمولات وتصفية النقلات */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center justify-between">
          <span>سجل عمولات النقلات المصفاة (w_farm_revenues_comission)</span>
          <span className="font-mono text-emerald-700 font-bold">
            إجمالي العمولات: {totalCommissionsEarned.toLocaleString()} جنيه
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">رقم</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">اسم النقلة</th>
                <th className="p-2">المورد</th>
                <th className="p-2 font-bold">إجمالي المبيعات</th>
                <th className="p-2 font-black text-emerald-800">عمولة الوكالة المحصلة</th>
                <th className="p-2 font-bold text-slate-700">صافي المستحق للمورد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {db.safi_fatora.map((s, idx) => (
                <tr key={`rep_safi_${s.id}_${idx}`} className="hover:bg-slate-50">
                  <td className="p-2 font-mono text-slate-400">#{s.id}</td>
                  <td className="p-2 font-mono text-slate-500">{s.trans_date}</td>
                  <td className="p-2 font-bold text-slate-800">{s.nakla_name}</td>
                  <td className="p-2 text-slate-700">{s.sup_name}</td>
                  <td className="p-2 font-mono">{s.egmaly.toLocaleString()} ج</td>
                  <td className="p-2 font-mono font-black text-emerald-700 text-sm">+{s.comission.toLocaleString()} ج</td>
                  <td className="p-2 font-mono font-bold text-slate-800">{s.safi_fatora.toLocaleString()} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
