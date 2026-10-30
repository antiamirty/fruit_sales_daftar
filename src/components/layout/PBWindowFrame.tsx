import React from 'react';
import { Minus, Square, X, Plus, Save, Trash2, Search, Printer, ArrowRight } from 'lucide-react';

interface PBWindowFrameProps {
  windowCode: string;
  windowTitle: string;
  onClose?: () => void;
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onPrint?: () => void;
  statusInfo?: string;
  children: React.ReactNode;
}

export const PBWindowFrame: React.FC<PBWindowFrameProps> = ({
  windowCode,
  windowTitle,
  onClose,
  onNew,
  onSave,
  onDelete,
  onSearch,
  onPrint,
  statusInfo = 'جاهز (Ready)',
  children
}) => {
  return (
    <div className="bg-slate-200 border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 shadow-xl mx-auto my-2 max-w-7xl rounded-xs overflow-hidden font-sans">
      {/* 1. PowerBuilder Window Titlebar (Classic Blue Gradient) */}
      <div className="bg-gradient-to-r from-[#0a246a] via-[#0055ea] to-[#3a8ee6] text-white px-2 py-1 flex items-center justify-between select-none">
        {/* أزرار التحكم بالنافذة على اليمين (إغلاق، تكبير، تصغير) مثل شاشة الزبائن والباور بيلدر الأصلي */}
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-4 h-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-t-rose-400 border-l-rose-400 border-b-rose-950 border-r-rose-950 text-white flex items-center justify-center text-[10px] font-bold"
              title="إغلاق النافذة"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <button
            type="button"
            className="w-4 h-4 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-slate-900 flex items-center justify-center text-[10px]"
            title="تكبير"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            className="w-4 h-4 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 border border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-slate-900 flex items-center justify-center text-[10px]"
            title="تصغير"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* عنوان النافذة وكود النافذة وأيقونة باور بيلدر على اليسار */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs tracking-wide">
            {windowTitle}
          </span>
          <span className="text-white/60 text-xs">|</span>
          <span className="font-bold text-xs tracking-wide drop-shadow-xs font-mono bg-amber-300 text-slate-900 px-1 py-0.2 rounded border border-amber-500">
            {windowCode}
          </span>
          {/* PowerBuilder Window Icon */}
          <div className="w-4 h-4 bg-emerald-600 border border-white/50 rounded-xs flex items-center justify-center font-mono text-[9px] font-bold">
            PB
          </div>
        </div>
      </div>

      {/* 2. PowerBuilder Action Toolbar */}
      <div className="bg-slate-200 border-b border-slate-400 px-2 py-1 flex items-center gap-1 select-none flex-wrap text-xs">
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-800 flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>[F2] جديد</span>
          </button>
        )}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-800 flex items-center gap-1 shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-blue-700" />
            <span>[F3] حفظ</span>
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-800 flex items-center gap-1 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-700" />
            <span>[F4] حذف</span>
          </button>
        )}
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-800 flex items-center gap-1 shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-amber-700" />
            <span>[F5] بحث</span>
          </button>
        )}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-800 flex items-center gap-1 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-purple-700" />
            <span>[F6] طباعة</span>
          </button>
        )}

        <div className="mr-auto flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-slate-700 flex items-center gap-1 shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>[Esc] رجوع للرئيسية</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Window Content (DataWindows & Controls) */}
      <div className="p-3 bg-slate-100 overflow-y-auto overflow-x-auto max-h-[calc(100vh-170px)]">
        {children}
      </div>

      {/* 4. PowerBuilder Window Status Line */}
      <div className="bg-slate-200 border-t border-slate-300 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-slate-700">
        <span>{statusInfo}</span>
        <span className="font-bold text-slate-500">PowerBuilder 12.5 Classic Runtime</span>
      </div>
    </div>
  );
};
