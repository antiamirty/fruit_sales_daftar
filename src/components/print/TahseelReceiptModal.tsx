import React from 'react';
import { TahseelRecord, CompanyData } from '../../types/schema';
import { Printer, X } from 'lucide-react';

interface TahseelReceiptModalProps {
  receipt: TahseelRecord | null;
  company: CompanyData;
  onClose: () => void;
}

export const TahseelReceiptModal: React.FC<TahseelReceiptModalProps> = ({
  receipt,
  company,
  onClose
}) => {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-300">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white text-xs print:hidden">
          <span className="font-bold">معاينة سند القبض للطباعة</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-semibold text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة السند</span>
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
        <div className="p-6 space-y-4 text-slate-900 bg-white" id="printable-receipt">
          <div className="text-center pb-3 border-b-2 border-slate-800 space-y-1">
            <h2 className="text-base font-black text-slate-900">{company.branch}</h2>
            <div className="text-xs font-bold text-emerald-800">
              سند قبض نقدية وتحصيل ذمم (سوق الجملة)
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              هاتف: {company.tel || '01012345678'}
            </div>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-slate-200">
            <div>
              <span className="text-slate-500">رقم السند: </span>
              <span className="font-mono font-bold">#{receipt.id}</span>
            </div>
            <div className="font-mono">
              <span className="text-slate-500">التاريخ: </span>
              <span>{receipt.trans_date}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs py-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">وصلنا من السيد / التاجر:</span>
              <span className="font-bold text-slate-900 text-sm">{receipt.customer_name}</span>
            </div>

            <div className="flex justify-between items-center py-2 bg-emerald-50 px-2 rounded border border-emerald-200">
              <span className="text-slate-700 font-bold">المبلغ المستلم نقداً:</span>
              <span className="font-mono font-black text-emerald-900 text-lg">
                {receipt.amount.toLocaleString()} جنيه مصري
              </span>
            </div>

            {receipt.samah > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-amber-800">
                <span>خصم سماح / تنزيل ممنوح:</span>
                <span className="font-mono font-bold">{receipt.samah.toLocaleString()} جنيه</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>طريقة السداد:</span>
              <span className="font-medium">
                {receipt.payment_type === 'cash' ? 'نقداً بالخزينة' : receipt.payment_type === 'cheque' ? 'شيك بنكي' : 'تحويل'}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>البيان / لأجل:</span>
              <span className="font-medium">{receipt.notes || 'سداد دفعة تحت الحساب'}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 text-center text-xs text-slate-600">
            <div>
              <span className="block mb-6">المسدد / التاجر:</span>
              <span>................................</span>
            </div>
            <div>
              <span className="block mb-6">المحصل / أمين الصندوق:</span>
              <span>................................</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
