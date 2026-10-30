import React, { useState } from 'react';
import { wholesaleStore } from '../services/storage';
import { PackRahn } from '../types/schema';
import { Printer, Minus, Square, X } from 'lucide-react';

interface PackageRahnWindowProps {
  onClose?: () => void;
}

export const PackageRahnWindow: React.FC<PackageRahnWindowProps> = ({ onClose }) => {
  const db = wholesaleStore.getState();

  // جلب بيانات رهن الفوارغ، مع التأكد من وجود أصناف الشاشة (شبك 0، كبيرة 100، وسط 80، صغيرة 60)
  const defaultPackList: PackRahn[] = [
    { id: 1, pack_name: 'شبك', pack_rahn: 0 },
    { id: 2, pack_name: 'برنيكة كبيرة', pack_rahn: 100 },
    { id: 3, pack_name: 'برنيكة وسط', pack_rahn: 80 },
    { id: 4, pack_name: 'برنيكة صغيرة', pack_rahn: 60 },
    { id: 5, pack_name: 'كبير', pack_rahn: 100 },
    { id: 6, pack_name: 'متوسط', pack_rahn: 80 },
    { id: 7, pack_name: 'صغير', pack_rahn: 60 }
  ];
  const initialPackRahns: PackRahn[] = db.pack_rahns.length > 0 ? db.pack_rahns : defaultPackList;

  const [packRahns, setPackRahns] = useState<PackRahn[]>(initialPackRahns);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('جاهز (Ready)');

  // إضافة سطر رهن عبوة جديد (+)
  const handleAddRow = () => {
    const nextId = (packRahns.reduce((max, r) => Math.max(max, r.id || 0), 0) || 0) + 1;
    const newRow: PackRahn = {
      id: nextId,
      pack_name: '',
      pack_rahn: 0
    };
    setPackRahns(prev => [...prev, newRow]);
    setSelectedIdx(packRahns.length);
    setStatusMessage('تمت إضافة سطر رهن جديد');
  };

  // حذف سطر الرهن المحدد (-)
  const handleRemoveRow = () => {
    if (packRahns.length > 0 && selectedIdx >= 0 && selectedIdx < packRahns.length) {
      const removedName = packRahns[selectedIdx].pack_name;
      setPackRahns(prev => prev.filter((_, idx) => idx !== selectedIdx));
      setSelectedIdx(Math.max(0, selectedIdx - 1));
      setStatusMessage(`تم حذف عبوة (${removedName || 'السطر'})`);
    }
  };

  // تعديل الحقول
  const handleFieldChange = (index: number, field: keyof PackRahn, value: any) => {
    setPackRahns(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // حفظ التعديلات في قاعدة البيانات
  const handleSave = () => {
    try {
      const curState = wholesaleStore.getState();
      wholesaleStore.importJson(
        JSON.stringify({
          ...curState,
          pack_rahns: packRahns.map((r, i) => ({
            id: r.id || i + 1,
            pack_name: r.pack_name.trim() || `عبوة ${i + 1}`,
            pack_rahn: Number(r.pack_rahn) || 0
          }))
        })
      );
      setStatusMessage(`تم حفظ تسجيل الرهن (${packRahns.length} عبوة) بنجاح`);
      setTimeout(() => setStatusMessage('جاهز (Ready)'), 4000);
    } catch (e: any) {
      setStatusMessage(`خطأ في الحفظ: ${e?.message || 'تعذر الحفظ'}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-start items-center p-3 bg-[#8c949d] select-none font-sans overflow-auto" dir="rtl">
      
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[700px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto">
        
        {/* 1. شريط عنوان النافذة (Window Title Bar): أزرار التحكم على اليمين والعنوان على اليسار مطابق لشاشة الزبائن */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* أزرار التحكم بالنافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-[#d4d0c8] hover:bg-rose-500 hover:text-white border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 active:border-t-[#808080] active:border-l-[#808080]"
                title="إغلاق"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            <button
              type="button"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
              title="تكبير"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          {/* أيقونة واسم النافذة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">تسجيل الرهن</span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">10-2</span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة (Window Body): الأزرار على اليمين والجدول على اليسار مطابق لشاشة الزبائن */}
        <div className="p-4 bg-[#d4d0c8] flex items-start gap-4">
          
          {/* الأزرار العمودية الخارجية على اليمين */}
          <div className="flex flex-col gap-2 pt-2 shrink-0">
            {/* زر إضافة (+) */}
            <button
              type="button"
              onClick={handleAddRow}
              title="إضافة رهن عبوة جديد (+)"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              +
            </button>

            {/* زر حذف (-) */}
            <button
              type="button"
              onClick={handleRemoveRow}
              title="حذف الرهن المحدد (-)"
              className="w-14 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] active:bg-[#f4a8a8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              -
            </button>

            {/* زر حفظ الأخضر الفاتح */}
            <button
              type="button"
              onClick={handleSave}
              title="حفظ بيانات الرهن"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-[13px] font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              حفظ
            </button>

            {/* زر الطباعة المخصص مع أيقونة الطابعة الكبيرة */}
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              title="طباعة قائمة الرهونات"
              className="w-14 h-11 bg-white hover:bg-slate-50 active:bg-slate-200 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 mt-1 active:border-t-[#404040] active:border-l-[#404040]"
            >
              <Printer className="w-7 h-7 text-slate-800" />
              <span className="text-[7.5px] font-bold text-slate-700 mt-0.5">طباعة</span>
            </button>

            {/* زر خروج */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-14 h-7 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-slate-300 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow mt-2 active:border-t-[#404040] active:border-l-[#404040]"
              >
                خروج
              </button>
            )}
          </div>

          {/* إطار GroupBox تسجيل الرهن (على اليسار) */}
          <div className="flex-1 relative border border-slate-500 pt-3 pb-2 px-2 bg-[#d4d0c8]">
            <span className="absolute -top-2.5 right-3 bg-[#d4d0c8] px-1.5 text-xs text-slate-700 font-bold">
              تسجيل الرهن
            </span>

            {/* جدول البيانات DataWindow */}
            <div className="border border-slate-600 bg-white overflow-hidden">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold select-none">
                    <th className="border-l border-slate-400 py-1.5 px-2 w-20">الكود</th>
                    <th className="border-l border-slate-400 py-1.5 px-3 text-center">اسم العبوة</th>
                    <th className="py-1.5 px-2 w-24">الرهن</th>
                  </tr>
                </thead>
                <tbody>
                  {packRahns.map((rahn, idx) => {
                    const isSelected = selectedIdx === idx;
                    return (
                      <tr
                        key={`pack_rahn_${rahn.id || idx}_${idx}`}
                        onClick={() => setSelectedIdx(idx)}
                        className={`cursor-pointer border-b border-slate-200 ${
                          isSelected ? 'bg-blue-50 font-bold' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {/* الكود */}
                        <td className="border-l border-slate-300 py-1 px-2 font-mono text-slate-900">
                          {rahn.id || idx + 1}
                        </td>

                        {/* اسم العبوة */}
                        <td className="border-l border-slate-300 py-1 px-2 text-center">
                          <input
                            type="text"
                            value={rahn.pack_name}
                            onChange={e => handleFieldChange(idx, 'pack_name', e.target.value)}
                            className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                          />
                        </td>

                        {/* الرهن */}
                        <td className="py-1 px-2 text-center">
                          <input
                            type="number"
                            value={rahn.pack_rahn !== undefined ? rahn.pack_rahn : ''}
                            onChange={e => handleFieldChange(idx, 'pack_rahn', Number(e.target.value))}
                            className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* صفوف فارغة للتعبئة البصرية المطابقة لشاشة الباور بيلدر */}
                  {Array.from({ length: Math.max(0, 5 - packRahns.length) }).map((_, i) => (
                    <tr key={`empty-rahn-${i}`} className="h-6 border-b border-slate-200">
                      <td className="border-l border-slate-300"></td>
                      <td className="border-l border-slate-300"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>



        </div>

        {/* 3. شريط الحالة السفلي (Status Bar) */}
        <div className="bg-[#cfd5dc] border-t border-slate-400 px-3 py-1 flex items-center justify-between text-xs text-slate-700">
          <span className="font-mono">{statusMessage}</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span>إجمالي أنواع العبوات: <strong>{packRahns.length}</strong></span>
          </div>
        </div>

      </div>

      {/* نافذة معاينة الطباعة */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full border-4 border-slate-700 shadow-2xl p-4 text-slate-900" dir="rtl">
            <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
              <h2 className="text-lg font-black">{db.company.branch || 'محل 67 - سوق الجملة'}</h2>
              <h3 className="text-sm font-bold text-slate-700">بيان أسعار رهن وأمانات العبوات الفارغة</h3>
              <p className="text-xs text-slate-500 font-mono">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <div className="mb-4">
              <table className="w-full text-xs text-center border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-1 border border-slate-300">الكود</th>
                    <th className="p-1 border border-slate-300">اسم العبوة</th>
                    <th className="p-1 border border-slate-300">سعر الرهن (ج.م)</th>
                  </tr>
                </thead>
                <tbody>
                  {packRahns.map((r, idx) => (
                    <tr key={`pack_rahn_print_${r.id || idx}_${idx}`}>
                      <td className="p-1 border border-slate-300 font-mono">{r.id || idx + 1}</td>
                      <td className="p-1 border border-slate-300 font-bold">{r.pack_name}</td>
                      <td className="p-1 border border-slate-300 font-mono font-bold text-emerald-800">{r.pack_rahn} ج.م</td>
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
