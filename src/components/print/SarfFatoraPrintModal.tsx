import React from 'react';
import { SafiFatora, CompanyData } from '../../types/schema';
import { Printer, X } from 'lucide-react';

interface SarfFatoraPrintModalProps {
  settlement: SafiFatora | null;
  company: CompanyData;
  onClose: () => void;
}

export const SarfFatoraPrintModal: React.FC<SarfFatoraPrintModalProps> = ({
  settlement,
  company,
  onClose
}) => {
  if (!settlement) return null;

  const totalDeductions =
    settlement.comission +
    settlement.tanzil +
    settlement.wahba +
    settlement.nakla_exps +
    settlement.cash_advance +
    settlement.dofaat +
    settlement.farm_exp +
    settlement.any_new;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-300">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white text-xs print:hidden">
          <span className="font-bold">معاينة كشف تصفية النقلة للطباعة (w_sarf_fatora)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-semibold text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف التصفية</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 space-y-4 text-slate-900 bg-white" id="printable-settlement">
          <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
            <h2 className="text-base font-black text-slate-900">{company.branch}</h2>
            <div className="text-xs font-bold text-slate-700">
              كشف تصفية وصرف شحنة واردة لحساب المورد (سوق الجملة)
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              هاتف: {company.tel || '01012345678'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-200">
            <div>
              <span className="text-slate-500">اسم المورد: </span>
              <span className="font-bold">{settlement.sup_name}</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-slate-500">التاريخ: </span>
              <span>{settlement.trans_date}</span>
            </div>
            <div>
              <span className="text-slate-500">المزرعة: </span>
              <span>{settlement.farm_name || 'عام'}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-500">رقم السند: </span>
              <span className="font-mono font-bold">#{settlement.id}</span>
            </div>
            <div className="col-span-2 font-bold text-slate-800">
              النقلة: {settlement.nakla_name}
            </div>
          </div>

          {/* الحسابات */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 bg-emerald-50 px-2 rounded border border-emerald-200 font-bold text-sm">
              <span className="text-emerald-900">إجمالي مبيعات النقلة (egmaly):</span>
              <span className="font-mono text-emerald-950 font-black">{settlement.egmaly.toLocaleString()} جنيه</span>
            </div>

            <div className="space-y-1 pr-2 border-r-2 border-rose-300">
              <div className="text-[11px] font-bold text-rose-800 mb-1">الاستقطاعات والخصومات:</div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>عمولة الوكالة:</span>
                <span className="font-mono">-{settlement.comission.toLocaleString()} ج</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>نولون ومصروفات النقلة:</span>
                <span className="font-mono">-{settlement.nakla_exps.toLocaleString()} ج</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>سلف ودفعات سابقة:</span>
                <span className="font-mono">-{(settlement.cash_advance + settlement.dofaat).toLocaleString()} ج</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>أجرة التنزيل والوهبة:</span>
                <span className="font-mono">-{(settlement.tanzil + settlement.wahba).toLocaleString()} ج</span>
              </div>
              {settlement.farm_exp > 0 && (
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>مصروفات المزرعة:</span>
                  <span className="font-mono">-{settlement.farm_exp.toLocaleString()} ج</span>
                </div>
              )}
            </div>

            <div className="flex justify-between py-1 border-t border-slate-200 text-slate-600 font-semibold">
              <span>مجموع الاستقطاعات:</span>
              <span className="font-mono text-rose-700">-{totalDeductions.toLocaleString()} جنيه</span>
            </div>

            {settlement.harsh > 0 && (
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>هرش وفروق كسر ميزان (harsh):</span>
                <span className="font-mono text-emerald-700">+{settlement.harsh.toLocaleString()} ج</span>
              </div>
            )}

            <div className="flex justify-between py-2.5 border-t-2 border-slate-800 text-sm font-black bg-slate-900 text-white px-3 rounded-lg mt-2">
              <span>صافي المستحق للمورد (safi_fatora):</span>
              <span className="font-mono text-emerald-400 text-lg">{settlement.safi_fatora.toLocaleString()} جنيه</span>
            </div>
          </div>

          <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <span className="block mb-8">المورد / المسلم له:</span>
              <span>................................</span>
            </div>
            <div>
              <span className="block mb-8">أمين الخزينة / مدير الوكالة:</span>
              <span>................................</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
