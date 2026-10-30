import React, { useState } from 'react';
import { wholesaleStore } from '../../services/storage';
import { Printer, Minus, Square, X } from 'lucide-react';

interface SupplierComissionExpsWindowProps {
  onClose?: () => void;
}

interface ExpRow {
  exp_name: string;
  amount: number;
  trans_date: string;
  descrip: string;
}

interface NaklaExpRow {
  nakla_name: string;
  cash_received: number;
  labor_payment: number;
  farm_exp: number;
  amount: number;
  trans_date: string;
}

export const SupplierComissionExpsWindow: React.FC<SupplierComissionExpsWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const [supName, setSupName] = useState(db.suppliers[0]?.sup_name || 'ابراهيم هلال');
  const [farmName, setFarmName] = useState(db.farms[0]?.farm_name || 'ابراهيم هلال');
  const [transDate, setTransDate] = useState('2026/10/11');
  const [statusMessage, setStatusMessage] = useState('جاهز (Ready)');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const computeNaklaRows = (supplierName: string): NaklaExpRow[] => {
    const supsNaklat = db.naklat.filter(n => n.sup_name === supplierName);
    const supObj = db.suppliers.find(s => s.sup_name === supplierName);
    const defaultRate = supObj?.comission ?? 0.06;
    const normalizedDefaultRate = defaultRate >= 1 ? defaultRate / 100 : defaultRate;

    if (supsNaklat.length === 0) {
      return [{
        nakla_name: db.naklat[0]?.nakla_name || 'نقلة جديدة',
        cash_received: 0,
        labor_payment: 0,
        farm_exp: 0,
        amount: 0,
        trans_date: transDate
      }];
    }

    return supsNaklat.map(n => {
      const safi = db.safi_fatora.find(s => s.nakla_id === n.nakla_id);
      const fawateerF = db.fatora_f.filter(f => f.nakla_id === n.nakla_id);
      const fawateerB = db.fatora_banana.filter(b => b.nakla_id === n.nakla_id);
      const totalSales = fawateerF.reduce((s, f) => s + (Number(f.totally) || 0), 0) +
                         fawateerB.reduce((s, b) => s + (Number(b.totally) || 0), 0);

      let nakRate = n.comission !== undefined && n.comission > 0 ? n.comission : normalizedDefaultRate;
      if (nakRate >= 1) nakRate = nakRate / 100;

      const commAmount = safi && safi.comission > 0 ? Number(safi.comission) : Math.round(totalSales * nakRate);

      const nNakdia = db.nakla_nakdia.filter(nk => nk.nakla_id === n.nakla_id || nk.nakla_name === n.nakla_name);
      const cashAdv = safi ? safi.cash_advance : nNakdia.reduce((s, nk) => s + (nk.cash_advance || 0), 0);
      const dofaat = safi ? safi.dofaat : nNakdia.reduce((s, nk) => s + (nk.dofaat || 0), 0);
      const farmExp = safi ? safi.farm_exp : nNakdia.reduce((s, nk) => s + (nk.farm_exp_amount || 0), 0);

      return {
        nakla_name: n.nakla_name,
        cash_received: cashAdv,
        labor_payment: dofaat,
        farm_exp: farmExp,
        amount: commAmount,
        trans_date: n.nakla_date || n.date_nakla || transDate
      };
    });
  };

  // جدول المصروفات العلوي
  const [topExps, setTopExps] = useState<ExpRow[]>([
    {
      exp_name: '',
      amount: 0,
      trans_date: '11/10/2026',
      descrip: ''
    }
  ]);

  // جدول النقلات والمصروفات السفلي
  const [bottomExps, setBottomExps] = useState<NaklaExpRow[]>(() =>
    computeNaklaRows(db.suppliers[0]?.sup_name || 'ابراهيم هلال')
  );

  const handleSupplierChange = (newSup: string) => {
    setSupName(newSup);
    const relatedFarm = db.naklat.find(n => n.sup_name === newSup)?.farm_name;
    if (relatedFarm) setFarmName(relatedFarm);
    setBottomExps(computeNaklaRows(newSup));
  };

  const topTotal = topExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const bottomTotal = bottomExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cashReceivedTotal = bottomExps.reduce((sum, e) => sum + (Number(e.cash_received) || 0), 0);
  const laborPaymentTotal = bottomExps.reduce((sum, e) => sum + (Number(e.labor_payment) || 0), 0);
  const grandTotal = topTotal + bottomTotal;

  const handleAddTopRow = () => {
    setTopExps(prev => [
      ...prev,
      { exp_name: '', amount: 0, trans_date: '11/10/2026', descrip: '' }
    ]);
  };

  const handleRemoveTopRow = () => {
    if (topExps.length > 1) {
      setTopExps(prev => prev.slice(0, -1));
    }
  };

  const handleAddBottomRow = () => {
    setBottomExps(prev => [
      ...prev,
      {
        nakla_name: 'ابراهيم هلال 3',
        cash_received: 0,
        labor_payment: 0,
        farm_exp: 0,
        amount: 0,
        trans_date: '11/10/2026'
      }
    ]);
  };

  const handleRemoveBottomRow = () => {
    if (bottomExps.length > 1) {
      setBottomExps(prev => prev.slice(0, -1));
    }
  };

  const handleSave = () => {
    setStatusMessage('تم حفظ العمولات والمصروفات بنجاح');
    setTimeout(() => setStatusMessage('جاهز (Ready)'), 4000);
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center p-3 bg-[#8c949d] select-none font-sans overflow-auto" dir="rtl">
      
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[1020px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto">
        
        {/* 1. شريط عنوان النافذة (Window Title Bar): أزرار التحكم على اليمين والعنوان على اليسار مطابق لشاشة الزبائن */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0] text-xs font-bold">
          {/* أزرار التحكم بالنافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-[#cfd5dc] hover:bg-rose-500 hover:text-white border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center font-bold"
                title="إغلاق"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            <button
              type="button"
              className="w-4 h-4 bg-[#cfd5dc] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center hover:bg-[#d8dfe7]"
              title="تكبير"
            >
              <Square className="w-2.5 h-2.5 text-slate-700" />
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-[#cfd5dc] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center hover:bg-[#d8dfe7]"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5 text-slate-700" />
            </button>
          </div>

          {/* العنوان والأيقونة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-slate-800 tracking-wide font-bold">عمولات و مصروفات مورد</span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">2-3</span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة (Window Body) */}
        <div className="p-4 flex flex-col gap-4 bg-[#9fa6ad]">
          
          {/* الجزء العلوي: التاريخ، المورد، والمزرعة */}
          <div className="flex items-center justify-between gap-4">
            
            {/* في اليمين: المورد والمزرعة مع العرض */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-14 bg-[#b2b9c0] border border-slate-500 text-center text-xs font-bold py-0.5">المورد</span>
                  <div className="bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-3 py-0.5 font-bold text-xs min-w-32">
                    {supName}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 bg-[#b2b9c0] border border-slate-500 text-center text-xs font-bold py-0.5">المزرعة</span>
                  <div className="bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-3 py-0.5 font-bold text-xs min-w-32">
                    {farmName}
                  </div>
                </div>
              </div>

              {/* القوائم المنسدلة لاختيار المورد والمزرعة */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5 w-36">
                  <div className="text-[10px] font-bold text-center border-b border-slate-400 bg-[#c2c8cf] py-0.5">المزرعة</div>
                  <select
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    className="bg-white border border-slate-600 text-xs font-bold px-1 py-0.5 outline-none cursor-pointer"
                  >
                    {db.farms.map(f => (
                      <option key={f.farm_id} value={f.farm_name}>{f.farm_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5 w-36">
                  <div className="text-[10px] font-bold text-center border-b border-slate-400 bg-[#c2c8cf] py-0.5">المورد</div>
                  <select
                    value={supName}
                    onChange={e => handleSupplierChange(e.target.value)}
                    className="bg-white border border-slate-600 text-xs font-bold px-1 py-0.5 outline-none cursor-pointer"
                  >
                    {db.suppliers.map(s => (
                      <option key={s.sup_id} value={s.sup_name}>{s.sup_name}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* في اليسار: التاريخ الكلاسيكي */}
            <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5 shadow-inner">
              <input
                type="text"
                value={transDate}
                onChange={e => setTransDate(e.target.value)}
                className="w-24 text-center font-bold text-xs text-slate-900 outline-none"
              />
            </div>

          </div>

          {/* الجدول الأوسط: الأزرار على اليمين والجدول على اليسار مطابق لشاشة الزبائن */}
          <div className="flex items-start gap-3">
            {/* الأزرار الجانبية على اليمين */}
            <div className="flex flex-col gap-1.5 pt-1 shrink-0">
              <button
                type="button"
                onClick={handleAddTopRow}
                title="إضافة سطر (+)"
                className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-sm flex items-center justify-center hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleRemoveTopRow}
                title="حذف سطر (-)"
                className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-sm flex items-center justify-center hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
              >
                -
              </button>
              <button
                type="button"
                onClick={handleSave}
                title="حفظ"
                className="w-14 h-7 bg-[#d8ecd8] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-xs font-bold flex items-center justify-center hover:bg-[#c9e6c9] cursor-pointer shadow-xs"
              >
                حفظ
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                title="طباعة"
                className="w-14 h-9 bg-white border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-xs mt-1 p-1"
              >
                <Printer className="w-5 h-5 text-slate-800" />
              </button>
            </div>

            {/* الجدول على اليسار */}
            <div className="flex-1 border border-slate-600 bg-white overflow-hidden">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold select-none">
                    <th className="border-l border-slate-400 py-1.5 px-3 text-right">البيان</th>
                    <th className="border-l border-slate-400 py-1.5 px-2 w-28">التاريخ</th>
                    <th className="border-l border-slate-400 py-1.5 px-2 w-24">المبلغ</th>
                    <th className="py-1.5 px-3 w-44">المصروف</th>
                  </tr>
                </thead>
                <tbody>
                  {topExps.map((exp, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="border-l border-slate-300 py-1 px-2 text-right">
                        <input
                          type="text"
                          value={exp.descrip}
                          onChange={e => {
                            const next = [...topExps];
                            next[idx].descrip = e.target.value;
                            setTopExps(next);
                          }}
                          className="w-full bg-transparent outline-none font-bold text-slate-900"
                        />
                      </td>
                      <td className="border-l border-slate-300 py-1 px-1 font-mono">{exp.trans_date}</td>
                      <td className="border-l border-slate-300 py-1 px-2">
                        <input
                          type="number"
                          value={exp.amount || ''}
                          onChange={e => {
                            const next = [...topExps];
                            next[idx].amount = Number(e.target.value);
                            setTopExps(next);
                          }}
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={exp.exp_name}
                          onChange={e => {
                            const next = [...topExps];
                            next[idx].exp_name = e.target.value;
                            setTopExps(next);
                          }}
                          placeholder="المصروف..."
                          className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                        />
                      </td>
                    </tr>
                  ))}
                  {/* صف الإجمالي */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                    <td className="border-l border-slate-300 py-1 px-2"></td>
                    <td className="border-l border-slate-300 py-1 px-2"></td>
                    <td className="border-l border-slate-300 py-1 px-2 font-mono text-center text-blue-900">
                      {topTotal.toLocaleString()}
                    </td>
                    <td className="py-1 px-2 text-center font-bold">اجمالي</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* الجزء السفلي: المؤشرات الخضراء وجدول النقلات */}
          <div className="flex items-start gap-4">
            
            {/* المؤشرات الخضراء في اليمين */}
            <div className="flex flex-col gap-2 w-56 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-36 text-xs font-bold text-slate-900">عمولات و مصروفات مورد</span>
                <div className="bg-[#c5ecd0] border-2 border-slate-600 px-2 py-0.5 text-center font-bold text-xs min-w-16 shadow-inner text-slate-950 font-mono">
                  {topTotal}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-xs font-bold text-slate-900">نقدية مستلمة</span>
                <div className="bg-[#c5ecd0] border-2 border-slate-600 px-2 py-0.5 text-center font-bold text-xs min-w-16 shadow-inner text-slate-950 font-mono">
                  {cashReceivedTotal}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-xs font-bold text-slate-900">دفعة عمالة</span>
                <div className="bg-[#c5ecd0] border-2 border-slate-600 px-2 py-0.5 text-center font-bold text-xs min-w-16 shadow-inner text-slate-950 font-mono">
                  {laborPaymentTotal}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-36 text-xs font-bold text-slate-900">الإجمالي</span>
                <div className="bg-[#c5ecd0] border-2 border-slate-600 px-2 py-0.5 text-center font-bold text-xs min-w-16 shadow-inner text-slate-950 font-mono">
                  {grandTotal}
                </div>
              </div>
            </div>

            {/* جدول النقلات السفلي: الأزرار على اليمين والجدول على اليسار مطابق لشاشة الزبائن */}
            <div className="flex-1 flex items-start gap-2">
              {/* الأزرار على اليمين (+ ، - ، طابعة) */}
              <div className="flex flex-col gap-1.5 pt-1 shrink-0">
                <button
                  type="button"
                  onClick={handleAddBottomRow}
                  title="إضافة سطر (+)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-sm flex items-center justify-center hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleRemoveBottomRow}
                  title="حذف سطر (-)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-sm flex items-center justify-center hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  title="طباعة"
                  className="w-14 h-9 bg-white border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-xs mt-1 p-1"
                >
                  <Printer className="w-5 h-5 text-slate-800" />
                </button>
              </div>

              {/* جدول النقلات على اليسار */}
              <div className="flex-1 border border-slate-600 bg-white overflow-hidden">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold select-none">
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">التاريخ</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-20">المبلغ</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">مصروف مزرعة</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">دفعات عماله</th>
                      <th className="border-l border-slate-400 py-1.5 px-2 w-24">نقدية مستلمة</th>
                      <th className="py-1.5 px-3">النقلة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomExps.map((b, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="border-l border-slate-300 py-1 px-1 font-mono">{b.trans_date}</td>
                        <td className="border-l border-slate-300 py-1 px-2 font-mono">{b.amount}</td>
                        <td className="border-l border-slate-300 py-1 px-2 font-mono">{b.farm_exp}</td>
                        <td className="border-l border-slate-300 py-1 px-2 font-mono">{b.labor_payment}</td>
                        <td className="border-l border-slate-300 py-1 px-2 font-mono">{b.cash_received}</td>
                        <td className="py-1 px-2 text-right">
                          <select
                            value={b.nakla_name}
                            onChange={e => {
                              const next = [...bottomExps];
                              next[idx].nakla_name = e.target.value;
                              setBottomExps(next);
                            }}
                            className="w-full bg-[#0055ea] text-white font-bold outline-none px-1 py-0.5 cursor-pointer"
                          >
                            {db.naklat.map(n => (
                              <option key={n.nakla_id} value={n.nakla_name} className="bg-white text-slate-900">
                                {n.nakla_name}
                              </option>
                            ))}
                            {!db.naklat.some(n => n.nakla_name === b.nakla_name) && (
                              <option value={b.nakla_name}>{b.nakla_name}</option>
                            )}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* 3. شريط الحالة السفلي */}
        <div className="bg-[#cfd5dc] border-t border-slate-400 px-3 py-1 flex items-center justify-between text-xs text-slate-700">
          <span className="font-mono">{statusMessage}</span>
          <span>الإجمالي الكلي: <strong>{grandTotal.toLocaleString()} ج.م</strong></span>
        </div>

      </div>

      {/* نافذة معاينة الطباعة */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border-4 border-slate-700 shadow-2xl p-4 text-slate-900" dir="rtl">
            <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
              <h2 className="text-lg font-black">{db.company.branch || 'محل 67 - سوق الجملة'}</h2>
              <h3 className="text-sm font-bold text-slate-700">بيان عمولات ومصروفات المورد: {supName}</h3>
              <p className="text-xs text-slate-500 font-mono">المزرعة: {farmName} | التاريخ: {transDate}</p>
            </div>

            <div className="mb-4">
              <table className="w-full text-xs text-center border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-1 border border-slate-300">المصروف</th>
                    <th className="p-1 border border-slate-300">المبلغ</th>
                    <th className="p-1 border border-slate-300">البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {topExps.map((e, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300 font-bold">{e.exp_name || '—'}</td>
                      <td className="p-1 border border-slate-300 font-mono">{e.amount} ج.م</td>
                      <td className="p-1 border border-slate-300">{e.descrip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-400">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
