import React from 'react';
import { FatoraF, CompanyData } from '../../types/schema';
import { Printer, X } from 'lucide-react';

interface FatoraPrintModalProps {
  fatora: FatoraF | null;
  company: CompanyData;
  onClose: () => void;
}

export const FatoraPrintModal: React.FC<FatoraPrintModalProps> = ({
  fatora,
  company,
  onClose
}) => {
  if (!fatora) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white text-xs print:hidden">
          <span className="font-bold">معاينة بوليصة البيع للطباعة</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-semibold text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة البوليصة</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Area */}
        <div className="p-6 space-y-4 text-slate-900 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
            <h2 className="text-base font-black text-slate-900">{company.branch}</h2>
            <div className="text-xs font-semibold text-emerald-800">
              سوق الجملة للخضار والفاكهة · بوليصة بيع وميزان
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              هاتف: {company.tel || '01012345678'}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-200">
            <div>
              <span className="text-slate-500">رقم الفاتورة: </span>
              <span className="font-mono font-bold">#{fatora.id}</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-slate-500">التاريخ: </span>
              <span>{fatora.trans_date}</span>
            </div>
            <div>
              <span className="text-slate-500">المشتري: </span>
              <span className="font-bold">{fatora.customer_name}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-500">طريقة السداد: </span>
              <span className="font-bold text-emerald-800">{fatora.cash ? 'نقدي (كاش)' : 'آجل (شكك)'}</span>
            </div>
            <div className="col-span-2 text-[11px] text-slate-500">
              النقلة: {fatora.nakla_name} (المورد: {fatora.sup_name})
            </div>
          </div>

          {/* Weight & Calculation Table */}
          <table className="w-full text-xs text-right border border-slate-800">
            <thead className="bg-slate-100 text-slate-800 border-b border-slate-800 font-bold">
              <tr>
                <th className="p-2 border-l border-slate-800">البيان / الصنف</th>
                <th className="p-2 border-l border-slate-800 w-16 text-center">العبوات</th>
                <th className="p-2 border-l border-slate-800 w-20 text-center">الوزن الصافي</th>
                <th className="p-2 border-l border-slate-800 w-16 text-center">السعر</th>
                <th className="p-2 w-24 text-center">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-l border-slate-800 font-bold">
                  {fatora.cat_name}
                  <span className="block text-[10px] text-slate-500 font-normal">
                    قائم: {fatora.t_weight} كجم | فارغ: {fatora.samah_weight} كجم
                  </span>
                </td>
                <td className="p-2 border-l border-slate-800 text-center font-mono font-bold">
                  {fatora.sobata_num}
                </td>
                <td className="p-2 border-l border-slate-800 text-center font-mono font-black text-emerald-900">
                  {fatora.net_weight} كجم
                </td>
                <td className="p-2 border-l border-slate-800 text-center font-mono">
                  {(Number(fatora.price) || 0).toFixed(2)}
                </td>
                <td className="p-2 text-center font-mono font-bold">
                  {(Number(fatora.totally) || 0).toLocaleString()} ج
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">قيمة البضاعة:</span>
              <span className="font-mono font-bold">{fatora.totally.toLocaleString()} جنيه</span>
            </div>
            {fatora.byaaa > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">رسم البياعة:</span>
                <span className="font-mono">{fatora.byaaa.toLocaleString()} جنيه</span>
              </div>
            )}
            {fatora.t_rahn > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">رهن الفوارغ ({fatora.sobata_num} عبوة × {fatora.rahn} ج):</span>
                <span className="font-mono font-bold text-amber-800">+{fatora.t_rahn.toLocaleString()} جنيه</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-black bg-slate-50 px-2 rounded">
              <span>الإجمالي المطلوب سداده:</span>
              <span className="font-mono text-emerald-900 text-base">{fatora.tota.toLocaleString()} جنيه</span>
            </div>
          </div>

          {/* Footer & Signatures */}
          <div className="pt-4 border-t border-dashed border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <span className="block mb-6">المستلم / المشتري:</span>
              <span>................................</span>
            </div>
            <div>
              <span className="block mb-6">توقيع الميزان / الوكالة:</span>
              <span>................................</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
