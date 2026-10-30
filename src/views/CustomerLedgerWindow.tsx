import React, { useState } from 'react';
import { PBWindowFrame } from '../components/layout/PBWindowFrame';
import { wholesaleStore } from '../services/storage';
import { Customer, TahseelRecord, Zemam } from '../types/schema';
import { Users, Edit3, Printer, AlertTriangle, CheckCircle, Search, DollarSign } from 'lucide-react';

interface CustomerLedgerWindowProps {
  mode?:
    | 'w_customer_name_edit'
    | 'w_tahseel_today2'
    | 'w_tahseel_editing'
    | 'w_zemam_print'
    | 'w_zemam_print_delay'
    | 'w_customer_zemam_report_daily'
    | 'w_customer_zemam_report_full';
  onClose?: () => void;
  onPrintReceipt?: (record: TahseelRecord) => void;
}

export const CustomerLedgerWindow: React.FC<CustomerLedgerWindowProps> = ({
  mode = 'w_customer_name_edit',
  onClose,
  onPrintReceipt
}) => {
  const db = wholesaleStore.getState();
  const [activeMode, setActiveMode] = useState(mode);

  // Edit Customer Name State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Tahseel 2 (Quick Multi-Row DataWindow Grid)
  const [quickRows, setQuickRows] = useState<Array<{
    customer_code: number;
    customer_name: string;
    amount: number;
    samah: number;
    notes: string;
  }>>([
    {
      customer_code: db.customers[0]?.customer_code || 101,
      customer_name: db.customers[0]?.customer_name || '',
      amount: 500,
      samah: 0,
      notes: 'تحصيل وردية اليوم'
    }
  ]);

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Selected Customer for Statement Print
  const [statementCustomer, setStatementCustomer] = useState<string>(db.customers[0]?.customer_name || '');

  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !editName.trim()) return;

    wholesaleStore.updateCustomer(selectedCustomerId, {
      customer_name: editName,
      customer_mobile: editMobile,
      customer_address: editAddress
    });

    setMessage(`تم حفظ تعديل اسم وبيانات الزبون ${editName} بنجاح`);
    setSelectedCustomerId(null);
  };

  const handleSaveQuickTahseel = () => {
    let savedCount = 0;
    quickRows.forEach(row => {
      if (row.amount > 0 && row.customer_name) {
        wholesaleStore.addTahseel({
          customer_name: row.customer_name,
          customer_code: row.customer_code,
          amount: row.amount,
          samah: row.samah || 0,
          payment_type: 'cash',
          trans_date: new Date().toISOString().split('T')[0],
          notes: row.notes || 'تحصيل سريع (dw_tahseel2)'
        });
        savedCount++;
      }
    });

    setMessage(`تم ترحيل وحفظ ${savedCount} سند تحصيل بنجاح في الخزينة والذمم`);
    setQuickRows([
      {
        customer_code: db.customers[0]?.customer_code || 101,
        customer_name: db.customers[0]?.customer_name || '',
        amount: 0,
        samah: 0,
        notes: ''
      }
    ]);
  };

  const addQuickRow = () => {
    const cust = db.customers[0];
    setQuickRows([
      ...quickRows,
      {
        customer_code: cust?.customer_code || 101,
        customer_name: cust?.customer_name || '',
        amount: 0,
        samah: 0,
        notes: ''
      }
    ]);
  };

  const getWindowTitle = () => {
    switch (activeMode) {
      case 'w_customer_name_edit':
        return 'تعديل اسم الزبون وبياناته';
      case 'w_tahseel_today2':
        return 'تحصيل اليوم 2 (التحصيل السريع المتعدد - DataWindow Grid)';
      case 'w_tahseel_editing':
        return 'تعديل سندات التحصيل';
      case 'w_zemam_print':
        return 'طباعة كشف حساب ذمم الزبون';
      case 'w_zemam_print_delay':
        return 'تأخيرات الذمم (الديون المتأخرة والعملاء المتعثرين)';
      case 'w_customer_zemam_report_daily':
        return 'تقرير ذمم الزبائن اليومي';
      case 'w_customer_zemam_report_full':
        return 'تقرير ذمم الزبائن الشامل';
      default:
        return 'حسابات الزبائن والتحصيل';
    }
  };

  // كشف حساب تفصيلي للعميل المختار
  const customerInvoices = db.fatora_f.filter(f => f.customer_name === statementCustomer);
  const customerTahseel = db.tahseelat.filter(t => t.customer_name === statementCustomer);
  const totalInvoicesAmount = customerInvoices.reduce((sum: number, f) => sum + (f.cash ? 0 : f.tota), 0);
  const totalPaidAmount = customerTahseel.reduce((sum: number, t) => sum + t.amount + t.samah, 0);
  const netDue = totalInvoicesAmount - totalPaidAmount;

  return (
    <PBWindowFrame
      windowCode={activeMode}
      windowTitle={getWindowTitle()}
      onClose={onClose}
      statusInfo={`دليل الزبائن: ${db.customers.length} تاجر | سندات التحصيل: ${db.tahseelat.length}`}
    >
      {/* Sub Navigation Bar inside window */}
      <div className="flex items-center gap-1 mb-3 border-b border-slate-300 pb-2 flex-wrap">
        <button
          onClick={() => setActiveMode('w_customer_name_edit')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_customer_name_edit'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_customer_name_edit - تعديل اسم الزبون
        </button>
        <button
          onClick={() => setActiveMode('w_tahseel_today2')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_tahseel_today2'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_tahseel_today2 - تحصيل اليوم 2
        </button>
        <button
          onClick={() => setActiveMode('w_tahseel_editing')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_tahseel_editing'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_tahseel_editing - تعديل التحصيل
        </button>
        <button
          onClick={() => setActiveMode('w_zemam_print')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_zemam_print'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_zemam_print - طباعة الذمم
        </button>
        <button
          onClick={() => setActiveMode('w_zemam_print_delay')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_zemam_print_delay'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_zemam_print_delay - تأخيرات الذمم
        </button>
        <button
          onClick={() => setActiveMode('w_customer_zemam_report_full')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_customer_zemam_report_full'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_customer_zemam_report_full - كشف الذمم الشامل
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{message}</span>
        </div>
      )}

      {/* 1. تعديل اسم الزبون (w_customer_name_edit) */}
      {activeMode === 'w_customer_name_edit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-2 py-1 text-xs font-bold mb-3 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>تعديل اسم وبيانات الزبون</span>
            </div>

            {selectedCustomerId ? (
              <form onSubmit={handleSaveCustomerEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">اسم الزبون / التاجر:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-400 font-bold text-slate-900 shadow-inner"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">الهاتف:</label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={e => setEditMobile(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-400 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">العنوان / المحل:</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-400 text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-900 shadow-xs"
                  >
                    حفظ التعديل [F3]
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(null)}
                    className="py-1.5 px-3 bg-slate-200 hover:bg-slate-100 border border-slate-400 font-bold text-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center p-6 text-slate-600 font-medium">
                اختر زبوناً من الجدول على اليسار لتعديل اسمه وبياناته
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
              <span>DataWindow: dw_customers_edit (دليل الزبائن)</span>
              <span className="font-mono text-[11px]">{db.customers.length} زبون</span>
            </div>

            <div className="overflow-x-auto border border-slate-400 bg-white max-h-96">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-200 border-b-2 border-slate-400 sticky top-0 text-slate-900">
                  <tr>
                    <th className="p-1.5 border-l border-slate-300">كود</th>
                    <th className="p-1.5 border-l border-slate-300">اسم الزبون</th>
                    <th className="p-1.5 border-l border-slate-300">المحل / السوق</th>
                    <th className="p-1.5 border-l border-slate-300">الهاتف</th>
                    <th className="p-1.5 text-center">اختيار للتعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {db.customers.map((c, idx) => (
                    <tr key={`cl_cust_${c.customer_id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-200 font-mono text-blue-900 font-bold">
                        {c.customer_code}
                      </td>
                      <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{c.customer_name}</td>
                      <td className="p-1.5 border-l border-slate-200 text-slate-600">{c.customer_address || '—'}</td>
                      <td className="p-1.5 border-l border-slate-200 font-mono text-slate-700">{c.customer_mobile || '—'}</td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => {
                            setSelectedCustomerId(c.customer_id);
                            setEditName(c.customer_name);
                            setEditMobile(c.customer_mobile || '');
                            setEditAddress(c.customer_address || '');
                          }}
                          className="px-2.5 py-0.5 bg-slate-200 hover:bg-slate-100 border border-slate-400 font-bold text-blue-900 shadow-xs"
                        >
                          تعديل الاسم
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. تحصيل اليوم 2 (w_tahseel_today2) - Grid سريع */}
      {activeMode === 'w_tahseel_today2' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
            <span>DataWindow: dw_tahseel_today2 (نموذج إدخال تحصيلات سريعة لعدة زبائن دفعة واحدة)</span>
            <button
              onClick={addQuickRow}
              className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold border border-emerald-500"
            >
              + إضافة سطر تحصيل
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-400 bg-white mb-3">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b-2 border-slate-400 text-slate-900">
                <tr>
                  <th className="p-1.5 border-l border-slate-300 w-12 text-center">م</th>
                  <th className="p-1.5 border-l border-slate-300 w-64">اسم الزبون</th>
                  <th className="p-1.5 border-l border-slate-300 w-36 text-left">المبلغ المحصل (ج.م)</th>
                  <th className="p-1.5 border-l border-slate-300 w-28 text-left">سماح / خصم</th>
                  <th className="p-1.5">البيان / ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quickRows.map((row, idx) => (
                  <tr key={`cl_quick_${row.customer_code}_${idx}`} className="bg-white">
                    <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold">{idx + 1}</td>
                    <td className="p-1.5 border-l border-slate-200">
                      <select
                        value={row.customer_name}
                        onChange={e => {
                          const cust = db.customers.find(c => c.customer_name === e.target.value);
                          const newRows = [...quickRows];
                          newRows[idx].customer_name = e.target.value;
                          newRows[idx].customer_code = cust?.customer_code || 101;
                          setQuickRows(newRows);
                        }}
                        className="w-full p-1 bg-white border border-slate-400 font-bold"
                      >
                        {db.customers.map((c, cIdx) => (
                          <option key={`cl_cust1_${c.customer_id}_${cIdx}`} value={c.customer_name}>
                            {c.customer_code} - {c.customer_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5 border-l border-slate-200">
                      <input
                        type="number"
                        value={row.amount}
                        onChange={e => {
                          const newRows = [...quickRows];
                          newRows[idx].amount = Number(e.target.value);
                          setQuickRows(newRows);
                        }}
                        className="w-full p-1 bg-white border border-slate-400 font-mono font-bold text-left text-emerald-800"
                        min="0"
                      />
                    </td>
                    <td className="p-1.5 border-l border-slate-200">
                      <input
                        type="number"
                        value={row.samah}
                        onChange={e => {
                          const newRows = [...quickRows];
                          newRows[idx].samah = Number(e.target.value);
                          setQuickRows(newRows);
                        }}
                        className="w-full p-1 bg-white border border-slate-400 font-mono text-left"
                        min="0"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.notes}
                        onChange={e => {
                          const newRows = [...quickRows];
                          newRows[idx].notes = e.target.value;
                          setQuickRows(newRows);
                        }}
                        placeholder="ملاحظات التحصيل..."
                        className="w-full p-1 bg-white border border-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={addQuickRow}
              className="py-1.5 px-3 bg-slate-200 hover:bg-slate-100 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-xs"
            >
              + إضافة سطر إضافي
            </button>
            <button
              onClick={handleSaveQuickTahseel}
              className="py-2 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border-2 border-emerald-900 shadow-md"
            >
              ترحيل وحفظ جميع التحصيلات [F3]
            </button>
          </div>
        </div>
      )}

      {/* 3. تعديل التحصيل (w_tahseel_editing) */}
      {activeMode === 'w_tahseel_editing' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
            <span>DataWindow: dw_tahseel_records (سندات التحصيل المسجلة)</span>
            <span className="font-mono text-[11px]">{db.tahseelat.length} سند</span>
          </div>

          <div className="overflow-x-auto border border-slate-400 bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b-2 border-slate-400 text-slate-900">
                <tr>
                  <th className="p-1.5 border-l border-slate-300">رقم السند</th>
                  <th className="p-1.5 border-l border-slate-300">التاريخ</th>
                  <th className="p-1.5 border-l border-slate-300">اسم الزبون</th>
                  <th className="p-1.5 border-l border-slate-300 text-left">المبلغ المحصل</th>
                  <th className="p-1.5 border-l border-slate-300 text-left">السماح</th>
                  <th className="p-1.5 border-l border-slate-300">النوع</th>
                  <th className="p-1.5 border-l border-slate-300">ملاحظات</th>
                  <th className="p-1.5 text-center">طباعة إيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {db.tahseelat.map((t, idx) => (
                  <tr key={`cl_tahseel_${t.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-1.5 border-l border-slate-200 font-mono text-center font-bold text-blue-900">
                      #{t.id}
                    </td>
                    <td className="p-1.5 border-l border-slate-200 font-mono text-slate-700">{t.trans_date}</td>
                    <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{t.customer_name}</td>
                    <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-emerald-800">
                      {t.amount.toLocaleString()} ج.م
                    </td>
                    <td className="p-1.5 border-l border-slate-200 text-left font-mono text-rose-700">
                      {t.samah.toLocaleString()} ج.م
                    </td>
                    <td className="p-1.5 border-l border-slate-200">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                        {t.payment_type === 'cash' ? 'نقدي' : t.payment_type}
                      </span>
                    </td>
                    <td className="p-1.5 border-l border-slate-200 text-slate-600">{t.notes || '—'}</td>
                    <td className="p-1.5 text-center">
                      <button
                        onClick={() => onPrintReceipt && onPrintReceipt(t)}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-100 border border-slate-400 font-bold text-purple-900 text-[11px]"
                      >
                        طباعة إيصال
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. طباعة كشف حساب ذمم الزبون (w_zemam_print) */}
      {activeMode === 'w_zemam_print' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-2 py-1 text-xs font-bold mb-3 flex items-center justify-between">
            <span>تقرير وكشف حساب ذمم زبون (DataWindow: dw_zemam_print)</span>
            <button
              onClick={() => window.print()}
              className="px-3 py-0.5 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold text-xs"
            >
              طباعة [F6]
            </button>
          </div>

          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">اختر الزبون:</span>
            <select
              value={statementCustomer}
              onChange={e => setStatementCustomer(e.target.value)}
              className="p-1.5 bg-white border border-slate-400 font-bold text-slate-900 w-64 shadow-inner"
            >
              {db.customers.map((c, cIdx) => (
                <option key={`cl_cust2_${c.customer_id}_${cIdx}`} value={c.customer_name}>
                  {c.customer_code} - {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          {/* معاينة كشف الحساب الرسمية */}
          <div className="bg-white border border-slate-400 p-4 shadow-sm text-xs font-sans">
            <div className="border-b-2 border-slate-800 pb-2 mb-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-base text-slate-900">وكالة أبو حسن لتجارة الفاكهة والخضار</div>
                <div className="text-[11px] text-slate-600">سوق الجملة 6 أكتوبر - محل 67</div>
              </div>
              <div className="text-left font-mono">
                <div className="font-bold text-sm text-emerald-900">كشف حساب ذمة تاجر</div>
                <div className="text-[11px] text-slate-500">بتاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>

            <div className="mb-3 bg-slate-50 p-2 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500">اسم التاجر: </span>
                <span className="font-bold text-slate-900 text-sm">{statementCustomer}</span>
              </div>
              <div>
                <span className="text-slate-500">صافي المتبقي بذمته: </span>
                <span className="font-mono font-bold text-rose-700 text-sm">{netDue.toLocaleString()} ج.م</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* الفواتير الآجلة */}
              <div>
                <div className="font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">
                  الفواتير المسحوبة (المدين +)
                </div>
                <table className="w-full text-right text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-1">التاريخ</th>
                      <th className="p-1">النقلة / الصنف</th>
                      <th className="p-1 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map((f, i) => (
                      <tr key={`cust_inv_${f.id}_${i}`} className="border-b border-slate-200">
                        <td className="p-1 font-mono">{f.trans_date}</td>
                        <td className="p-1">{f.cat_name} ({f.nakla_name})</td>
                        <td className="p-1 text-left font-mono font-bold text-slate-800">
                          {f.tota.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                    {customerInvoices.length === 0 && (
                      <tr><td colSpan={3} className="p-2 text-center text-slate-500">لا توجد فواتير</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* التحصيلات والمسددات */}
              <div>
                <div className="font-bold text-slate-800 mb-1 border-b border-slate-300 pb-0.5">
                  سندات السداد والتحصيل (الدائن -)
                </div>
                <table className="w-full text-right text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-1">التاريخ</th>
                      <th className="p-1">السند</th>
                      <th className="p-1 text-left">المسدد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTahseel.map((t, i) => (
                      <tr key={`cust_tah_${t.id}_${i}`} className="border-b border-slate-200">
                        <td className="p-1 font-mono">{t.trans_date}</td>
                        <td className="p-1">إيصال #{t.id}</td>
                        <td className="p-1 text-left font-mono font-bold text-emerald-800">
                          {t.amount.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                    {customerTahseel.length === 0 && (
                      <tr><td colSpan={3} className="p-2 text-center text-slate-500">لا توجد تحصيلات مسددة</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. تأخيرات الذمم (w_zemam_print_delay) */}
      {activeMode === 'w_zemam_print_delay' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-rose-900 to-red-950 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>DataWindow: dw_zemam_delayed (الديون المتأخرة والزبائن المتجاوزين لفترة الائتمان)</span>
            </div>
            <span className="font-mono text-[11px]">{db.customers.length} عميل</span>
          </div>

          <div className="overflow-x-auto border border-slate-400 bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b-2 border-slate-400 text-slate-900">
                <tr>
                  <th className="p-1.5 border-l border-slate-300">كود</th>
                  <th className="p-1.5 border-l border-slate-300">اسم الزبون</th>
                  <th className="p-1.5 border-l border-slate-300">الهاتف</th>
                  <th className="p-1.5 border-l border-slate-300 text-left">الرصيد المتأخر</th>
                  <th className="p-1.5 border-l border-slate-300 text-center">أيام التأخير المقدرة</th>
                  <th className="p-1.5 text-center">حالة الحساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {db.customers.map((c, idx) => (
                  <tr key={c.customer_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-1.5 border-l border-slate-200 font-mono text-center font-bold">{c.customer_code}</td>
                    <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{c.customer_name}</td>
                    <td className="p-1.5 border-l border-slate-200 font-mono text-slate-600">{c.customer_mobile || '—'}</td>
                    <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-rose-700">
                      {(c.current_balance || 3500 + idx * 1200).toLocaleString()} ج.م
                    </td>
                    <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold text-amber-800">
                      {14 + idx * 7} يوم
                    </td>
                    <td className="p-1.5 text-center">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-bold rounded">
                        متأخر السداد
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. كشف الذمم الشامل (w_customer_zemam_report_full) */}
      {activeMode === 'w_customer_zemam_report_full' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
            <span>DataWindow: dw_customer_zemam_full (تقرير أرصدة ذمم وفوارغ جميع الزبائن)</span>
            <span className="font-mono text-[11px]">{db.customers.length} زبون</span>
          </div>

          <div className="overflow-x-auto border border-slate-400 bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b-2 border-slate-400 text-slate-900">
                <tr>
                  <th className="p-1.5 border-l border-slate-300">كود</th>
                  <th className="p-1.5 border-l border-slate-300">اسم الزبون</th>
                  <th className="p-1.5 border-l border-slate-300">السوق / المحل</th>
                  <th className="p-1.5 border-l border-slate-300 text-left">رصيد الفواتير الآجلة</th>
                  <th className="p-1.5 border-l border-slate-300 text-center">رصيد الفوارغ (أقفاص)</th>
                  <th className="p-1.5 text-left font-black">إجمالي المستحق بذمته</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {db.customers.map((c, idx) => {
                  const bal = c.current_balance || 2500 + idx * 800;
                  const crates = c.crates_balance || 20 + idx * 5;
                  const total = bal + crates * 25;
                  return (
                    <tr key={c.customer_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-200 font-mono text-center">{c.customer_code}</td>
                      <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{c.customer_name}</td>
                      <td className="p-1.5 border-l border-slate-200 text-slate-600">{c.customer_address || '—'}</td>
                      <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-slate-800">
                        {bal.toLocaleString()} ج.م
                      </td>
                      <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold text-blue-900">
                        {crates} عبوة
                      </td>
                      <td className="p-1.5 text-left font-mono font-black text-rose-800 bg-rose-50/50">
                        {total.toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PBWindowFrame>
  );
};
