import React, { useState, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import { Printer, Minus, Square, X, Calendar } from 'lucide-react';

interface NaklaWindowProps {
  onClose?: () => void;
  onOpenSaleForNakla?: (naklaId: number) => void;
  onOpenSettleForNakla?: (naklaId: number) => void;
}

interface ItemRow {
  package_unit: string;
  cat_name: string;
  cat_number: number;
  pack_rahn: number;
}

interface ExpRow {
  exp_name: string;
  exp_amount: number;
  exp_date: string;
}

export const NaklaWindow: React.FC<NaklaWindowProps> = ({
  onClose,
  onOpenSaleForNakla,
  onOpenSettleForNakla
}) => {
  const db = wholesaleStore.getState();

  const [suppliers, setSuppliers] = useState(wholesaleStore.getState().suppliers || []);
  const [farms, setFarms] = useState(wholesaleStore.getState().farms || []);

  useEffect(() => {
    const unsub = wholesaleStore.subscribe(() => {
      setSuppliers(wholesaleStore.getState().suppliers || []);
      setFarms(wholesaleStore.getState().farms || []);
    });
    return () => unsub();
  }, []);

  const initialSup = suppliers[0];
  const initialFarm = farms.find(f => f.sup_name === initialSup?.sup_name) || farms[0];
  const nextNaklaNo = (db.naklat || []).reduce((max, n) => Math.max(max, n.nakla_number || 0), 0) + 1;
  const initialComm = initialSup?.comission !== undefined ? initialSup.comission : 0.1;

  // الحالة الرئيسية
  const [supName, setSupName] = useState(initialSup?.sup_name || '');
  const [farmName, setFarmName] = useState(initialFarm?.farm_name || '');
  const [naklaNumber, setNaklaNumber] = useState<number>(nextNaklaNo);
  const [naklaDate, setNaklaDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [comission, setComission] = useState<number>(initialComm);
  const [wahba, setWahba] = useState<number>(50);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [selectedExpIdx, setSelectedExpIdx] = useState<number>(0);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('جاهز (Ready)');

  // جدول الأصناف (يبدأ فارغاً أو بصف جديد نظيف)
  const [items, setItems] = useState<ItemRow[]>([]);

  // جدول مصروفات النقلة (يبدأ فارغاً بدون أرقام وهمية)
  const [expenses, setExpenses] = useState<ExpRow[]>([]);

  // اسم النقلة المحسوب: ابراهيم هلال 3
  const naklaName = `${supName} ${naklaNumber}`;

  // حساب إجمالي عدد المستلم
  const totalReceived = items.reduce((sum, item) => sum + (Number(item.cat_number) || 0), 0);

  // تحديث المورد
  const handleSupplierChange = (name: string) => {
    setSupName(name);
    const supFarms = db.farms.filter(f => f.sup_name === name);
    if (supFarms.length > 0) {
      setFarmName(supFarms[0].farm_name);
    } else {
      setFarmName(name);
    }
    const supObj = db.suppliers.find(s => s.sup_name === name);
    if (supObj?.comission) {
      setComission(supObj.comission);
    }
  };

  // جلب قيمة الرهن التلقائي من تسجيل الرهن
  const getPackRahnValue = (pkgName: string): number => {
    const found = db.pack_rahns.find(p => p.pack_name.trim() === pkgName.trim());
    if (found && found.pack_rahn !== undefined) return Number(found.pack_rahn) || 0;
    if (pkgName.includes('كبير')) return 100;
    if (pkgName.includes('وسط') || pkgName.includes('متوسط')) return 80;
    if (pkgName.includes('صغير')) return 60;
    if (pkgName.includes('شبك')) return 0;
    return 0;
  };

  // التحكم بجدول الأصناف
  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        package_unit: 'شبك',
        cat_name: '',
        cat_number: 0,
        pack_rahn: 0
      }
    ]);
    setSelectedItemIdx(items.length);
  };

  const removeItemRow = () => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
      setSelectedItemIdx(Math.max(0, selectedItemIdx - 1));
    }
  };

  const handlePackageChange = (index: number, newPkg: string) => {
    const autoRahn = getPackRahnValue(newPkg);
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        package_unit: newPkg,
        pack_rahn: autoRahn
      };
      return next;
    });
  };

  const updateItem = (index: number, field: keyof ItemRow, val: any) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // التحكم بجدول المصروفات
  const addExpenseRow = () => {
    setExpenses(prev => [
      ...prev,
      {
        exp_name: 'نولون',
        exp_amount: 0,
        exp_date: '11/10/2026'
      }
    ]);
    setSelectedExpIdx(expenses.length);
  };

  const removeExpenseRow = () => {
    if (expenses.length > 1) {
      setExpenses(prev => prev.filter((_, idx) => idx !== selectedExpIdx));
      setSelectedExpIdx(Math.max(0, selectedExpIdx - 1));
    }
  };

  const updateExpense = (index: number, field: keyof ExpRow, val: any) => {
    setExpenses(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // حفظ النقلة في قاعدة البيانات
  const handleSave = () => {
    try {
      const finalNaklaDate = naklaDate.replace(/\//g, '-');
      wholesaleStore.addNakla(
        {
          nakla_number: Number(naklaNumber),
          sup_name: supName,
          farm_name: farmName,
          nakla_name: naklaName,
          nakla_weight: totalReceived * 20, // تقديري للوزن
          sobata_number: totalReceived,
          nakla_date: finalNaklaDate,
          comission: Number(comission),
          byaaa: 0.02,
          tanzil: 150,
          wahba: Number(wahba),
          driver_name: '',
          truck_plate: '',
          nakla_finish: false,
          nakla_sarf: false,
          printed: false
        },
        items.map(it => {
          const cat = db.categories.find(c => c.cat_name === it.cat_name);
          const packObj = db.pack_rahns.find(p => p.pack_name === it.package_unit);
          return {
            cat_id: cat?.id || cat?.cat_code || 1,
            cat_name: it.cat_name || 'صنف',
            cat_number: Number(it.cat_number) || 0,
            cat_weight: (Number(it.cat_number) || 0) * 20,
            cat_byaaa: cat?.byaaa !== undefined ? cat.byaaa : 10,
            cat_byaaa_s: cat?.byaaa_s !== undefined ? cat.byaaa_s : 8.5,
            pack_id: packObj?.id || 1,
            package_unit: it.package_unit,
            pack_rahn: it.pack_rahn !== undefined ? Number(it.pack_rahn) : (packObj?.pack_rahn || 0)
          };
        }),
        expenses.map(ex => ({
          exp_name: ex.exp_name,
          exp_amount: Number(ex.exp_amount),
          exp_date: finalNaklaDate
        })),
        0
      );

      setStatusMessage(`تم حفظ النقلة (${naklaName}) بنجاح برقم ${naklaNumber}`);
      setTimeout(() => setStatusMessage('جاهز (Ready)'), 4000);
    } catch (err: any) {
      setStatusMessage(`خطأ في الحفظ: ${err?.message || 'تعذر حفظ البيانات'}`);
    }
  };

  const handleNewNakla = () => {
    setNaklaNumber(prev => prev + 1);
    setItems([{ package_unit: 'شبك', cat_name: '', cat_number: 0, pack_rahn: 0 }]);
    setExpenses([{ exp_name: 'وهبة', exp_amount: 50, exp_date: '11/10/2026' }]);
    setStatusMessage('تم تجهيز نقلة جديدة');
  };

  return (
    <div className="w-full min-h-[calc(100vh-130px)] flex flex-col justify-start items-center p-2 bg-[#8c949d] select-none font-sans overflow-x-auto overflow-y-auto" dir="rtl">
      {/* نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[1240px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col">
        
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

          {/* أيقونة واسم النافذة والكود على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">تسجيل النقلات</span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">[3-1]</span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة (Window Body) */}
        <div className="p-4 flex flex-col gap-3 bg-[#9fa6ad]">

          {/* الجزء العلوي: التاريخ، زري العرض الزرقاويين، اسم النقلة، وقائمتي المورد والمزرعة */}
          <div className="flex items-start justify-between gap-4">
            
            {/* في أقصى اليمين: حقل المورد والمزرعة */}
            <div className="flex flex-col gap-2 w-56">
              {/* المورد */}
              <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5">
                <div className="text-[11px] font-bold text-center text-slate-900 border-b border-slate-400 bg-[#c2c8cf] py-0.5">
                  المورد
                </div>
                <select
                  value={supName}
                  onChange={e => handleSupplierChange(e.target.value)}
                  className="bg-white border border-slate-600 text-xs font-bold text-slate-900 px-1 py-0.5 outline-none cursor-pointer"
                >
                  {db.suppliers.map((s, idx) => (
                    <option key={`nakla_sup_${s.sup_id}_${idx}`} value={s.sup_name}>
                      {s.sup_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* المزرعة */}
              <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5">
                <div className="text-[11px] font-bold text-center text-slate-900 border-b border-slate-400 bg-[#c2c8cf] py-0.5">
                  المزرعة
                </div>
                <select
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  className="bg-white border border-slate-600 text-xs font-bold text-slate-900 px-1 py-0.5 outline-none cursor-pointer"
                >
                  {db.farms
                    .filter(f => f.sup_name === supName || !f.sup_name)
                    .concat(
                      !db.farms.some(f => f.farm_name === farmName)
                        ? [{ farm_id: 999, sup_name: supName, farm_name: farmName, hold: false }]
                        : []
                    )
                    .map((f, idx) => (
                      <option key={`nakla_farm_${f.farm_id}_${idx}`} value={f.farm_name}>
                        {f.farm_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* في المنتصف: الزران البتروليان + مربع اسم النقلة النعناعي العريض */}
            <div className="flex-1 flex flex-col items-center gap-2 max-w-xl">
              {/* الصندوقان البتروليان العلويان */}
              <div className="flex items-center justify-center gap-2 w-full">
                <div className="flex-1 bg-[#008080] border-2 border-t-[#00a8a8] border-l-[#00a8a8] border-b-[#004d4d] border-r-[#004d4d] text-slate-950 font-bold text-sm py-1.5 px-3 text-center shadow-inner">
                  {supName}
                </div>
                <div className="flex-1 bg-[#008080] border-2 border-t-[#00a8a8] border-l-[#00a8a8] border-b-[#004d4d] border-r-[#004d4d] text-slate-950 font-bold text-sm py-1.5 px-3 text-center shadow-inner">
                  {farmName}
                </div>
              </div>

              {/* الصندوق الأخضر الفاتح العريض جداً (اسم النقلة مثل ابراهيم هلال 3) */}
              <div className="w-full bg-[#c5ecd0] border-2 border-t-[#506055] border-l-[#506055] border-b-[#ffffff] border-r-[#ffffff] py-2 px-4 text-center">
                <span className="text-2xl font-black text-slate-950 tracking-wider">
                  {naklaName}
                </span>
              </div>
            </div>

            {/* في أقصى اليسار: حقل التاريخ الكلاسيكي */}
            <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-1 shadow-inner">
              <input
                type="text"
                value={naklaDate}
                onChange={e => setNaklaDate(e.target.value)}
                className="w-24 text-center font-bold text-sm text-slate-900 outline-none"
              />
              <div className="flex flex-col border-r border-slate-400 mr-1 pr-1 text-[8px] text-slate-600">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setNaklaDate(d.toISOString().split('T')[0].replace(/-/g, '/'));
                  }}
                  className="hover:text-black leading-none"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    setNaklaDate(d.toISOString().split('T')[0].replace(/-/g, '/'));
                  }}
                  className="hover:text-black leading-none"
                >
                  ▼
                </button>
              </div>
            </div>

          </div>

          {/* الجزء الأوسط: إطار جدول النقلة الرئيسي وبجانبه أزرار الإضافة والحفظ على اليمين */}
          <div className="flex items-start gap-2">
            {/* الأزرار على يمين جدول النقلة: زر + وزر حفظ */}
            <div className="flex flex-col gap-2 pt-2 shrink-0">
              <button
                type="button"
                onClick={handleNewNakla}
                title="نقلة جديدة (+)"
                className="w-9 h-8 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-base font-bold text-slate-900 flex items-center justify-center hover:bg-[#d9e0e7] active:border-slate-800 cursor-pointer shadow-xs"
              >
                +
              </button>

              <button
                type="button"
                onClick={handleSave}
                title="حفظ النقلة"
                className="w-14 h-8 bg-[#d8ecd8] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-xs font-bold text-slate-950 flex items-center justify-center hover:bg-[#c9e6c9] active:border-slate-800 cursor-pointer shadow-xs"
              >
                حفظ
              </button>
            </div>

            {/* إطار GroupBox النقلة (على اليسار) */}
            <div className="flex-1 relative border border-slate-500 pt-3 pb-1 px-1 bg-[#9fa6ad]">
              <span className="absolute -top-2.5 right-3 bg-[#9fa6ad] px-1.5 text-xs text-slate-700 font-bold">
                النقلة
              </span>

              {/* جدول النقلة (DataWindow) */}
              <div className="border border-slate-600 bg-white overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold">
                      <th className="border-l border-slate-400 py-1 px-1 w-12">اليومية</th>
                      <th className="border-l border-slate-400 py-1 px-1 w-10">رقم</th>
                      <th className="border-l border-slate-400 py-1 px-2 w-28">المورد</th>
                      <th className="border-l border-slate-400 py-1 px-2 w-28">المزرعة</th>
                      <th className="border-l border-slate-400 py-1 px-2 w-32">النقلة</th>
                      <th className="border-l border-slate-400 py-1 px-2 w-20">عدد مستلم</th>
                      <th className="border-l border-slate-400 py-1 px-2 w-24">التاريخ</th>
                      <th className="border-l border-slate-400 py-1 px-1 w-14">عمولة</th>
                      <th className="py-1 px-1 w-14">وهبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#008080] text-slate-950 font-bold">
                      <td className="border-l border-teal-600 py-1 px-1">
                        <input type="checkbox" className="w-3.5 h-3.5 cursor-pointer" />
                      </td>
                      <td className="border-l border-teal-600 py-1 px-1">
                        <input
                          type="number"
                          value={naklaNumber}
                          onChange={e => setNaklaNumber(Number(e.target.value) || 1)}
                          className="w-10 bg-transparent text-center font-bold outline-none text-slate-950"
                        />
                      </td>
                      <td className="border-l border-teal-600 py-1 px-2 truncate">
                        {supName}
                      </td>
                      <td className="border-l border-teal-600 py-1 px-2 truncate">
                        {farmName}
                      </td>
                      <td className="border-l border-teal-600 py-1 px-2 truncate font-black">
                        {naklaName}
                      </td>
                      <td className="border-l border-teal-600 py-1 px-2">
                        {totalReceived > 0 ? totalReceived : '0'}
                      </td>
                      <td className="border-l border-teal-600 py-1 px-1 text-center font-mono">
                        <span>11/10/2026</span>
                      </td>
                      <td className="border-l border-teal-600 py-1 px-1">
                        <input
                          type="number"
                          step="0.01"
                          value={comission}
                          onChange={e => setComission(Number(e.target.value))}
                          className="w-12 bg-transparent text-center font-bold outline-none text-slate-950"
                        />
                      </td>
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          value={wahba}
                          onChange={e => setWahba(Number(e.target.value))}
                          className="w-12 bg-transparent text-center font-bold outline-none text-slate-950"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* الجزء السفلي: صندوق أصناف وصندوق مصروفات النقلة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

            {/* صندوق مصروفات النقلة */}
            <div className="flex items-start gap-2">
              {/* أزرار مصروفات النقلة على اليمين (+ ، - ، زر الطابعة) */}
              <div className="flex flex-col gap-1.5 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={addExpenseRow}
                  title="إضافة مصروف (+)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-sm font-bold text-slate-900 flex items-center justify-center hover:bg-[#d9e0e7] active:border-slate-800 cursor-pointer shadow-xs"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={removeExpenseRow}
                  title="حذف مصروف (-)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-sm font-bold text-slate-900 flex items-center justify-center hover:bg-[#d9e0e7] active:border-slate-800 cursor-pointer shadow-xs"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  title="طباعة بيان النقلة"
                  className="w-11 h-9 bg-white border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center hover:bg-slate-100 active:border-slate-800 cursor-pointer shadow-xs mt-2 p-1"
                >
                  <Printer className="w-6 h-6 text-slate-800" />
                </button>
              </div>

              {/* جدول مصروفات النقلة على اليسار */}
              <div className="flex-1 relative border border-slate-500 pt-3 pb-1 px-1 bg-[#9fa6ad]">
                <span className="absolute -top-2.5 right-3 bg-[#9fa6ad] px-1.5 text-xs text-slate-700 font-bold">
                  مصروفات النقلة
                </span>

                <div className="border border-slate-600 bg-white">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold">
                        <th className="border-l border-slate-400 py-1 px-2">النقلة</th>
                        <th className="border-l border-slate-400 py-1 px-2">المصروف</th>
                        <th className="border-l border-slate-400 py-1 px-2">المبلغ</th>
                        <th className="py-1 px-2">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedExpIdx(idx)}
                          className={`cursor-pointer ${
                            selectedExpIdx === idx ? 'bg-blue-100 text-slate-950 font-bold' : 'bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="border-l border-slate-300 py-1 px-2 font-bold text-slate-900">
                            {naklaName}
                          </td>
                          <td className="border-l border-slate-300 py-0.5 px-1">
                            <input
                              type="text"
                              value={exp.exp_name}
                              onChange={e => updateExpense(idx, 'exp_name', e.target.value)}
                              className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>
                          <td className="border-l border-slate-300 py-0.5 px-1">
                            <input
                              type="number"
                              value={exp.exp_amount || ''}
                              onChange={e => updateExpense(idx, 'exp_amount', Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>
                          <td className="py-1 px-1 text-center font-mono">
                            <span>{exp.exp_date}</span>
                          </td>
                        </tr>
                      ))}

                      {/* صفوف فارغة للتعبئة البصرية المطابقة للباور بيلدر */}
                      {Array.from({ length: Math.max(0, 5 - expenses.length) }).map((_, i) => (
                        <tr key={`empty-exp-${i}`} className="bg-[#9baab8]/60 h-6 border-t border-slate-200">
                          <td className="border-l border-slate-300"></td>
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

            {/* صندوق اصناف */}
            <div className="flex items-start gap-2">
              {/* أزرار الأصناف على اليمين (+ ، -) */}
              <div className="flex flex-col gap-1.5 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={addItemRow}
                  title="إضافة صنف (+)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-sm font-bold text-slate-900 flex items-center justify-center hover:bg-[#d9e0e7] active:border-slate-800 cursor-pointer shadow-xs"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={removeItemRow}
                  title="حذف صنف (-)"
                  className="w-8 h-7 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 text-sm font-bold text-slate-900 flex items-center justify-center hover:bg-[#d9e0e7] active:border-slate-800 cursor-pointer shadow-xs"
                >
                  -
                </button>
              </div>

              {/* جدول الأصناف على اليسار */}
              <div className="flex-1 relative border border-slate-500 pt-3 pb-1 px-1 bg-[#9fa6ad]">
                <span className="absolute -top-2.5 right-3 bg-[#9fa6ad] px-1.5 text-xs text-slate-700 font-bold">
                  اصناف
                </span>

                <div className="border border-slate-600 bg-white">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#b4cbe5] border-b border-slate-600 text-slate-900 font-bold">
                        <th className="border-l border-slate-400 py-1 px-1.5 w-32">العبوة (تسجيل الرهن)</th>
                        <th className="border-l border-slate-400 py-1 px-1 w-16">الرهن</th>
                        <th className="border-l border-slate-400 py-1 px-2">الصنف</th>
                        <th className="py-1 px-2 w-20">عدد مستلم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedItemIdx(idx)}
                          className={`cursor-pointer ${
                            selectedItemIdx === idx ? 'bg-blue-100 font-bold' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <td className="border-l border-slate-300 py-0.5 px-1">
                            <select
                              value={it.package_unit}
                              onChange={e => handlePackageChange(idx, e.target.value)}
                              className="w-full bg-white border border-slate-400 text-xs font-bold text-slate-900 px-1 py-0.5 outline-none"
                              title="اختر اسم العبوة من قائمة تسجيل الرهن"
                            >
                              {db.pack_rahns.map((p, pIdx) => (
                                <option key={`nakla_pack_opt_${p.id || p.pack_name}_${pIdx}`} value={p.pack_name}>
                                  {p.pack_name} (رهن: {p.pack_rahn})
                                </option>
                              ))}
                              {!db.pack_rahns.some(p => p.pack_name === it.package_unit) && (
                                <option value={it.package_unit}>{it.package_unit}</option>
                              )}
                            </select>
                          </td>
                          <td className="border-l border-slate-300 py-0.5 px-1 w-16">
                            <input
                              type="number"
                              value={it.pack_rahn !== undefined ? it.pack_rahn : 0}
                              onChange={e => updateItem(idx, 'pack_rahn', Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                              title="قيمة رهن العبوة الواحدة (تؤخذ تلقائياً من تسجيل الرهن، ويمكنك تعديلها)"
                            />
                          </td>
                          <td className="border-l border-slate-300 py-0.5 px-1">
                            <input
                              type="text"
                              value={it.cat_name}
                              placeholder="اسم الصنف..."
                              onChange={e => updateItem(idx, 'cat_name', e.target.value)}
                              className="w-full text-right px-1.5 bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>
                          <td className="py-0.5 px-1">
                            <input
                              type="number"
                              value={it.cat_number || ''}
                              placeholder="0"
                              onChange={e => updateItem(idx, 'cat_number', Number(e.target.value))}
                              className="w-full text-center bg-transparent outline-none font-bold text-slate-900"
                            />
                          </td>
                        </tr>
                      ))}

                      {/* صفوف فارغة للتعبئة البصرية المطابقة للباور بيلدر */}
                      {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                        <tr key={`empty-it-${i}`} className="bg-[#9baab8]/60 h-6 border-t border-slate-200">
                          <td className="border-l border-slate-300"></td>
                          <td className="border-l border-slate-300"></td>
                          <td className="border-l border-slate-300"></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* شريط الإجمالي أسفل جدول الأصناف */}
                <div className="flex items-center justify-start gap-2 mt-2 px-1">
                  <span className="text-xs font-bold text-slate-900">اجمالي</span>
                  <div className="bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-3 py-0.5 text-center font-bold text-xs min-w-16 shadow-inner text-slate-950">
                    {totalReceived}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 3. شريط الحالة السفلي الكلاسيكي (Status Bar) */}
        <div className="bg-[#cfd5dc] border-t border-slate-400 px-3 py-1 flex items-center justify-between text-xs text-slate-700">
          <span className="font-mono">{statusMessage}</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span>إجمالي العبوات: <strong>{totalReceived}</strong></span>
            <span>المصروفات: <strong>{expenses.reduce((s, e) => s + (Number(e.exp_amount) || 0), 0)} ج.م</strong></span>
          </div>
        </div>

      </div>

      {/* نافذة معاينة الطباعة عند الضغط على الطابعة */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full border-4 border-slate-700 shadow-2xl p-4 text-slate-900" dir="rtl">
            <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
              <h2 className="text-lg font-black">{db.company.branch || 'محل 67 - سوق الجملة'}</h2>
              <h3 className="text-sm font-bold text-slate-700">إذن استلام شحنة / بيان نقلة</h3>
              <p className="text-xs text-slate-500 font-mono">رقم النقلة: {naklaNumber} | التاريخ: {naklaDate}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2 border border-slate-300">
              <div>المورد: <strong>{supName}</strong></div>
              <div>المزرعة: <strong>{farmName}</strong></div>
              <div>اسم النقلة: <strong>{naklaName}</strong></div>
              <div>إجمالي العبوات: <strong>{totalReceived} عبوة</strong></div>
            </div>

            <div className="mb-3">
              <h4 className="text-xs font-bold border-b border-slate-300 mb-1">الأصناف الواردة:</h4>
              <table className="w-full text-xs text-center border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-1 border border-slate-300">العبوة</th>
                    <th className="p-1 border border-slate-300">الصنف</th>
                    <th className="p-1 border border-slate-300">العدد المستلم</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300">{it.package_unit}</td>
                      <td className="p-1 border border-slate-300 font-bold">{it.cat_name || '—'}</td>
                      <td className="p-1 border border-slate-300 font-mono">{it.cat_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold border-b border-slate-300 mb-1">مصروفات النقلة:</h4>
              <table className="w-full text-xs text-center border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-1 border border-slate-300">المصروف</th>
                    <th className="p-1 border border-slate-300">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((ex, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300">{ex.exp_name}</td>
                      <td className="p-1 border border-slate-300 font-mono font-bold">{ex.exp_amount} ج.م</td>
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
