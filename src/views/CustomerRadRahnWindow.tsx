import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { Printer, Minus, Square, X } from 'lucide-react';

interface CustomerRadRahnWindowProps {
  mode: 'nakdi' | 'zemam';
  onClose?: () => void;
}

export const CustomerRadRahnWindow: React.FC<CustomerRadRahnWindowProps> = ({ mode, onClose }) => {
  const db = wholesaleStore.getState();
  const [selectedDate, setSelectedDate] = useState<string>('2026/10/12');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  // سطور النقدية (الصورة 3): التاريخ | تسليم رهن | الرهن
  const [nakdiRows, setNakdiRows] = useState([
    { id: 1, date: '2026/10/12', deliveryRahn: 150, rahn: 150 },
    { id: 2, date: '2026/10/12', deliveryRahn: 80, rahn: 80 }
  ]);

  // سطور الزمام (الصورة 4): التاريخ | الرهن السابق | سداد الرهن | تسليم الرهن | الباقي | رهن اليوم | الزبون | الرهن الحالي
  const [zemamRows, setZemamRows] = useState([
    {
      id: 1,
      date: '2026/10/12',
      prevRahn: 1200,
      rahnPayment: 200,
      rahnDelivery: 0,
      remaining: 1000,
      todayRahn: 0,
      customerName: 'تاج',
      currentRahn: 1000
    },
    {
      id: 2,
      date: '2026/10/12',
      prevRahn: 800,
      rahnPayment: 0,
      rahnDelivery: 100,
      remaining: 900,
      todayRahn: 100,
      customerName: 'ابانوب السوق',
      currentRahn: 900
    }
  ]);

  const [statusMsg, setStatusMsg] = useState<string>('');

  const isNakdi = mode === 'nakdi';
  const title = isNakdi ? 'تسجيل صرف رهن النقدية اليوم' : 'تسجيل صرف رهن الزمام اليوم';

  const handleAddRow = () => {
    if (isNakdi) {
      setNakdiRows(prev => [...prev, { id: prev.length + 1, date: selectedDate, deliveryRahn: 0, rahn: 0 }]);
      setSelectedIdx(nakdiRows.length);
    } else {
      setZemamRows(prev => [
        ...prev,
        {
          id: prev.length + 1,
          date: selectedDate,
          prevRahn: 0,
          rahnPayment: 0,
          rahnDelivery: 0,
          remaining: 0,
          todayRahn: 0,
          customerName: db.customers[0]?.customer_name || 'تاج',
          currentRahn: 0
        }
      ]);
      setSelectedIdx(zemamRows.length);
    }
  };

  const handleRemoveRow = () => {
    if (isNakdi) {
      if (nakdiRows.length > 0 && selectedIdx >= 0) {
        setNakdiRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
        setSelectedIdx(Math.max(0, selectedIdx - 1));
      }
    } else {
      if (zemamRows.length > 0 && selectedIdx >= 0) {
        setZemamRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
        setSelectedIdx(Math.max(0, selectedIdx - 1));
      }
    }
  };

  const handleSave = () => {
    setStatusMsg(`✓ تم حفظ ${title} بنجاح`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-[#008080] p-3 text-slate-900 select-none flex flex-col font-sans overflow-auto" dir="rtl">
      
      {/* 1. إطار النافذة وشريط العنوان: أزرار التحكم على اليمين */}
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

        {/* أيقونة واسم النافذة والكود على اليسار */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 font-bold text-[12px]">{title}</span>
          <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">
            {isNakdi ? '5-3' : '5-4'}
          </span>
          <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>

      {/* 2. التاريخ */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 shadow-inner">
          <input
            type="text"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-28 font-mono font-bold text-center text-sm outline-none bg-transparent"
          />
        </div>
        {statusMsg && (
          <div className="bg-emerald-100 text-emerald-900 border border-emerald-500 px-3 py-1 text-xs font-bold rounded animate-pulse">
            {statusMsg}
          </div>
        )}
      </div>

      {/* 3. جسم الشاشة من اليمين إلى اليسار: بطاقات الرهن والأزرار على اليمين + الجدول على اليسار */}
      <div className="flex items-start gap-5 flex-1">
        
        {/* كروت وبطاقات رصيد الرهن جهة اليمين المطابقة تماماً للصورتين 3 و 4 */}
        <div className="flex flex-col gap-3 min-w-[280px] shrink-0">
          
          {/* صندوق 1: صرف رهن النقدية اليوم */}
          <div className="flex flex-col">
            <div className="bg-[#b0c4de] border border-slate-500 py-1 px-3 text-center font-bold text-xs text-slate-900 shadow-sm">
              صرف رهن النقدية اليوم
            </div>
            <div className="bg-[#cbd5e1] border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-1 text-center font-mono font-bold text-sm">
              {isNakdi ? nakdiRows.reduce((s, r) => s + r.rahn, 0) : '0'}
            </div>
          </div>

          {/* صندوق 2: نقدية رهن الزمام اليوم */}
          <div className="flex flex-col">
            <div className="bg-[#b0c4de] border border-slate-500 py-1 px-3 text-center font-bold text-xs text-slate-900 shadow-sm">
              نقدية رهن الزمام اليوم
            </div>
            <div className="bg-[#cbd5e1] border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-1 text-center font-mono font-bold text-sm min-h-[28px]">
              {!isNakdi ? zemamRows.reduce((s, r) => s + r.rahnPayment, 0) : '0'}
            </div>
          </div>

          {/* صندوق 3: رصيد الرهن (جدول ثلاثي الأعمدة) */}
          <div className="flex flex-col mt-2">
            <div className="bg-[#006060] border border-teal-700 py-1 px-3 text-center font-bold text-xs text-white shadow-sm">
              رصيد الرهن
            </div>
            <div className="border border-slate-400 bg-[#cbd5e1] shadow-inner">
              <div className="grid grid-cols-3 bg-[#b0c4de] text-center text-[10.5px] font-bold border-b border-slate-400 py-1">
                <div className="border-l border-slate-400 px-1">نقدية الرهن بالخزينة</div>
                <div className="border-l border-slate-400 px-1">نقدية رهن زمام</div>
                <div className="px-1">رهن نقدية</div>
              </div>
              <div className="grid grid-cols-3 text-center font-mono font-bold text-xs py-1.5 bg-[#e2e8f0]">
                <div className="border-l border-slate-300">4,500</div>
                <div className="border-l border-slate-300">1,900</div>
                <div>2,600</div>
              </div>
            </div>
          </div>

          {/* صندوق 4: رهن الزمام */}
          <div className="flex flex-col mt-2 w-36 mx-auto">
            <div className="bg-[#b0c4de] border border-slate-500 py-0.5 px-2 text-center font-bold text-xs text-slate-900 shadow-sm">
              رهن الزمام
            </div>
            <div className="bg-[#cbd5e1] border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-1 text-center font-mono font-bold text-sm">
              1,900
            </div>
          </div>

          {/* الأزرار العمودية بجوار الكروت */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={handleAddRow}
              title="إضافة (+)"
              className="w-12 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow"
            >
              +
            </button>
            <button
              onClick={handleRemoveRow}
              title="حذف (-)"
              className="w-12 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow"
            >
              -
            </button>
            <button
              onClick={handleSave}
              className="w-12 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow"
            >
              حفظ
            </button>
            <button
              onClick={() => window.print()}
              className="w-12 h-8 bg-white hover:bg-slate-50 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center shadow"
              title="طباعة"
            >
              <Printer className="w-4 h-4 text-slate-800" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-12 h-8 bg-[#d4d0c8] hover:bg-[#e0ded8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow"
              >
                خروج
              </button>
            )}
          </div>

        </div>

        {/* جدول البيانات على اليسار */}
        <div className={isNakdi ? "w-[440px]" : "flex-1"}>
          <div
            onWheel={(e) => {
              if (e.currentTarget) {
                e.currentTarget.scrollTop += e.deltaY;
              }
            }}
            className="border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-[#cbd5e1] overflow-x-auto overflow-y-auto max-h-[62vh] min-h-[360px] shadow-inner scroll-smooth"
          >
            {isNakdi ? (
              /* جدول صرف رهن النقدية (الصورة 3) */
              <table className="w-full border-collapse text-[12px] font-sans text-right select-text">
                <thead>
                  <tr className="bg-[#b0c4de] text-slate-900 border-b border-slate-400 font-bold sticky top-0 text-center">
                    <th className="border-l border-slate-400 px-3 py-1.5 w-32">التاريخ</th>
                    <th className="border-l border-slate-400 px-3 py-1.5 w-32">تسليم رهن</th>
                    <th className="px-3 py-1.5 w-32">الرهن</th>
                  </tr>
                </thead>
                <tbody>
                  {nakdiRows.map((r, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`border-b border-slate-300 cursor-pointer ${
                        selectedIdx === idx ? 'bg-[#000080] text-white font-medium' : 'bg-[#e2e8f0] text-slate-900'
                      }`}
                    >
                      <td className="border-l border-slate-300 px-2 py-1.5 text-center font-mono">{r.date}</td>
                      <td className="border-l border-slate-300 px-2 py-1.5 text-center font-mono">
                        <input
                          type="number"
                          value={r.deliveryRahn}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setNakdiRows(prev => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], deliveryRahn: val, rahn: val };
                              return next;
                            });
                          }}
                          className="w-full bg-transparent text-center outline-none font-bold"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono font-bold">{r.rahn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* جدول صرف رهن الزمام (الصورة 4) */
              <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                <thead>
                  <tr className="bg-[#b0c4de] text-slate-900 border-b border-slate-400 font-bold sticky top-0 text-center">
                    <th className="border-l border-slate-400 px-2 py-1 w-20">التاريخ</th>
                    <th className="border-l border-slate-400 px-2 py-1 w-20">الرهن السابق</th>
                    <th className="border-l border-slate-400 px-2 py-1 w-18">سداد الرهن</th>
                    <th className="border-l border-slate-400 px-2 py-1 w-18">تسليم الرهن</th>
                    <th className="border-l border-slate-400 px-2 py-1 w-18">الباقي</th>
                    <th className="border-l border-slate-400 px-2 py-1 w-18">رهن اليوم</th>
                    <th className="border-l border-slate-400 px-3 py-1 w-32 text-right">الزبون</th>
                    <th className="px-2 py-1 w-20">الرهن الحالي</th>
                  </tr>
                </thead>
                <tbody>
                  {zemamRows.map((r, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`border-b border-slate-300 cursor-pointer ${
                        selectedIdx === idx ? 'bg-[#000080] text-white font-medium' : 'bg-[#e2e8f0] text-slate-900'
                      }`}
                    >
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{r.date}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{r.prevRahn}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={r.rahnPayment}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setZemamRows(prev => {
                              const next = [...prev];
                              const updated = { ...next[idx], rahnPayment: val };
                              updated.remaining = (updated.prevRahn || 0) - val + (updated.rahnDelivery || 0);
                              updated.currentRahn = updated.remaining;
                              next[idx] = updated;
                              return next;
                            });
                          }}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={r.rahnDelivery}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setZemamRows(prev => {
                              const next = [...prev];
                              const updated = { ...next[idx], rahnDelivery: val };
                              updated.remaining = (updated.prevRahn || 0) - (updated.rahnPayment || 0) + val;
                              updated.currentRahn = updated.remaining;
                              next[idx] = updated;
                              return next;
                            });
                          }}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono font-bold">{r.remaining}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{r.todayRahn}</td>
                      <td className="border-l border-slate-300 px-2 py-1 font-bold">{r.customerName}</td>
                      <td className="px-1 py-1 text-center font-mono font-bold">{r.currentRahn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


      </div>

    </div>
  );
};
