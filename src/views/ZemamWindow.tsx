import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { Customer, Zemam } from '../types/schema';
import {
  FileText,
  Search,
  Printer,
  Users,
  AlertTriangle,
  ArrowDownRight,
  Filter,
  X
} from 'lucide-react';

interface ZemamWindowProps {
  onClose?: () => void;
}

export const ZemamWindow: React.FC<ZemamWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // إجمالي الأرصدة
  const totalBalances = db.customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalCrates = db.customers.reduce((sum, c) => sum + (c.crates_balance || 0), 0);

  // تصفية حركات دفتر الذمم
  const filteredZemam = db.zemam.filter(z => {
    const matchCust = selectedCustomer === 'all' || z.customer_name === selectedCustomer;
    const matchSearch =
      z.customer_name.includes(searchQuery) ||
      z.nakla_name.includes(searchQuery) ||
      z.customer_code.toString().includes(searchQuery);
    return matchCust && matchSearch;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>دفتر ذمم وأرصدة العملاء والتجار (w_zemam_balance)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">dw_zemam</span>
            </h1>
            <p className="text-xs text-slate-500">
              متابعة مديونيات التجار والبيع الآجل والتحصيل وصافي رهن الفوارغ في السوق
            </p>
          </div>
        </div>

        {/* إحصائيات سريعة وزر الإغلاق */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded">
            <span className="text-rose-600 block text-[10px]">إجمالي ديون التجار بالسوق:</span>
            <span className="font-mono font-black text-rose-800 text-sm">{totalBalances.toLocaleString()} جنيه</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded">
            <span className="text-amber-600 block text-[10px]">الفوارغ بالذمة بالسوق:</span>
            <span className="font-mono font-black text-amber-800 text-sm">{totalCrates.toLocaleString()} عبوة</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="إغلاق الشاشة"
              className="p-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 font-bold shadow-xs transition-all"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. جدول أرصدة العملاء الحالية (Customer Balances Strip) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
          <span className="font-bold text-slate-800">أرصدة التجار المعتمدين (w_customers)</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs font-medium border border-slate-300"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة كشف الأرصدة والديون</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {db.customers.filter(c => c.customer_name !== 'عميل نقدي عام (قطاعي)').map(cust => (
            <div
              key={cust.customer_id}
              onClick={() => setSelectedCustomer(cust.customer_name)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedCustomer === cust.customer_name
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800">{cust.customer_name}</span>
                <span className="font-mono text-slate-400">#{cust.customer_code}</span>
              </div>
              <div className="text-[11px] text-slate-500 mb-2">{cust.customer_address} - {cust.customer_mobile || 'بدون هاتف'}</div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">المديونية:</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {cust.current_balance?.toLocaleString()} ج
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500">الفوارغ:</span>
                <span className="font-mono font-bold text-amber-700">
                  {cust.crates_balance || 0} فارغ
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. كشف حركات الذمم التفصيلي (dw_zemam) */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">حركات الشراء الآجل والذمم (dw_zemam)</span>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold"
            >
              <option value="all">-- عرض جميع التجار --</option>
              {db.customers.map((c, cIdx) => (
                <option key={`zemam_c_${c.customer_id}_${cIdx}`} value={c.customer_name}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الحركات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs w-48 text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">اسم التاجر</th>
                <th className="p-2">النقلة</th>
                <th className="p-2 font-bold text-rose-800">المبلغ الآجل (zemam)</th>
                <th className="p-2 text-amber-700">سماح (samah)</th>
                <th className="p-2 font-bold text-emerald-800">المحصل (tahseel)</th>
                <th className="p-2 font-black text-slate-900">الصافي المتبقي</th>
                <th className="p-2">رهن الفوارغ</th>
                <th className="p-2">صافي الرهن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredZemam.map((z, idx) => (
                <tr key={`zemam_${z.id}_${idx}`} className="hover:bg-slate-50">
                  <td className="p-2 font-mono text-slate-400">#{z.id}</td>
                  <td className="p-2 font-mono text-slate-500">{z.trans_date}</td>
                  <td className="p-2 font-semibold text-slate-800">{z.customer_name}</td>
                  <td className="p-2 text-slate-600">{z.nakla_name}</td>
                  <td className="p-2 font-mono font-bold text-rose-700">{z.zemam.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-amber-700">{z.samah ? `${z.samah} ج` : '-'}</td>
                  <td className="p-2 font-mono font-bold text-emerald-800">{z.tahseel.toLocaleString()} ج</td>
                  <td className="p-2 font-mono font-black text-slate-900">{z.safi_zemam.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-slate-600">{z.rahn ? `${z.rahn} ج` : '-'}</td>
                  <td className="p-2 font-mono text-amber-700 font-semibold">{z.safi_rahn ? `${z.safi_rahn} ج` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
