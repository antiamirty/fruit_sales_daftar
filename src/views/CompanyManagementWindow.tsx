import React, { useState } from 'react';
import { PBWindowFrame } from '../components/layout/PBWindowFrame';
import { wholesaleStore } from '../services/storage';
import { Building2, Users, DollarSign, PieChart, CheckCircle } from 'lucide-react';

interface CompanyManagementWindowProps {
  mode?: 'w_company_data' | 'w_owners' | 'w_owner_sahb' | 'w_branch_data' | 'w_markz_mali';
  onClose?: () => void;
}

export const CompanyManagementWindow: React.FC<CompanyManagementWindowProps> = ({
  mode = 'w_company_data',
  onClose
}) => {
  const db = wholesaleStore.getState();
  const [activeMode, setActiveMode] = useState(mode);

  // Form State: Company / Branch Data
  const [branchName, setBranchName] = useState(db.company.branch || 'محل 67 فاكهة');
  const [comission, setComission] = useState<number>(db.company.comission * 100 || 7);
  const [byaaa, setByaaa] = useState<number>(db.company.byaaa * 100 || 2);
  const [tanzil, setTanzil] = useState<number>(db.company.tanzil || 150);
  const [wahba, setWahba] = useState<number>(db.company.wahba || 50);
  const [tel, setTel] = useState(db.company.tel || '01001234567');

  // Partners State
  const [partners, setPartners] = useState([
    { id: 1, name: 'أبو حسن (الشريك الرئيسي)', share: 60, capital: 500000, balance: 120000 },
    { id: 2, name: 'الحاج إبراهيم رضوان', share: 40, capital: 300000, balance: 80000 }
  ]);

  // Partner Sahb
  const [selectedPartner, setSelectedPartner] = useState(partners[0].name);
  const [partnerSahbAmount, setPartnerSahbAmount] = useState<number>(10000);
  const [partnerSahbDesc, setPartnerSahbDesc] = useState('مسحوبات أرباح شهرية');

  const [message, setMessage] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    wholesaleStore.updateCompany({
      id: db.company.id || '1',
      branch: branchName,
      comission: comission / 100,
      byaaa: byaaa / 100,
      tanzil: Number(tanzil),
      wahba: Number(wahba),
      tel: tel
    });
    setMessage('تم حفظ إعدادات ونسب الشركة والفرع بنجاح');
  };

  const handleSavePartnerSahb = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerSahbAmount <= 0) return;
    setMessage(`تم تسجيل مسحوبات بقيمة ${partnerSahbAmount.toLocaleString()} ج.م للشريك ${selectedPartner}`);
    setPartnerSahbAmount(0);
  };

  const getWindowTitle = () => {
    switch (activeMode) {
      case 'w_company_data':
        return 'بيانات الشركة والوكالة (النسب والرسوم الرسمية)';
      case 'w_owners':
        return 'الشركاء (نسب توزيع الأرباح ورؤوس الأموال)';
      case 'w_owner_sahb':
        return 'مسحوبات الشركاء (تسجيل السحوبات وتوزيعات الأرباح)';
      case 'w_branch_data':
        return 'بيانات الفرع (محل 67 فاكهة - سوق 6 أكتوبر)';
      case 'w_markz_mali':
        return 'المركز المالي للفرع والوكالة';
      default:
        return 'بيانات الشركة والفرع';
    }
  };

  return (
    <PBWindowFrame
      windowCode={activeMode}
      windowTitle={getWindowTitle()}
      onClose={onClose}
      statusInfo={`الفرع: ${branchName} | الشركاء: ${partners.length}`}
    >
      {/* Sub Navigation Bar inside window */}
      <div className="flex items-center gap-1 mb-3 border-b border-slate-300 pb-2 flex-wrap">
        <button
          onClick={() => setActiveMode('w_company_data')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_company_data'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_company_data - بيانات الشركة
        </button>
        <button
          onClick={() => setActiveMode('w_owners')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_owners'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_owners - الشركاء
        </button>
        <button
          onClick={() => setActiveMode('w_owner_sahb')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_owner_sahb'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_owner_sahb - مسحوبات الشركاء
        </button>
        <button
          onClick={() => setActiveMode('w_branch_data')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_branch_data'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_branch_data - بيانات الفرع
        </button>
        <button
          onClick={() => setActiveMode('w_markz_mali')}
          className={`px-2.5 py-1 font-bold text-xs border-2 ${
            activeMode === 'w_markz_mali'
              ? 'bg-emerald-800 text-white border-emerald-950'
              : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700'
          }`}
        >
          w_markz_mali - المركز المالي
        </button>
      </div>

      {message && (
        <div className="mb-3 p-2 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{message}</span>
        </div>
      )}

      {/* 1. بيانات الشركة والفرع (w_company_data & w_branch_data) */}
      {(activeMode === 'w_company_data' || activeMode === 'w_branch_data') && (
        <div className="max-w-2xl mx-auto bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-4 shadow-sm">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-2 py-1 text-xs font-bold mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>بيانات الفرع والنسب الافتراضية للوكالة (dw_company_data)</span>
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">اسم الفرع / المحل:</label>
                <input
                  type="text"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-400 font-bold text-slate-900 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={tel}
                  onChange={e => setTel(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-400 text-slate-900 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-300">
              <div>
                <label className="block font-bold text-slate-800 mb-1">نسبة العمولة الافتراضية (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={comission}
                  onChange={e => setComission(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-400 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">نسبة البياعة الافتراضية (%):</label>
                <input
                  type="number"
                  step="0.5"
                  value={byaaa}
                  onChange={e => setByaaa(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-400 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">أجرة التنزيل المعتمدة (ج.م):</label>
                <input
                  type="number"
                  value={tanzil}
                  onChange={e => setTanzil(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-400 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">الوهبة (إكرامية السائق ج.م):</label>
                <input
                  type="number"
                  value={wahba}
                  onChange={e => setWahba(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-slate-400 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border-2 border-emerald-900 shadow-md"
            >
              حفظ وتثبيت إعدادات الفرع [F3]
            </button>
          </form>
        </div>
      )}

      {/* 2. الشركاء (w_owners) */}
      {activeMode === 'w_owners' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-3 shadow-xs">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-2 py-1 text-xs font-bold mb-2 flex items-center justify-between">
            <span>DataWindow: dw_owners (قائمة الشركاء ونسب توزيع الأرباح)</span>
            <span className="font-mono text-[11px]">{partners.length} شريك</span>
          </div>

          <div className="overflow-x-auto border border-slate-400 bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-200 border-b-2 border-slate-400 text-slate-900">
                <tr>
                  <th className="p-1.5 border-l border-slate-300">كود</th>
                  <th className="p-1.5 border-l border-slate-300">اسم الشريك</th>
                  <th className="p-1.5 border-l border-slate-300 text-center">النسبة (%)</th>
                  <th className="p-1.5 border-l border-slate-300 text-left">رأس المال المدفوع</th>
                  <th className="p-1.5 text-left font-black">رصيد الأرباح المتراكمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {partners.map((p, idx) => (
                  <tr key={`cm_partner_${p.id}_${idx}`} className="bg-white">
                    <td className="p-1.5 border-l border-slate-200 font-mono text-center">{p.id}</td>
                    <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{p.name}</td>
                    <td className="p-1.5 border-l border-slate-200 text-center font-mono font-bold text-blue-900">{p.share}%</td>
                    <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-slate-800">
                      {p.capital.toLocaleString()} ج.م
                    </td>
                    <td className="p-1.5 text-left font-mono font-black text-emerald-800">
                      {p.balance.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. مسحوبات الشركاء (w_owner_sahb) */}
      {activeMode === 'w_owner_sahb' && (
        <div className="max-w-2xl mx-auto bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-4 shadow-sm">
          <div className="bg-gradient-to-r from-indigo-900 to-blue-950 text-white px-2 py-1 text-xs font-bold mb-3">
            <span>تسجيل مسحوبات شريك (dw_owner_sahb)</span>
          </div>

          <form onSubmit={handleSavePartnerSahb} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">اسم الشريك:</label>
              <select
                value={selectedPartner}
                onChange={e => setSelectedPartner(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-400 font-bold text-slate-900 shadow-inner"
              >
                {partners.map((p, idx) => (
                  <option key={`cm_partner_opt_${p.id}_${idx}`} value={p.name}>
                    {p.name} (النسبة: {p.share}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">المبلغ المسحوب (ج.م):</label>
              <input
                type="number"
                value={partnerSahbAmount}
                onChange={e => setPartnerSahbAmount(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-slate-400 font-mono font-bold text-rose-700"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">البيان:</label>
              <input
                type="text"
                value={partnerSahbDesc}
                onChange={e => setPartnerSahbDesc(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-400 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border-2 border-emerald-900 shadow-md"
            >
              صرف وتسجيل مسحوبات الشريك [F3]
            </button>
          </form>
        </div>
      )}

      {/* 4. المركز المالي (w_markz_mali) */}
      {activeMode === 'w_markz_mali' && (
        <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 p-4 shadow-sm">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-2 py-1 text-xs font-bold mb-3 flex items-center justify-between">
            <span>المركز المالي والميزانية العمومية للفرع (dw_markz_mali)</span>
            <span className="font-mono text-[11px]">محل 67 - عنبر 1</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* الأصول */}
            <div className="bg-white border border-slate-400 p-3">
              <div className="font-bold text-emerald-900 border-b border-slate-300 pb-1 mb-2 text-sm">
                الأصول المتداولة (Assets)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>نقدية بالخزينة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {db.khazna
                      .reduce((acc: number, t) => acc + (t.trans_type === 'in' ? t.amount : -t.amount), 0)
                      .toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>أرصدة ذمم العملاء (الآجل):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {db.customers.reduce((acc, c) => acc + (c.current_balance || 3000), 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>أمانات رهن الفوارغ لدى الزبائن:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {(db.customers.reduce((acc, c) => acc + (c.crates_balance || 25), 0) * 25).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 pt-2 border-t border-slate-300">
                  <span>إجمالي الأصول:</span>
                  <span className="font-mono text-sm">285,400 ج.م</span>
                </div>
              </div>
            </div>

            {/* الخصوم وحقوق الملكية */}
            <div className="bg-white border border-slate-400 p-3">
              <div className="font-bold text-rose-900 border-b border-slate-300 pb-1 mb-2 text-sm">
                الخصوم وحقوق الملكية (Liabilities & Equity)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>مستحقات الموردين غير المصروفة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {db.naklat
                      .filter(n => !n.nakla_sarf)
                      .reduce((acc, n) => acc + 25000, 0)
                      .toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>مستحقات موردي الفوارغ:</span>
                  <span className="font-mono font-bold text-slate-800">9,500 ج.م</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>رؤوس أموال الشركاء:</span>
                  <span className="font-mono font-bold text-slate-800">200,000 ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 pt-2 border-t border-slate-300">
                  <span>إجمالي الخصوم وحقوق الملكية:</span>
                  <span className="font-mono text-sm">285,400 ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PBWindowFrame>
  );
};
