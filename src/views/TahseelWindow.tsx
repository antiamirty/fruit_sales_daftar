import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { Customer, TahseelRecord, Zemam } from '../types/schema';
import {
  Coins,
  Save,
  Printer,
  CheckCircle,
  Search,
  User,
  ArrowDownLeft,
  Boxes,
  FileText,
  X
} from 'lucide-react';

interface TahseelWindowProps {
  onClose?: () => void;
  onPrintReceipt?: (tahseel: TahseelRecord) => void;
}

export const TahseelWindow: React.FC<TahseelWindowProps> = ({ onClose, onPrintReceipt }) => {
  const db = wholesaleStore.getState();

  const [activeTab, setActiveTab] = useState<'daily' | 'rahn'>('daily');

  // Form State للتحصيل النقدي
  const [customerName, setCustomerName] = useState(db.customers[0]?.customer_name || '');
  const selectedCustomer = db.customers.find(c => c.customer_name === customerName);
  const [customerCode, setCustomerCode] = useState<number>(selectedCustomer?.customer_code || 501);
  const [amount, setAmount] = useState<number>(1000);
  const [samah, setSamah] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'cash' | 'cheque' | 'transfer'>('cash');
  const [transDate, setTransDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('دفعة نقدية تحت الحساب');

  // Form State لتسوية رهن الفوارغ (w_tahseel_rahn_nakdi)
  const [rahnCustomerName, setRahnCustomerName] = useState(db.customers[0]?.customer_name || '');
  const [returnedCrates, setReturnedCrates] = useState<number>(20);
  const [rahnPrice, setRahnPrice] = useState<number>(25);
  const [rahnCashPay, setRahnCashPay] = useState<number>(500);

  const [successMsg, setSuccessMsg] = useState('');
  const [lastReceipt, setLastReceipt] = useState<TahseelRecord | null>(null);

  const handleCustomerChange = (name: string) => {
    setCustomerName(name);
    const c = db.customers.find(cust => cust.customer_name === name);
    if (c) {
      setCustomerCode(c.customer_code);
    }
  };

  const handleTahseelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || amount <= 0) return;

    const saved = wholesaleStore.addTahseel({
      customer_name: customerName,
      customer_code: customerCode,
      amount: Number(amount),
      samah: Number(samah),
      payment_type: paymentType,
      trans_date: transDate,
      notes: notes
    });

    setLastReceipt(saved);
    setSuccessMsg(`تم تسجيل سند التحصيل رقم #${saved.id} بمبلغ ${saved.amount.toLocaleString()} ج وتحديث رصيد العميل.`);
    setTimeout(() => setSuccessMsg(''), 5000);

    setAmount(0);
    setSamah(0);
  };

  // تسوية رهن الفوارغ (إرجاع فوارغ أو سداد قيمتها)
  const handleRahnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const curState = wholesaleStore.getState();
    const cust = curState.customers.find(c => c.customer_name === rahnCustomerName);
    if (!cust) return;

    // خصم عدد الفوارغ من رصيد العميل
    const updatedCustomers = curState.customers.map(c => {
      if (c.customer_name === rahnCustomerName) {
        return {
          ...c,
          crates_balance: Math.max(0, (c.crates_balance || 0) - returnedCrates)
        };
      }
      return c;
    });

    // تسجيل حركة بالخزينة إذا دفع نقداً للعميل مقابل استرجاع أقفاصه
    let updatedKhazna = [...curState.khazna];
    if (rahnCashPay > 0) {
      const nextId = updatedKhazna.reduce((max, k) => Math.max(max, k.id), 0) + 1;
      updatedKhazna.push({
        id: nextId,
        trans_type: 'out',
        category: 'رد رهن فوارغ',
        amount: rahnCashPay,
        beneficiary: rahnCustomerName,
        trans_date: transDate,
        notes: `رد رهن عدد ${returnedCrates} فارغ بمبلغ ${rahnCashPay} ج`
      });
    }

    wholesaleStore.importJson(
      JSON.stringify({
        ...curState,
        customers: updatedCustomers,
        khazna: updatedKhazna
      })
    );

    setSuccessMsg(`تمت تسوية استرجاع ${returnedCrates} فارغ للعميل ${rahnCustomerName} بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>التحصيل اليومي وسندات القبض (w_tahseel_today)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">dw_tahseel</span>
            </h1>
            <p className="text-xs text-slate-500">
              تحصيل المبالغ الآجلة من التجار وتوريدها للخزينة، وتسوية رهن الفوارغ المسترجعة
            </p>
          </div>
        </div>

        {/* Tab switcher & Close button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'daily'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سند قبض وتحصيل نقدي (F5)
            </button>
            <button
              onClick={() => setActiveTab('rahn')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                activeTab === 'rahn'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تحصيل وتسوية رهن الفوارغ (w_tahseel_rahn)
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="إغلاق الشاشة"
              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 text-xs font-bold transition-all shadow-xs"
            >
              <X className="w-4 h-4" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {lastReceipt && onPrintReceipt && (
            <button
              onClick={() => onPrintReceipt(lastReceipt)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة سند القبض</span>
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: سند قبض وتحصيل نقدي */}
      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* نموذج السند */}
          <form onSubmit={handleTahseelSubmit} className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
              <span className="font-bold text-slate-800">بيانات سند القبض والتحصيل (Receipt Entry)</span>
              <span className="text-slate-500 font-mono">تاريخ التحصيل: {transDate}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">اسم العميل / التاجر *</label>
                <select
                  value={customerName}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-bold focus:outline-emerald-600"
                  required
                >
                  {db.customers.map(c => (
                    <option key={c.customer_id} value={c.customer_name}>
                      {c.customer_name} - {c.customer_address} (رصيد: {c.current_balance?.toLocaleString()} ج)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">كود التاجر</label>
                <input
                  type="number"
                  value={customerCode}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-600 text-center"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">المبلغ المحصل نقداً (ج) *</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-emerald-300 rounded px-3 py-2 font-mono text-center font-black text-emerald-800 text-lg shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">خصم سماح أو تنزيل (ج)</label>
                <input
                  type="number"
                  min="0"
                  value={samah}
                  onChange={e => setSamah(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-mono text-center font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">طريقة القبض</label>
                <select
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                >
                  <option value="cash">نقداً بالخزينة (كاش)</option>
                  <option value="cheque">شيك بنكي</option>
                  <option value="transfer">تحويل فودافون كاش / إنستاباي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">البيان / ملاحظات السند</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات سند القبض"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                إجمالي التنزيل من حساب التاجر: <strong className="font-mono text-slate-800">{(amount + samah).toLocaleString()} ج</strong>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ سند القبض والتوريد للخزينة (F5)</span>
              </button>
            </div>
          </form>

          {/* بطاقة كشف حساب سريع للعميل */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>موقف حساب التاجر المالي</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">اسم التاجر:</span>
                <span className="font-bold text-slate-800">{selectedCustomer?.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">موقع الباكة / المحل:</span>
                <span className="text-slate-700">{selectedCustomer?.customer_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">المديونية الحالية:</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {selectedCustomer?.current_balance?.toLocaleString()} جنيه
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">الفوارغ بذمته:</span>
                <span className="font-mono font-bold text-amber-700">
                  {selectedCustomer?.crates_balance || 0} قفص / برنيكة
                </span>
              </div>
            </div>

            <div className="bg-emerald-100/60 p-2.5 rounded border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
              يتم قيد المبالغ المحصلة فوراً في حركة الخزينة وتخصم تلقائياً من رصيد دفتر الذمم لهذا العميل.
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: تسوية رهن الفوارغ (w_tahseel_rahn_nakdi) */}
      {activeTab === 'rahn' && (
        <form onSubmit={handleRahnSubmit} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4 max-w-3xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-800">تسوية رهن الفوارغ المسترجعة (w_tahseel_rahn_nakdi)</span>
            <span className="text-slate-500">إرجاع أقفاص وبرانيك المشتري وتصفية مبلغ الرهن</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">العميل / التاجر</label>
              <select
                value={rahnCustomerName}
                onChange={e => setRahnCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-bold"
              >
                {db.customers.map(c => (
                  <option key={c.customer_id} value={c.customer_name}>
                    {c.customer_name} (بذمته: {c.crates_balance || 0} فارغ)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">عدد الفوارغ المسترجعة (عبوة)</label>
              <input
                type="number"
                min="1"
                value={returnedCrates}
                onChange={e => {
                  const num = parseFloat(e.target.value) || 0;
                  setReturnedCrates(num);
                  setRahnCashPay(num * rahnPrice);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">سعر رهن الفارغ (ج/عبوة)</label>
              <input
                type="number"
                min="0"
                value={rahnPrice}
                onChange={e => {
                  const pr = parseFloat(e.target.value) || 0;
                  setRahnPrice(pr);
                  setRahnCashPay(returnedCrates * pr);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">مبلغ الرهن المسترد للمشتري (ج)</label>
              <input
                type="number"
                min="0"
                value={rahnCashPay}
                onChange={e => setRahnCashPay(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1.5 font-mono text-center font-black text-emerald-800 text-base"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200">
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>اعتماد تسوية الفوارغ وصرف الرهن</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. سجل حركات التحصيل السابقة */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
          <span className="font-bold text-slate-800">سجل سندات التحصيل السابقة ({db.tahseelat.length})</span>
          <span className="font-mono text-emerald-700 font-bold">
            إجمالي المحصل: {db.tahseelat.reduce((s, t) => s + t.amount, 0).toLocaleString()} جنيه
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">رقم السند</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">اسم التاجر</th>
                <th className="p-2 font-bold text-emerald-800">المبلغ المحصل</th>
                <th className="p-2">سماح</th>
                <th className="p-2">طريقة الدفع</th>
                <th className="p-2">ملاحظات</th>
                <th className="p-2 text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {db.tahseelat.map((t, idx) => (
                <tr key={`tahseel_${t.id}_${idx}`} className="hover:bg-slate-50">
                  <td className="p-2 font-mono text-slate-400">#{t.id}</td>
                  <td className="p-2 font-mono text-slate-500">{t.trans_date}</td>
                  <td className="p-2 font-semibold text-slate-800">{t.customer_name}</td>
                  <td className="p-2 font-mono font-bold text-emerald-800">{t.amount.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-amber-700">{t.samah ? `${t.samah} ج` : '-'}</td>
                  <td className="p-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {t.payment_type === 'cash' ? 'نقدي' : t.payment_type === 'cheque' ? 'شيك' : 'تحويل'}
                    </span>
                  </td>
                  <td className="p-2 text-slate-500">{t.notes || '-'}</td>
                  <td className="p-2 text-center">
                    {onPrintReceipt && (
                      <button
                        onClick={() => onPrintReceipt(t)}
                        className="text-slate-600 hover:text-emerald-700 p-1"
                        title="طباعة إيصال القبض"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
