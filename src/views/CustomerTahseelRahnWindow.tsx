import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { Printer, Minus, Square, X, Calendar } from 'lucide-react';

interface CustomerTahseelRahnWindowProps {
  onClose?: () => void;
}

interface TahseelRahnRow {
  id: number;
  date: string;
  prevSalesCredit: number;
  samah: number;
  tahseel: number;
  remainingCredit: number;
  todaySalesCredit: number;
  prevRahn: number;
  rahnPayment: number;
  rahnDelivery: number;
  remainingRahn: number;
  todayRahn: number;
  customerName: string;
  currentTotalCredit: number;
}

export const CustomerTahseelRahnWindow: React.FC<CustomerTahseelRahnWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();
  const [selectedDate, setSelectedDate] = useState<string>('2026/10/12');
  const [rahnOnly, setRahnOnly] = useState<boolean>(false);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // بيانات السطور
  const [rows, setRows] = useState<TahseelRahnRow[]>([
    {
      id: 1,
      date: '2026/10/12',
      prevSalesCredit: 14500,
      samah: 0,
      tahseel: 5000,
      remainingCredit: 9500,
      todaySalesCredit: 0,
      prevRahn: 1200,
      rahnPayment: 200,
      rahnDelivery: 0,
      remainingRahn: 1000,
      todayRahn: 0,
      customerName: 'تاج',
      currentTotalCredit: 9500
    },
    {
      id: 2,
      date: '2026/10/12',
      prevSalesCredit: 8200,
      samah: 50,
      tahseel: 3000,
      remainingCredit: 5150,
      todaySalesCredit: 0,
      prevRahn: 800,
      rahnPayment: 0,
      rahnDelivery: 100,
      remainingRahn: 900,
      todayRahn: 100,
      customerName: 'ابانوب السوق',
      currentTotalCredit: 5150
    }
  ]);

  const handleAddRow = () => {
    const newRow: TahseelRahnRow = {
      id: rows.length + 1,
      date: selectedDate,
      prevSalesCredit: 0,
      samah: 0,
      tahseel: 0,
      remainingCredit: 0,
      todaySalesCredit: 0,
      prevRahn: 0,
      rahnPayment: 0,
      rahnDelivery: 0,
      remainingRahn: 0,
      todayRahn: 0,
      customerName: db.customers[0]?.customer_name || 'تاج',
      currentTotalCredit: 0
    };
    setRows(prev => [...prev, newRow]);
    setSelectedIdx(rows.length);
  };

  const handleRemoveRow = () => {
    if (rows.length > 0 && selectedIdx >= 0 && selectedIdx < rows.length) {
      setRows(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(Math.max(0, selectedIdx - 1));
    }
  };

  const handleFieldChange = (idx: number, field: keyof TahseelRahnRow, val: any) => {
    setRows(prev => {
      const next = [...prev];
      const r = { ...next[idx], [field]: val };
      // حساب الباقي التلقائي
      if (field === 'prevSalesCredit' || field === 'samah' || field === 'tahseel') {
        r.remainingCredit = (r.prevSalesCredit || 0) - (r.samah || 0) - (r.tahseel || 0);
        r.currentTotalCredit = r.remainingCredit + (r.todaySalesCredit || 0);
      }
      if (field === 'prevRahn' || field === 'rahnPayment' || field === 'rahnDelivery') {
        r.remainingRahn = (r.prevRahn || 0) - (r.rahnPayment || 0) + (r.rahnDelivery || 0);
      }
      next[idx] = r;
      return next;
    });
  };

  const handleSave = () => {
    setStatusMsg('✓ تم حفظ تحصيل ورهن الزبائن بنجاح');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // مجاميع الأعمدة للشريط السفلي المطابق للصورة 2
  const totalTahseel = rows.reduce((s, r) => s + (r.tahseel || 0), 0);
  const totalSamah = rows.reduce((s, r) => s + (r.samah || 0), 0);
  const totalRahnPayment = rows.reduce((s, r) => s + (r.rahnPayment || 0), 0);
  const totalRahnDelivery = rows.reduce((s, r) => s + (r.rahnDelivery || 0), 0);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-[#008080] p-3 text-slate-900 select-none flex flex-col font-sans overflow-auto" dir="rtl">
      
      {/* 1. إطار النافذة وشريط العنوان (MDI Child Window) مع أزرار التحكم على اليمين */}
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
          <span className="text-slate-800 font-bold text-[12px]">تسجيل تحصيل اليوم (تحصيل و رهن الزبائن)</span>
          <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">5-2</span>
          <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>

      {/* 2. شريط التاريخ وزر خيار (رهن فقط) من اليمين إلى اليسار */}
      <div className="flex items-center justify-between mb-3 px-2">
        {/* خانة رهن فقط على اليمين */}
        <label className="flex items-center gap-1.5 text-white font-bold text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={rahnOnly}
            onChange={e => setRahnOnly(e.target.checked)}
            className="w-4 h-4 accent-slate-800"
          />
          <span>رهن فقط</span>
        </label>

        {/* مربع إدخال التاريخ على اليسار */}
        <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 shadow-inner">
          <input
            type="text"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-28 font-mono font-bold text-center text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      {/* 3. جسم الشاشة: الأزرار على اليمين والجدول على اليسار */}
      <div className="flex items-start gap-4 flex-1">
        
        {/* الأزرار العمودية على اليمين المطابقة للصورة 2 */}
        <div className="flex flex-col gap-2 pt-1 shrink-0">
          <button
            onClick={handleAddRow}
            title="إضافة سطر جديد (+)"
            className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow"
          >
            +
          </button>
          <button
            onClick={handleRemoveRow}
            title="حذف السطر المحدد (-)"
            className="w-14 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow"
          >
            -
          </button>
          <button
            onClick={handleSave}
            className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow"
          >
            حفظ
          </button>
          <button
            onClick={() => window.print()}
            className="w-14 h-11 bg-white hover:bg-slate-50 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 mt-1"
          >
            <Printer className="w-7 h-7 text-slate-800" />
            <span className="text-[7.5px] font-bold text-slate-700">طباعة</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-14 h-8 bg-[#d4d0c8] hover:bg-[#e0ded8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow mt-2"
            >
              خروج
            </button>
          )}
        </div>

        {/* جدول تسجيل التحصيل والرهن على يسار الأزرار */}
        <div className="flex-1 flex flex-col">
          <div
            onWheel={(e) => {
              if (e.currentTarget) {
                e.currentTarget.scrollTop += e.deltaY;
              }
            }}
            className="border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-[#cbd5e1] overflow-x-auto overflow-y-auto max-h-[62vh] min-h-[360px] shadow-inner scroll-smooth"
          >
            <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
              <thead>
                <tr className="bg-[#b0c4de] text-slate-900 border-b border-slate-400 font-bold sticky top-0 z-10 text-center">
                  <th className="border-l border-slate-400 px-1 py-1 w-8">م</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-20">التاريخ</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-24">زمام مبيع سابق</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-16">سماح</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-20">تحصيل</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-20">الباقي</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-24">زمام مبيع اليوم</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-20">رهن سابق</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-18">سداد رهن</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-18">تسليم رهن</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-20">باقي الرهن</th>
                  <th className="border-l border-slate-400 px-2 py-1 w-18">رهن اليوم</th>
                  <th className="border-l border-slate-400 px-3 py-1 w-36 text-right">الزبون</th>
                  <th className="px-2 py-1 w-24">الزمام الحالي</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isSelected = selectedIdx === idx;
                  return (
                    <tr
                      key={row.id || idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={`border-b border-slate-300 cursor-pointer ${
                        isSelected ? 'bg-[#000080] text-white font-medium' : 'bg-[#e2e8f0] text-slate-900 hover:bg-[#d8e2ed]'
                      }`}
                    >
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{idx + 1}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{row.date}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.prevSalesCredit}
                          onChange={e => handleFieldChange(idx, 'prevSalesCredit', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.samah}
                          onChange={e => handleFieldChange(idx, 'samah', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none text-rose-600 font-bold"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.tahseel}
                          onChange={e => handleFieldChange(idx, 'tahseel', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none font-bold text-emerald-700"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono font-bold">
                        {row.remainingCredit}
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.todaySalesCredit}
                          onChange={e => handleFieldChange(idx, 'todaySalesCredit', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{row.prevRahn}</td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.rahnPayment}
                          onChange={e => handleFieldChange(idx, 'rahnPayment', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.rahnDelivery}
                          onChange={e => handleFieldChange(idx, 'rahnDelivery', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono font-bold">
                        {row.remainingRahn}
                      </td>
                      <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">
                        <input
                          type="number"
                          value={row.todayRahn}
                          onChange={e => handleFieldChange(idx, 'todayRahn', Number(e.target.value))}
                          className="w-full bg-transparent text-center outline-none"
                        />
                      </td>
                      <td className="border-l border-slate-300 px-2 py-1 font-bold">
                        <select
                          value={row.customerName}
                          onChange={e => handleFieldChange(idx, 'customerName', e.target.value)}
                          className={`bg-transparent outline-none w-full ${isSelected ? 'text-white bg-blue-900' : 'text-slate-900'}`}
                        >
                          {db.customers.map(c => (
                            <option key={c.customer_id} value={c.customer_name} className="text-black bg-white">
                              {c.customer_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1 text-center font-mono font-bold">{row.currentTotalCredit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* صناديق ملخص الإجماليات أسفل الجدول المطابقة تماماً للصورة 2 */}
          <div className="flex items-center gap-3 mt-2 px-1 flex-wrap">
            {statusMsg && (
              <div className="bg-emerald-100 text-emerald-900 border border-emerald-500 px-3 py-1 text-xs font-bold rounded animate-pulse">
                {statusMsg}
              </div>
            )}
            <div className="bg-[#b0c4de] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 px-3 py-1 font-mono text-xs flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              <span>سماح: {totalSamah}</span>
            </div>
            <div className="bg-[#b0c4de] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 px-3 py-1 font-mono text-xs flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>تحصيل: {totalTahseel}</span>
            </div>
            <div className="bg-[#b0c4de] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 px-3 py-1 font-mono text-xs flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>سداد رهن: {totalRahnPayment}</span>
            </div>
            <div className="bg-[#b0c4de] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 px-3 py-1 font-mono text-xs flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              <span>تسليم رهن: {totalRahnDelivery}</span>
            </div>
          </div>
        </div>


      </div>

    </div>
  );
};
