import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { SafiFatora, Nakla } from '../types/schema';
import {
  DollarSign,
  Save,
  Printer,
  CheckCircle,
  AlertCircle,
  FileText,
  Calculator,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

interface SarfFatoraWindowProps {
  initialNaklaId?: number;
  onPrintSarfFatora?: (settlement: SafiFatora) => void;
}

export const SarfFatoraWindow: React.FC<SarfFatoraWindowProps> = ({
  initialNaklaId,
  onPrintSarfFatora
}) => {
  const db = wholesaleStore.getState();

  const [selectedNaklaId, setSelectedNaklaId] = useState<number>(
    initialNaklaId || (db.naklat.find(n => !n.nakla_sarf)?.nakla_id || db.naklat[0]?.nakla_id || 1)
  );

  const currentNakla = db.naklat.find(n => n.nakla_id === selectedNaklaId) || db.naklat[0];

  // حساب المبيعات المسجلة على هذه النقلة
  const fatoraSales = db.fatora_f.filter(f => f.nakla_id === selectedNaklaId);
  const fatoraBananaSales = db.fatora_banana.filter(f => f.nakla_id === selectedNaklaId);

  const calculatedEgmaly =
    fatoraSales.reduce((sum, f) => sum + f.totally, 0) +
    fatoraBananaSales.reduce((sum, f) => sum + f.totally, 0);

  // حساب مصروفات النقلة
  const naklaExpsList = db.nakla_exps.filter(e => e.nakla_id === selectedNaklaId || e.nakla_name === currentNakla?.nakla_name);
  const calculatedNaklaExps = naklaExpsList.reduce((sum, e) => sum + e.exp_amount, 0);

  // السلف والدفعات ومصروفات المزرعة
  const nakdiaList = db.nakla_nakdia.filter(n => n.nakla_id === selectedNaklaId || n.nakla_name === currentNakla?.nakla_name);
  const calculatedCashAdvance = nakdiaList.reduce((sum, n) => sum + (n.cash_advance || 0), 0);
  const calculatedDofaat = nakdiaList.reduce((sum, n) => sum + (n.dofaat || 0), 0);
  const calculatedFarmExp = nakdiaList.reduce((sum, n) => sum + (n.farm_exp_amount || 0), 0);

  // حقول تصفية الفاتورة التفاعلية
  const [egmaly, setEgmaly] = useState<number>(calculatedEgmaly);
  const rawInitialRate = currentNakla?.comission !== undefined ? currentNakla.comission : 0.06;
  const [comissionRate, setComissionRate] = useState<number>(rawInitialRate >= 1 ? rawInitialRate / 100 : rawInitialRate);
  const [tanzil, setTanzil] = useState<number>(currentNakla?.tanzil || 0);
  const [wahba, setWahba] = useState<number>(currentNakla?.wahba || 0);
  const [naklaExps, setNaklaExps] = useState<number>(calculatedNaklaExps);
  const [cashAdvance, setCashAdvance] = useState<number>(calculatedCashAdvance);
  const [dofaat, setDofaat] = useState<number>(calculatedDofaat);
  const [farmExp, setFarmExp] = useState<number>(calculatedFarmExp);
  const [anyNew, setAnyNew] = useState<number>(0);
  const [harsh, setHarsh] = useState<number>(0);
  const [fatoraAdd, setFatoraAdd] = useState<number>(0);
  const [sarfKhazina, setSarfKhazina] = useState<boolean>(true);
  const [transDate, setTransDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [successMsg, setSuccessMsg] = useState('');
  const [lastSettlement, setLastSettlement] = useState<SafiFatora | null>(null);

  // المعادلة الجوهرية (safi_fatora) وحساب العمولة الدقيق
  const normalizedRate = comissionRate >= 1 ? comissionRate / 100 : comissionRate;
  const comissionAmount = Math.round(egmaly * normalizedRate);
  const totalDeductions =
    comissionAmount +
    Number(tanzil) +
    Number(wahba) +
    Number(naklaExps) +
    Number(cashAdvance) +
    Number(dofaat) +
    Number(farmExp) +
    Number(anyNew);

  const safiFatora = Math.round(egmaly - totalDeductions + Number(harsh) + Number(fatoraAdd));

  const handleNaklaChange = (id: number) => {
    setSelectedNaklaId(id);
    const nak = db.naklat.find(n => n.nakla_id === id);
    if (nak) {
      const sup = db.suppliers.find(s => s.sup_id === nak.sup_id || s.sup_name === nak.sup_name);
      const rawComm = nak.comission !== undefined && nak.comission > 0 ? nak.comission : (sup?.comission || 0.06);
      setComissionRate(rawComm >= 1 ? rawComm / 100 : rawComm);
      setTanzil(nak.tanzil || 0);
      setWahba(nak.wahba || 0);

      // إعادة حساب الإجمالي الفعلي تلقائياً بدون أرقام وهمية
      const nakSales = db.fatora_f.filter(f => f.nakla_id === id).reduce((sum, f) => sum + f.totally, 0);
      const nakBSales = db.fatora_banana.filter(f => f.nakla_id === id).reduce((sum, f) => sum + f.totally, 0);
      const sumTotal = nakSales + nakBSales;
      setEgmaly(sumTotal);

      const nExps = db.nakla_exps.filter(e => e.nakla_id === id || e.nakla_name === nak.nakla_name).reduce((sum, e) => sum + e.exp_amount, 0);
      setNaklaExps(nExps);

      const nNakdia = db.nakla_nakdia.filter(n => n.nakla_id === id || n.nakla_name === nak.nakla_name);
      setCashAdvance(nNakdia.reduce((sum, n) => sum + (n.cash_advance || 0), 0));
      setDofaat(nNakdia.reduce((sum, n) => sum + (n.dofaat || 0), 0));
      setFarmExp(nNakdia.reduce((sum, n) => sum + (n.farm_exp_amount || 0), 0));
    }
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNakla) return;

    const saved = wholesaleStore.settleNakla({
      nakla_id: currentNakla.nakla_id,
      nakla_name: currentNakla.nakla_name,
      sup_name: currentNakla.sup_name,
      farm_name: currentNakla.farm_name,
      egmaly: Number(egmaly),
      comission: comissionAmount,
      tanzil: Number(tanzil),
      wahba: Number(wahba),
      nakla_exps: Number(naklaExps),
      cash_advance: Number(cashAdvance),
      dofaat: Number(dofaat),
      farm_exp: Number(farmExp),
      any_new: Number(anyNew),
      harsh: Number(harsh),
      fatora_add: Number(fatoraAdd),
      safi_fatora: safiFatora,
      sarf_khazina: sarfKhazina,
      trans_date: transDate,
      printed: true
    });

    setLastSettlement(saved);
    setSuccessMsg(`تمت تصفية النقلة وصرف مستحقات المورد بمبلغ ${safiFatora.toLocaleString()} جنيه بنجاح.`);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>تصفية وصرف فاتورة النقلة (حساب المورد النهائي)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">w_sarf_fatora</span>
            </h1>
            <p className="text-xs text-slate-500">
              احتساب إجمالي المبيعات وخصم عمولة الوكالة والتنزيل ومصروفات السيارة وصرف صافي المستحق
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-xs">
          <span className="font-semibold text-slate-600">اختر النقلة للتصفية:</span>
          <select
            value={selectedNaklaId}
            onChange={e => handleNaklaChange(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-bold focus:outline-emerald-600 text-xs"
          >
            {db.naklat.map((nak, idx) => (
              <option key={`sarf_nakla_${nak.nakla_id}_${idx}`} value={nak.nakla_id}>
                #{nak.nakla_number} - {nak.nakla_name} ({nak.sup_name}) {nak.nakla_sarf ? '✓ صُرفت' : '⏳ معلقة'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          {lastSettlement && onPrintSarfFatora && (
            <button
              onClick={() => onPrintSarfFatora(lastSettlement)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف تصفية النقلة</span>
            </button>
          )}
        </div>
      )}

      {/* 2. معادلة التصفية الرئيسية (DataWindow Form: dw_safi_fatora) */}
      <form onSubmit={handleSettleSubmit} className="space-y-4">
        {/* كارت ملخص الإيرادات والاستقطاعات */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-800">بيانات التصفية الحسابية (dw_safi_fatora)</span>
            <div className="flex items-center gap-2 text-slate-600">
              <span>المورد: <strong className="text-slate-800">{currentNakla?.sup_name}</strong></span>
              <span>·</span>
              <span>المزرعة: <strong className="text-slate-800">{currentNakla?.farm_name || 'عام'}</strong></span>
            </div>
          </div>

          {/* البند الأول: إجمالي مبيعات النقلة */}
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <label className="block text-emerald-900 font-bold mb-1">إجمالي مبيعات البضاعة المباعة (egmaly) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={egmaly}
                    onChange={e => setEgmaly(parseFloat(e.target.value) || 0)}
                    className="w-48 bg-white border border-emerald-300 rounded px-3 py-1.5 font-mono text-center font-black text-emerald-900 text-lg shadow-sm"
                    required
                  />
                  <span className="text-slate-500 font-medium">جنيه مصري</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-white px-3 py-2 rounded border border-emerald-200 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>
                  محسوب آلياً من فواتير البيع: {calculatedEgmaly.toLocaleString()} ج ({fatoraSales.length} فاتورة مسجلة)
                </span>
              </div>
            </div>
          </div>

          {/* البند الثاني: جدول الاستقطاعات والمصروفات المخصومة من المورد */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <ArrowDownCircle className="w-4 h-4" />
              <span>الاستقطاعات والخصومات من إجمالي الفاتورة (تخصم من حساب المورد)</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* عمولة الوكالة */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">عمولة الوكالة:</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={Math.round(normalizedRate * 100 * 10) / 10}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setComissionRate(val / 100);
                      }}
                      className="w-12 text-center border border-slate-300 rounded font-mono font-bold text-xs bg-white text-blue-900 outline-none"
                    />
                    <span className="text-[11px] font-bold text-slate-600">%</span>
                  </div>
                </div>
                <div className="font-mono font-black text-slate-900 text-base text-center py-1 bg-white border border-slate-200 rounded">
                  {comissionAmount.toLocaleString()} ج
                </div>
              </div>

              {/* نولون ومصروفات النقلة */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">نولون ومصروفات النقلة:</label>
                <input
                  type="number"
                  value={naklaExps}
                  onChange={e => setNaklaExps(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* سلفة نقدية للسائق/المورد */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">سلفة نقدية معجلة:</label>
                <input
                  type="number"
                  value={cashAdvance}
                  onChange={e => setCashAdvance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* دفعات مسددة مسبقاً */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">دفعات سابقة تحت الحساب:</label>
                <input
                  type="number"
                  value={dofaat}
                  onChange={e => setDofaat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* التنزيل */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">أجرة التنزيل (tanzil):</label>
                <input
                  type="number"
                  value={tanzil}
                  onChange={e => setTanzil(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* الوهبة */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">الوهبة / الإكرامية (wahba):</label>
                <input
                  type="number"
                  value={wahba}
                  onChange={e => setWahba(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* مصروفات مزرعة محملة */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">مصروفات مزرعة مسجلة:</label>
                <input
                  type="number"
                  value={farmExp}
                  onChange={e => setFarmExp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base"
                />
              </div>

              {/* خصومات أخرى مستجدة */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1">أي خصم مستجد (any_new):</label>
                <input
                  type="number"
                  value={anyNew}
                  onChange={e => setAnyNew(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-center font-bold text-base text-rose-700"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-rose-50 px-3 py-1.5 rounded border border-rose-200 text-xs">
              <span className="font-bold text-rose-800">مجموع إجمالي الاستقطاعات:</span>
              <span className="font-mono font-bold text-rose-900 text-sm">
                - {totalDeductions.toLocaleString()} جنيه
              </span>
            </div>
          </div>

          {/* البند الثالث: الإضافات والهرش وفروق الميزان */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <label className="block text-slate-700 font-bold">الهرش وفروق كسر الميزان (harsh):</label>
                <span className="text-[10px] text-slate-500">يضاف لحساب المورد</span>
              </div>
              <input
                type="number"
                value={harsh}
                onChange={e => setHarsh(parseFloat(e.target.value) || 0)}
                className="w-28 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-center font-bold"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <label className="block text-slate-700 font-bold">إضافات الفاتورة (fatora_add):</label>
                <span className="text-[10px] text-slate-500">مبالغ تعويضية أو فروق سعر</span>
              </div>
              <input
                type="number"
                value={fatoraAdd}
                onChange={e => setFatoraAdd(parseFloat(e.target.value) || 0)}
                className="w-28 bg-white border border-slate-300 rounded px-2 py-1 font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* النتيجة النهائية: صافي الفاتورة المستحق للمورد (safi_fatora) */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div>
              <span className="block text-xs text-slate-400">صافي المستحق للمورد عن هذه النقلة (safi_fatora):</span>
              <span className="text-xs text-emerald-400">
                (إجمالي المبيعات - الاستقطاعات + الهرش والإضافات)
              </span>
            </div>

            <div className="text-left">
              <span className="font-mono font-black text-2xl text-emerald-400 tracking-wider">
                {safiFatora.toLocaleString()} جنيه
              </span>
            </div>
          </div>

          {/* خيارات الصرف */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={sarfKhazina}
                onChange={e => setSarfKhazina(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>إصدار إذن صرف نقدي فوري من الخزينة لحساب المورد (sarf_khazina)</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>اعتماد تصفية النقلة والصرف (F4)</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 3. سجل النقلات التي تمت تصفيتها سابقاً */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200">
          سجل التصفية وصرف الفواتير السابقة ({db.safi_fatora.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">رقم</th>
                <th className="p-2">التاريخ</th>
                <th className="p-2">النقلة</th>
                <th className="p-2">المورد</th>
                <th className="p-2">إجمالي المبيعات</th>
                <th className="p-2">عمولة الوكالة</th>
                <th className="p-2">النولون والمصروفات</th>
                <th className="p-2">السلف والدفعات</th>
                <th className="p-2 font-bold text-emerald-800">صافي المستحق للمورد</th>
                <th className="p-2 text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {db.safi_fatora.map((s, idx) => (
                <tr key={`safi_${s.id}_${idx}`} className="hover:bg-slate-50">
                  <td className="p-2 font-mono text-slate-400">#{s.id}</td>
                  <td className="p-2 font-mono text-slate-500">{s.trans_date}</td>
                  <td className="p-2 font-semibold text-slate-800">{s.nakla_name}</td>
                  <td className="p-2 text-slate-700">{s.sup_name}</td>
                  <td className="p-2 font-mono font-bold">{s.egmaly.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-slate-600">{s.comission.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-slate-600">{s.nakla_exps.toLocaleString()} ج</td>
                  <td className="p-2 font-mono text-slate-600">{(s.cash_advance + s.dofaat).toLocaleString()} ج</td>
                  <td className="p-2 font-mono font-black text-emerald-700 text-sm">{s.safi_fatora.toLocaleString()} ج</td>
                  <td className="p-2 text-center">
                    {onPrintSarfFatora && (
                      <button
                        onClick={() => onPrintSarfFatora(s)}
                        className="text-slate-600 hover:text-emerald-700 p-1"
                        title="طباعة كشف التصفية"
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
