import React from 'react';
import { X, Minus, Square } from 'lucide-react';

interface CompanyInfoDialogProps {
  onClose: () => void;
}

export const CompanyInfoDialog: React.FC<CompanyInfoDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/40 p-2 sm:p-4" dir="rtl">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 shadow-2xl overflow-hidden font-sans select-none my-auto">
        {/* Title Bar (Classic Windows / PowerBuilder TitleBar) */}
        <div className="bg-gradient-to-r from-[#9db7d5] via-[#c6d7e8] to-[#9db7d5] border-b border-slate-400 px-2 py-1 flex items-center justify-between">
          {/* أزرار التحكم في النافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] hover:bg-rose-600 hover:text-white border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="إغلاق"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            <button
              className="w-5 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تكبير"
            >
              <Square className="w-2 h-2" />
            </button>
            <button
              onClick={onClose}
              className="w-5 h-4 bg-[#ece9d8] hover:bg-[#d8d4c4] border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-[10px] flex items-center justify-center text-slate-800"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* العنوان والأيقونة على اليسار */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>معلومات الشركة</span>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-800 flex items-center justify-center text-[8px] text-white font-mono">
              🍏
            </span>
          </div>
        </div>

        {/* Dialog Content: Abu Hassan Fruit Emblem (مطابق لصورة باور بيلدر 1) */}
        <div className="p-4 bg-gradient-to-b from-[#2d1e18] via-[#1a2e22] to-[#121b18] flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
          {/* خلفية فواكه واقعية فنية */}
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#e67e22_1px,transparent_1px),radial-gradient(#27ae60_1px,#121b18_1px)] bg-[size:20px_20px]" />

          {/* درع وشعار أبو حسن الدائري الكلاسيكي */}
          <div className="relative z-10 w-80 h-80 rounded-full border-8 border-[#3b5323] shadow-2xl bg-gradient-to-b from-[#fbf8ee] via-[#f4ecd8] to-[#e6dac0] p-4 flex flex-col items-center justify-between text-center border-double outline outline-4 outline-[#d4af37]">
            {/* إكليل الغار المحيط */}
            <div className="w-full pt-1">
              <span className="text-[11px] font-bold text-[#2d4a22] tracking-wider block">
                🌿 سوق الجملة 6 أكتوبر 🌿
              </span>
            </div>

            {/* اسم المحل والخط العربي */}
            <div className="my-auto">
              <h1 className="text-3xl font-extrabold text-[#1a381e] tracking-tight font-serif drop-shadow-xs">
                أبـو حسـن
              </h1>
              <div className="text-xs font-bold text-[#b8860b] mt-0.5 tracking-wide">
                لتجارة الفاكهة بالجملة
              </div>

              {/* أيقونة التفاحة الخضراء المركزية */}
              <div className="my-2 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#2d8a4e] via-[#48b96d] to-[#74db96] border-2 border-[#1c5f35] shadow-inner flex items-center justify-center text-4xl transform hover:scale-105 transition-transform">
                  🍏
                </div>
              </div>

              <div className="text-[11px] font-bold text-[#1a381e]">
                عنبر 1 - محل 67 فاكهة
              </div>
            </div>

            {/* الشريط السفلي */}
            <div className="w-full pb-1 border-t border-[#c2b280] pt-1">
              <span className="text-[10px] font-bold text-[#4a5d3f]">
                وكالة وحلقة بيع الخضار والفاكهة
              </span>
            </div>
          </div>

          {/* زر إغلاق بالأسفل */}
          <div className="mt-4 relative z-10">
            <button
              onClick={onClose}
              className="px-6 py-1 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 text-xs font-bold text-slate-800 shadow-sm"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
