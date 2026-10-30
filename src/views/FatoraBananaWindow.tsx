import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { FatoraBanana } from '../types/schema';
import { Scale, Save, CheckCircle, Search, Printer, X } from 'lucide-react';

interface FatoraBananaWindowProps {
  onClose?: () => void;
}

export const FatoraBananaWindow: React.FC<FatoraBananaWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  const [selectedNaklaId, setSelectedNaklaId] = useState<number>(
    db.naklat[0]?.nakla_id || 1
  );
  const currentNakla = db.naklat.find(n => n.nakla_id === selectedNaklaId) || db.naklat[0];

  const [sobataNum, setSobataNum] = useState<number>(30);
  const [bananaWeight, setBananaWeight] = useState<number>(650);
  const [safiWeight, setSafiWeight] = useState<number>(630);
  const [freeWeight, setFreeWeight] = useState<number>(10);
  const [price, setPrice] = useState<number>(22.0);
  const [isCash, setIsCash] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState<string>('عميل نقدي عام (قطاعي)');
  const [successMsg, setSuccessMsg] = useState('');

  const netWeight = Math.max(0, safiWeight - freeWeight);
  const totally = Math.round(netWeight * price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNakla || netWeight <= 0 || price <= 0) return;

    const nextId = db.fatora_banana.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    const newFatora: FatoraBanana = {
      id: nextId,
      nakla_id: currentNakla.nakla_id,
      nakla_name: currentNakla.nakla_name,
      sup_name: currentNakla.sup_name,
      farm_name: currentNakla.farm_name,
      sobata_num: Number(sobataNum),
      banana_weight: Number(bananaWeight),
      safi_weight: Number(safiWeight),
      free_wehigh: Number(freeWeight),
      net_weight: netWeight,
      price: Number(price),
      totally: totally,
      cash: isCash,
      customer_name: customerName,
      trans_date: new Date().toISOString().split('T')[0]
    };

    // Update state
    const curState = wholesaleStore.getState();
    const updatedKhazna = [...curState.khazna];
    if (isCash) {
      const nextKhaznaId = updatedKhazna.reduce((max, k) => Math.max(max, k.id), 0) + 1;
      updatedKhazna.push({
        id: nextKhaznaId,
        trans_type: 'in',
        category: 'مبيعات نقدية (موز)',
        amount: totally,
        beneficiary: customerName,
        trans_date: newFatora.trans_date,
        notes: `فاتورة موز رقم ${nextId} - ${sobataNum} سبيطة`
      });
    }

    // save directly through JSON / state
    const fullState = {
      ...curState,
      fatora_banana: [newFatora, ...curState.fatora_banana],
      khazna: updatedKhazna
    };
    wholesaleStore.importJson(JSON.stringify(fullState));

    setSuccessMsg(`تم حفظ فاتورة بيع الموز رقم ${nextId} بنجاح بمبلغ ${totally.toLocaleString()} ج.`);
    setTimeout(() => setSuccessMsg(''), 5000);

    setSobataNum(0);
    setBananaWeight(0);
    setSafiWeight(0);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold shadow">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>فاتورة بيع الموز بالسبيطة (الميزان الخاص)</span>
              <span className="text-xs font-mono font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">w_fatora</span>
            </h1>
            <p className="text-xs text-slate-500">
              حساب مبيعات الموز بالسوابيط مع الوزن القائم والصافي وسماح التفاوت
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 text-xs">
            <span className="font-semibold text-slate-600">النقلة:</span>
            <select
              value={selectedNaklaId}
              onChange={e => setSelectedNaklaId(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-bold focus:outline-emerald-600 text-xs"
            >
              {db.naklat.map((nak, idx) => (
                <option key={`banana_nakla_${nak.nakla_id}_${idx}`} value={nak.nakla_id}>
                  #{nak.nakla_number} - {nak.nakla_name}
                </option>
              ))}
            </select>
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
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* نموذج الإدخال */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-medium mb-1">اسم المشتري / التاجر *</label>
            <select
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-semibold"
            >
              <option value="عميل نقدي عام (قطاعي)">عميل نقدي عام (قطاعي)</option>
              {db.customers.map((c, idx) => (
                <option key={`banana_cust_${c.customer_id}_${idx}`} value={c.customer_name}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">طريقة السداد</label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-300">
              <button
                type="button"
                onClick={() => setIsCash(true)}
                className={`flex-1 py-1 rounded font-semibold text-xs ${
                  isCash ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                نقدي كاش
              </button>
              <button
                type="button"
                onClick={() => setIsCash(false)}
                className={`flex-1 py-1 rounded font-semibold text-xs ${
                  !isCash ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                آجل (على الحساب)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1">عدد السوابيط (sobata_num)</label>
            <input
              type="number"
              min="1"
              value={sobataNum}
              onChange={e => setSobataNum(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-center font-bold text-sm"
              required
            />
          </div>
        </div>

        {/* معادلة وزن الموز */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">وزن الموز القائم (كجم)</label>
            <input
              type="number"
              value={bananaWeight}
              onChange={e => setBananaWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono text-center font-bold text-base"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">الوزن الصافي (كجم)</label>
            <input
              type="number"
              value={safiWeight}
              onChange={e => setSafiWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono text-center font-bold text-base"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">سماح التفاوت (كجم)</label>
            <input
              type="number"
              value={freeWeight}
              onChange={e => setFreeWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono text-center font-bold text-amber-700 text-base"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">سعر الكيلو (ج)</label>
            <input
              type="number"
              step="0.5"
              value={price}
              onChange={e => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 font-mono text-center font-black text-emerald-700 text-base"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">الصافي المعتمد والمبلغ</label>
            <div className="w-full bg-amber-100 border border-amber-300 rounded px-2 py-1 font-mono text-center font-black text-amber-950">
              <span className="block text-xs">{netWeight.toLocaleString()} كجم</span>
              <span className="text-base text-emerald-800">{totally.toLocaleString()} ج</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ فاتورة الموز</span>
          </button>
        </div>
      </form>

      {/* سجل فواتير الموز */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200">
          سجل فواتير الموز السابقة ({db.fatora_banana.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-2">رقم</th>
                <th className="p-2">النقلة</th>
                <th className="p-2">المشتري</th>
                <th className="p-2">السوابيط</th>
                <th className="p-2">وزن قائم</th>
                <th className="p-2">صافي</th>
                <th className="p-2">سماح</th>
                <th className="p-2">المعتمد كجم</th>
                <th className="p-2">السعر</th>
                <th className="p-2 font-bold">الإجمالي</th>
                <th className="p-2">السداد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {db.fatora_banana.map((f, idx) => (
                <tr key={`banana_fatora_${f.id}_${idx}`} className="hover:bg-slate-50">
                  <td className="p-2 font-mono text-slate-400">#{f.id}</td>
                  <td className="p-2 font-semibold text-slate-800">{f.nakla_name}</td>
                  <td className="p-2 text-slate-700">{f.customer_name}</td>
                  <td className="p-2 font-mono">{f.sobata_num}</td>
                  <td className="p-2 font-mono">{f.banana_weight}</td>
                  <td className="p-2 font-mono">{f.safi_weight}</td>
                  <td className="p-2 font-mono text-amber-700">{f.free_wehigh}</td>
                  <td className="p-2 font-mono font-bold text-emerald-800">{f.net_weight.toLocaleString()} كجم</td>
                  <td className="p-2 font-mono">{f.price}</td>
                  <td className="p-2 font-mono font-bold text-slate-900">{f.totally.toLocaleString()} ج</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      f.cash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {f.cash ? 'نقدي' : 'آجل'}
                    </span>
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
