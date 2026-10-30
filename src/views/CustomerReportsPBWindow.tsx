import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { Printer, Minus, Square, X } from 'lucide-react';
import { PBWindowName } from '../components/layout/TopMenu';

interface CustomerReportsPBWindowProps {
  mode: PBWindowName;
  onClose?: () => void;
}

export const CustomerReportsPBWindow: React.FC<CustomerReportsPBWindowProps> = ({ mode, onClose }) => {
  const db = wholesaleStore.getState();

  // الحقول وفلاتر التقرير
  const [fromDate, setFromDate] = useState<string>('2024/10/24');
  const [toDate, setToDate] = useState<string>('2026/10/12');
  const [singleDate, setSingleDate] = useState<string>('2026/10/12');
  const [selectedCustomer, setSelectedCustomer] = useState<string>(db.customers[0]?.customer_name || 'تاج');
  const [selectedNakla, setSelectedNakla] = useState<string>(db.naklat[0]?.nakla_name || 'ابراهيم هلال 1');
  const [hasDisplayed, setHasDisplayed] = useState<boolean>(true);

  // تحديد عنوان الشاشة المطابق للباور بيلدر بدقة
  const getWindowTitle = () => {
    switch (mode) {
      case 'w_rep_customer_purchases':
        return 'تقرير مشتريات زبون';
      case 'w_rep_customer_purchases_naklat':
        return 'تقرير مشتريات زبون مع النقلات';
      case 'w_rep_customer_zemam_tahseel':
        return 'تقرير زمام زبون';
      case 'w_rep_zemam_today':
        return 'تقرير زمام اليوم';
      case 'w_rep_sales_today':
        return 'تقرير مبيعات اليوم';
      case 'w_rep_customer_movement_detail':
        return 'تقرير زمام زبون مفصل';
      case 'w_rep_zemam_today_detail':
        return 'تقرير زمام اليوم مفصل';
      case 'w_rep_sales_today_nakla':
        return 'تقرير مبيعات اليوم بالنقلة';
      case 'w_rep_sales_nakla':
        return 'تقرير مبيعات نقلة';
      case 'w_rep_avg_prices_nakla':
        return 'تقرير مبيعات نقلة';
      default:
        return 'تقرير الزبائن';
    }
  };

  const title = getWindowTitle();

  // بيانات افتراضية حية للمبيعات/الحركات
  const sampleSales = [
    {
      id: 1,
      nakla: 'ابراهيم هلال 1',
      customer: 'تاج',
      total: 1250,
      price: 25,
      netWeight: 50,
      samah: 0,
      unit: 'شبك',
      category: 'ابوصرة',
      qty: 2,
      daily: 'يومية'
    },
    {
      id: 2,
      nakla: 'ابراهيم هلال 1',
      customer: 'ابانوب السوق',
      total: 2400,
      price: 24,
      netWeight: 100,
      samah: 0,
      unit: 'شبك',
      category: 'باذنجان',
      qty: 4,
      daily: 'يومية'
    },
    {
      id: 3,
      nakla: 'امين 1',
      customer: 'ابراهيم السيد',
      total: 3600,
      price: 30,
      netWeight: 120,
      samah: 0,
      unit: 'كبيرة',
      category: 'تين',
      qty: 6,
      daily: 'يومية'
    }
  ];

  // بيانات جدول متوسط الأسعار (الصورة 14)
  const avgPriceItems = [
    { desc: 'ابوصرة', qty: 150, unit: 'شبك', weight: 3750, price: 25, amount: 93750 },
    { desc: 'باذنجان', qty: 220, unit: 'شبك', weight: 4400, price: 22, amount: 96800 },
    { desc: 'تين برشومي', qty: 85, unit: 'صغيرة', weight: 850, price: 40, amount: 34000 }
  ];

  const totalZemam = 5600;
  const totalNakdi = 1650;

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-[#008080] p-3 text-slate-900 select-none flex flex-col font-sans overflow-auto" dir="rtl">
      
      {/* 1. شريط العنوان (MDI Child Window) مع أزرار التحكم على اليمين */}
      <div className="bg-[#cfd3db] h-6 flex items-center justify-between px-2 border-b border-[#a0a0a0] mb-3">
        {/* أزرار التحكم في النافذة على اليمين */}
        <div className="flex items-center gap-0.5">
          <button onClick={onClose} title="إغلاق" className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] hover:bg-rose-500 hover:text-white">
            <X className="w-3 h-3 stroke-[3]" />
          </button>
          <button title="تكبير" className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px]">
            <Square className="w-2.5 h-2.5 stroke-[2]" />
          </button>
          <button title="تصغير" className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px]">
            <Minus className="w-2.5 h-2.5 stroke-[3]" />
          </button>
        </div>

        {/* أيقونة واسم التقرير والكود على اليسار */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 font-bold text-[12px]">{title}</span>
          <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">
            {mode === 'w_rep_customer_purchases' && '5-5'}
            {mode === 'w_rep_customer_purchases_naklat' && '5-6'}
            {mode === 'w_rep_customer_zemam_tahseel' && '5-7'}
            {mode === 'w_rep_zemam_today' && '5-8'}
            {mode === 'w_rep_sales_today' && '5-9'}
            {mode === 'w_rep_customer_movement_detail' && '5-10'}
            {mode === 'w_rep_zemam_today_detail' && '5-11'}
            {mode === 'w_rep_sales_today_nakla' && '5-12'}
            {mode === 'w_rep_sales_nakla' && '5-13'}
            {mode === 'w_rep_avg_prices_nakla' && '5-14'}
          </span>
          <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>

      {/* 2. شريط الفلاتر العلوي المطابق للصور 5-14 من اليمين إلى اليسار */}
      <div className="flex items-center justify-start gap-4 mb-3 px-2 flex-wrap">
        
        {/* حالة نطاق التاريخ (من - إلى) للصور 5، 6، 7، 10 من اليمين إلى اليسار */}
        {(mode === 'w_rep_customer_purchases' ||
          mode === 'w_rep_customer_purchases_naklat' ||
          mode === 'w_rep_customer_zemam_tahseel' ||
          mode === 'w_rep_customer_movement_detail') && (
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xs">من</span>
            <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 shadow-inner">
              <input
                type="text"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-24 font-mono font-bold text-center text-xs outline-none bg-transparent"
              />
            </div>

            <span className="text-white font-bold text-xs">الى</span>
            <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 shadow-inner">
              <input
                type="text"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-24 font-mono font-bold text-center text-xs outline-none bg-transparent"
              />
            </div>
          </div>
        )}

        {/* حالة التاريخ المفرد للصور 8، 9، 11، 12، 14 */}
        {(mode === 'w_rep_zemam_today' ||
          mode === 'w_rep_sales_today' ||
          mode === 'w_rep_zemam_today_detail' ||
          mode === 'w_rep_sales_today_nakla' ||
          mode === 'w_rep_avg_prices_nakla') && (
          <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 shadow-inner">
            <input
              type="text"
              value={singleDate}
              onChange={e => setSingleDate(e.target.value)}
              className="w-28 font-mono font-bold text-center text-xs outline-none bg-transparent"
            />
          </div>
        )}

        {/* صندوق اختيار الزبون (الصور 5، 6، 7، 10) */}
        {(mode === 'w_rep_customer_purchases' ||
          mode === 'w_rep_customer_purchases_naklat' ||
          mode === 'w_rep_customer_zemam_tahseel' ||
          mode === 'w_rep_customer_movement_detail') && (
          <div className="bg-[#b0c4de] border border-slate-500 p-1 flex flex-col w-44 shadow">
            <span className="text-[10px] font-bold text-slate-800 text-center mb-0.5">الزبون</span>
            <select
              value={selectedCustomer}
              onChange={e => setSelectedCustomer(e.target.value)}
              className="bg-[#000080] text-white font-bold text-xs px-2 py-0.5 outline-none text-center"
            >
              {db.customers.map(c => (
                <option key={c.customer_id} value={c.customer_name} className="bg-white text-black">
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* صندوق اختيار النقلة (الصور 13 و 14) */}
        {(mode === 'w_rep_sales_nakla' || mode === 'w_rep_avg_prices_nakla') && (
          <div className="bg-[#b0c4de] border border-slate-500 p-1 flex flex-col w-48 shadow">
            <span className="text-[10px] font-bold text-slate-800 text-center mb-0.5">النقلة</span>
            <select
              value={selectedNakla}
              onChange={e => setSelectedNakla(e.target.value)}
              className="bg-white text-slate-900 font-bold text-xs px-2 py-0.5 outline-none text-center border border-slate-400"
            >
              {db.naklat.map(n => (
                <option key={n.nakla_id} value={n.nakla_name}>
                  {n.nakla_name}
                </option>
              ))}
              <option value="امين 1">امين 1</option>
              <option value="ابراهيم هلال 1">ابراهيم هلال 1</option>
            </select>
          </div>
        )}

        {/* زر عرض (إن وُجد في الشاشة) */}
        {(mode === 'w_rep_customer_purchases' ||
          mode === 'w_rep_customer_purchases_naklat' ||
          mode === 'w_rep_customer_zemam_tahseel' ||
          mode === 'w_rep_zemam_today' ||
          mode === 'w_rep_customer_movement_detail' ||
          mode === 'w_rep_sales_nakla' ||
          mode === 'w_rep_avg_prices_nakla') && (
          <button
            onClick={() => setHasDisplayed(true)}
            className="w-16 h-7 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-slate-300 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center font-bold text-xs text-slate-900 shadow"
          >
            عرض
          </button>
        )}

      </div>

      {/* 3. جسم التقرير ولوحة المعاينة (DataWindow Canvas): الأزرار على اليمين واللوحة على اليسار */}
      <div className="flex items-start gap-4 flex-1">
        
        {/* الأزرار العمودية الخارجية على اليمين المطابقة لشاشة الزبائن */}
        <div className="shrink-0 flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => window.print()}
            title="طباعة التقرير"
            className="w-14 h-11 bg-white hover:bg-slate-50 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 active:border-t-[#404040] active:border-l-[#404040]"
          >
            <Printer className="w-7 h-7 text-slate-800" />
            <span className="text-[7.5px] font-bold text-slate-700 mt-0.5">طباعة</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-14 h-7 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-slate-300 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              خروج
            </button>
          )}
        </div>

        {/* اللوحة الرئيسية للتقرير (على اليسار) */}
        <div
          onWheel={(e) => {
            if (e.currentTarget) {
              e.currentTarget.scrollTop += e.deltaY;
            }
          }}
          className="flex-1 min-h-[420px] max-h-[65vh] bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-3 shadow-inner overflow-x-auto overflow-y-auto relative scroll-smooth"
        >
          
          {/* الصورة 11: تقرير زمام اليوم مفصل (طابع DataWindow الرمادي والأزرق) */}
          {mode === 'w_rep_zemam_today_detail' ? (
            <div className="w-full bg-[#cbd5e1] border border-slate-400 min-h-[360px] p-2">
              <div className="bg-[#b0c4de] border border-slate-500 w-28 text-center text-xs font-mono font-bold py-0.5 mb-2 shadow-sm">
                {singleDate}
              </div>
              <table className="w-full text-right border-collapse text-xs select-text">
                <thead>
                  <tr className="bg-[#b0c4de] border-b border-slate-400 font-bold text-center">
                    <th className="border-l border-slate-400 p-1">مسلسل</th>
                    <th className="border-l border-slate-400 p-1">العدد</th>
                    <th className="border-l border-slate-400 p-1">الصنف</th>
                    <th className="border-l border-slate-400 p-1">الوحدة</th>
                    <th className="border-l border-slate-400 p-1">سماح</th>
                    <th className="border-l border-slate-400 p-1">ك.صافي</th>
                    <th className="border-l border-slate-400 p-1">السعر</th>
                    <th className="border-l border-slate-400 p-1">الاجمالي</th>
                    <th className="border-l border-slate-400 p-1">الزبون</th>
                    <th className="p-1">النقلة</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSales.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-300 text-center font-mono">
                      <td className="border-l border-slate-300 p-1">{idx + 1}</td>
                      <td className="border-l border-slate-300 p-1 font-bold">{s.qty}</td>
                      <td className="border-l border-slate-300 p-1 font-sans">{s.category}</td>
                      <td className="border-l border-slate-300 p-1 font-sans">{s.unit}</td>
                      <td className="border-l border-slate-300 p-1">{s.samah}</td>
                      <td className="border-l border-slate-300 p-1">{s.netWeight}</td>
                      <td className="border-l border-slate-300 p-1">{s.price}</td>
                      <td className="border-l border-slate-300 p-1 font-bold">{s.total}</td>
                      <td className="border-l border-slate-300 p-1 font-sans font-bold">{s.customer}</td>
                      <td className="p-1 font-sans">{s.nakla}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : mode === 'w_rep_avg_prices_nakla' ? (
            /* الصورة 14: تقرير مبيعات نقلة / متوسط أسعار نقلة (البيان | العدد | الوحدة | الوزن | السعر | المبلغ) */
            <div className="w-full">
              <table className="w-full text-right border-collapse text-xs select-text">
                <thead>
                  <tr className="border-b-2 border-slate-400 font-bold text-center text-slate-800">
                    <th className="p-2 text-right">البيان</th>
                    <th className="p-2">العدد</th>
                    <th className="p-2">الوحدة</th>
                    <th className="p-2">الوزن</th>
                    <th className="p-2">السعر</th>
                    <th className="p-2 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {avgPriceItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200 text-center font-mono text-slate-900">
                      <td className="p-2 text-right font-sans font-bold">{item.desc}</td>
                      <td className="p-2">{item.qty}</td>
                      <td className="p-2 font-sans">{item.unit}</td>
                      <td className="p-2">{item.weight}</td>
                      <td className="p-2 font-bold">{item.price}</td>
                      <td className="p-2 text-left font-bold">{item.amount.toLocaleString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* الصور 9، 12، 13 وباقي التقارير: جدول المبيعات مع ملخص زمام / نقدي بالأسفل */
            <div className="w-full flex flex-col justify-between min-h-[380px]">
              <table className="w-full text-right border-collapse text-xs select-text">
                <thead>
                  <tr className="border-b border-slate-300 font-bold text-center text-slate-800">
                    <th className="p-1.5">يومية</th>
                    <th className="p-1.5">العدد</th>
                    <th className="p-1.5">الصنف</th>
                    <th className="p-1.5">الوحدة</th>
                    <th className="p-1.5">سماح</th>
                    <th className="p-1.5">ك.صافي</th>
                    <th className="p-1.5">السعر</th>
                    <th className="p-1.5">الاجمالي</th>
                    <th className="p-1.5 text-right">الزبون</th>
                    <th className="p-1.5 text-right">النقلة</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSales.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-100 text-center font-mono text-slate-800">
                      <td className="p-1.5">{s.daily}</td>
                      <td className="p-1.5 font-bold">{s.qty}</td>
                      <td className="p-1.5 font-sans">{s.category}</td>
                      <td className="p-1.5 font-sans">{s.unit}</td>
                      <td className="p-1.5">{s.samah}</td>
                      <td className="p-1.5">{s.netWeight}</td>
                      <td className="p-1.5">{s.price}</td>
                      <td className="p-1.5 font-bold">{s.total}</td>
                      <td className="p-1.5 text-right font-sans font-bold">{s.customer}</td>
                      <td className="p-1.5 text-right font-sans">{s.nakla}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* الملخص السفلي للزمام والنقدي المطابق تماماً للصور 9، 12، 13 */}
              <div className="mt-auto pt-6 flex flex-col gap-1 pr-6 pb-2 text-xs font-bold">
                <div className="flex items-center gap-3 text-rose-600">
                  <span className="w-12">زمام</span>
                  <span className="font-mono text-sm">{totalZemam}</span>
                </div>
                <div className="flex items-center gap-3 text-blue-700">
                  <span className="w-12">نقدي</span>
                  <span className="font-mono text-sm">{totalNakdi}</span>
                </div>
              </div>
            </div>
          )}

        </div>



      </div>

    </div>
  );
};
