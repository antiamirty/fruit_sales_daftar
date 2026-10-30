import React, { useState, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import { Printer, Minus, Square, X } from 'lucide-react';

interface KhaznaWindowProps {
  mode?: 'w_takfeel' | 'w_rep_khazna' | string;
  onClose?: () => void;
}

export const KhaznaWindow: React.FC<KhaznaWindowProps> = ({
  mode = 'w_takfeel',
  onClose
}) => {
  const [db, setDb] = useState(wholesaleStore.getState());
  const [activeMode, setActiveMode] = useState<'w_takfeel' | 'w_rep_khazna'>(
    mode === 'w_rep_khazna' ? 'w_rep_khazna' : 'w_takfeel'
  );

  useEffect(() => {
    if (mode === 'w_rep_khazna') {
      setActiveMode('w_rep_khazna');
    } else {
      setActiveMode('w_takfeel');
    }
  }, [mode]);

  useEffect(() => {
    return wholesaleStore.subscribe(() => {
      setDb(wholesaleStore.getState());
    });
  }, []);

  // التاريخ المحدد
  const [selectedDate, setSelectedDate] = useState<string>('2026/10/14');
  const [paperDate, setPaperDate] = useState<string>('14/10/2026');

  // تحديث صيغة التاريخ
  const handleDateSpin = (deltaDays: number) => {
    const parts = selectedDate.split('/');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + deltaDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}/${mm}/${dd}`);
    setPaperDate(`${dd}/${mm}/${yyyy}`);
  };

  // --- حسابات 8-1: التقفيل اليومي للبيع عن يوم (الصورة 1) ---
  // حساب المبيعات من الفواتير الحقيقية إن وجدت
  const calculatedSalesToday = db.fatora_f.reduce((sum, f) => sum + (f.totally || 0), 0) || 54200;
  const calculatedZemamToday = db.fatora_f.filter(f => !f.cash).reduce((sum, f) => sum + (f.totally || 0), 0) || 32000;
  
  const [salesToday, setSalesToday] = useState<number>(calculatedSalesToday);
  const [zemamToday, setZemamToday] = useState<number>(calculatedZemamToday);
  const [tahseelToday, setTahseelToday] = useState<number>(0);
  const [samahTahseelToday, setSamahTahseelToday] = useState<number>(0);
  const [expensesToday, setExpensesToday] = useState<number>(0);
  const [netRahnRefundToday, setNetRahnRefundToday] = useState<number>(0);
  const [includeByaaa, setIncludeByaaa] = useState<boolean>(false);

  // المعادلات المحسوبة آلياً:
  // 1. صافي النقدية = مبيعات اليوم - زمام اليوم
  const netCashSales = Math.max(0, salesToday - zemamToday);

  // 2. اجمالي النقدية = صافي النقدية + تحصيل اليوم - سماح التحصيل
  const totalCashCollected = netCashSales + tahseelToday - samahTahseelToday;

  // 3. صافي النقدية المرحلة للخزنة = اجمالي النقدية - مصاريف اليوم - صافي صرف الرهن
  const netCashToKhazna = totalCashCollected - expensesToday - netRahnRefundToday;

  // المؤشرات المالية (Financial Indicators):
  // معدل الزمام = (زمام اليوم / مبيعات اليوم) * 100
  const rateZemam = salesToday > 0 ? ((zemamToday / salesToday) * 100).toFixed(1) + '%' : '0%';
  // معدل النقدية = (صافي النقدية / مبيعات اليوم) * 100
  const rateCash = salesToday > 0 ? ((netCashSales / salesToday) * 100).toFixed(1) + '%' : '0%';
  // معدل التحصيل = (تحصيل اليوم / زمام اليوم) * 100
  const rateTahseel = zemamToday > 0 ? ((tahseelToday / zemamToday) * 100).toFixed(1) + '%' : '0%';
  // معدل اجمالي النقدية = (اجمالي النقدية / مبيعات اليوم) * 100
  const rateTotalCash = salesToday > 0 ? ((totalCashCollected / salesToday) * 100).toFixed(1) + '%' : '0%';

  // --- حسابات 8-2: تقرير الخزينة (الصورة 2) ---
  const [initialKhaznaBalance, setInitialKhaznaBalance] = useState<number>(185000);
  const [closingTransfer, setClosingTransfer] = useState<number>(netCashToKhazna);
  const [partnerDeposit, setPartnerDeposit] = useState<number>(0);
  const [supCashback, setSupCashback] = useState<number>(0);

  // المسحوبات والمصروفات باللون الأحمر:
  const [partnerWithdrawal, setPartnerWithdrawal] = useState<number>(0);
  const [supWithdrawal, setSupWithdrawal] = useState<number>(0);
  const [farmExpense, setFarmExpense] = useState<number>(0);
  const [salariesExpense, setSalariesExpense] = useState<number>(0);
  const [invoicesExpense, setInvoicesExpense] = useState<number>(0);
  const [receivedCashOut, setReceivedCashOut] = useState<number>(0);
  const [workersPayments, setWorkersPayments] = useState<number>(0);
  const [extraExpenses, setExtraExpenses] = useState<number>(0);
  const [boxesWithdrawals, setBoxesWithdrawals] = useState<number>(0);
  const [priceDiffExpense, setPriceDiffExpense] = useState<number>(0);

  // تحديث التقفيل المحول للخزنة تلقائياً
  useEffect(() => {
    setClosingTransfer(netCashToKhazna);
  }, [netCashToKhazna]);

  // إجمالي الإيداعات
  const totalInflows = (closingTransfer || 0) + partnerDeposit + supCashback;

  // إجمالي المسحوبات
  const totalOutflows =
    partnerWithdrawal +
    supWithdrawal +
    farmExpense +
    salariesExpense +
    invoicesExpense +
    receivedCashOut +
    workersPayments +
    extraExpenses +
    boxesWithdrawals +
    priceDiffExpense;

  // رصيد آخر المدة = رصيد أول المدة + الإيداعات - المسحوبات
  const finalKhaznaBalance = initialKhaznaBalance + totalInflows - totalOutflows;

  // أرصدة الرهن (من الصورتين)
  const rahnCashInKhazna = 4500;
  const rahnZemamCash = 1900;
  const rahnNakdiCash = 2600;
  const rahnZemam = 1900;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="w-full flex flex-col justify-start items-center p-2 bg-[#8c949d] select-none font-sans overflow-auto min-h-[calc(100vh-120px)]"
      dir="rtl"
    >
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[1300px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar): أزرار التحكم على اليمين والعنوان على اليسار مطابق لشاشة الزبائن والباور بيلدر الأصلي */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* أزرار التحكم في النافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onClose}
              title="إغلاق"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-rose-500 hover:text-white active:border-t-[#808080] active:border-l-[#808080]"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </button>
            <button
              type="button"
              title="تكبير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              type="button"
              title="تصغير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          {/* أيقونة باور بيلدر الدائرية واسم النافذة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">
              {activeMode === 'w_takfeel' ? 'التقفيل اليومي' : 'تقرير الخزينة'}
            </span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">
              {activeMode === 'w_takfeel' ? '8-1' : '8-2'}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* شريط التبديل السريع بين فورمي الخزينة 8-1 و 8-2 */}
        <div className="bg-[#b9c3cc] px-2 py-0.5 border-b border-[#7b838c] flex items-center gap-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveMode('w_takfeel')}
            className={`px-3 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors ${
              activeMode === 'w_takfeel'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            8-1 التقفيل اليومي للبيع عن يوم
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_khazna')}
            className={`px-3 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors ${
              activeMode === 'w_rep_khazna'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            8-2 تقرير الخزينة ورصيد الرهن
          </button>
        </div>

        {/* 2. جسم النافذة الرئيسي المطابق 100% للصورتين 1 و 2 */}
        {activeMode === 'w_takfeel' ? (
          /* --- شاشة 8-1: التقفيل اليومي للبيع عن يوم (الصورة 1) --- */
          <div className="p-4 bg-[#008080] min-h-[520px] flex flex-col justify-start relative overflow-auto">
            
            {/* خانة التاريخ */}
            <div className="flex items-center justify-start mb-3">
              <div className="flex items-center bg-white border-2 border-black shadow-inner px-2 py-0.5 text-xs font-mono font-bold">
                <input
                  type="text"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-24 text-center outline-none bg-transparent font-bold text-slate-900"
                />
              </div>
            </div>

            {/* مساحة ورقة التقرير البيضاء + زر الطابعة وخانة البياعة بجوارها */}
            <div className="flex items-start gap-4">
              
              {/* لوحة ورقة التقرير البيضاء المطابقة تماماً للصورة 1 */}
              <div className="w-[520px] max-w-full bg-white border border-slate-700 shadow-2xl p-4 flex flex-col gap-1 text-slate-900 text-xs font-bold">
                
                {/* ترويسة الورقة: التاريخ في الزاوية اليسرى والعنوان الأزرق في الوسط */}
                <div className="flex items-start justify-between mb-3 border-b border-slate-300 pb-2">
                  <div className="border border-slate-400 bg-slate-50 px-2 py-0.5 text-center font-mono text-[11px] text-slate-700">
                    {paperDate}
                  </div>
                  <h2 className="text-sm font-extrabold text-blue-900 flex-1 text-center pr-12">
                    تقرير بالتقفيل اليومي للبيع عن يوم
                  </h2>
                </div>

                {/* الحقول والأسطر الحسابية */}
                {/* سطر 1: اجمالي مبيعات اليوم ومؤشرات مالية */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-36 text-right">اجمالي مبيعات اليوم:</span>
                    <input
                      type="number"
                      value={salesToday || ''}
                      onChange={e => setSalesToday(Number(e.target.value))}
                      className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                    />
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 pl-4">
                    مؤشرات مالية
                  </div>
                </div>

                {/* يطرح - */}
                <div className="text-slate-600 text-[11px] pr-20 font-bold">يطرح -</div>

                {/* سطر 2: اجمالي زمام اليوم ومعدل الزمام */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-36 text-right">اجمالي زمام اليوم :</span>
                    <input
                      type="number"
                      value={zemamToday || ''}
                      onChange={e => setZemamToday(Number(e.target.value))}
                      className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-700">معدل الزمام لاجمالي بيع اليوم</span>
                    <div className="w-16 bg-[#f4f4f4] border border-slate-400 py-0.5 text-center font-mono text-xs font-bold text-slate-800">
                      {rateZemam}
                    </div>
                  </div>
                </div>

                {/* خط فاصل */}
                <hr className="border-t-2 border-slate-700 my-1.5" />

                {/* سطر 3: صافي النقدية ومعدل النقدية */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-36 text-right">صافي النقدية:</span>
                    <div className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900">
                      {netCashSales.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-700">معدل النقدية لاجمالي بيع اليوم</span>
                    <div className="w-16 bg-[#f4f4f4] border border-slate-400 py-0.5 text-center font-mono text-xs font-bold text-slate-800">
                      {rateCash}
                    </div>
                  </div>
                </div>

                {/* يضاف + */}
                <div className="text-slate-600 text-[11px] pr-20 font-bold">يضاف +</div>

                {/* سطر 4: اجمالي تحصيل اليوم ومعدل التحصيل */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-36 text-right">اجمالي تحصيل اليوم:</span>
                    <input
                      type="number"
                      value={tahseelToday}
                      onChange={e => setTahseelToday(Number(e.target.value))}
                      className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-700">معدل التحصيل لزمام اليوم</span>
                    <div className="w-16 bg-[#f4f4f4] border border-slate-400 py-0.5 text-center font-mono text-xs font-bold text-slate-800">
                      {rateTahseel}
                    </div>
                  </div>
                </div>

                {/* يطرح - */}
                <div className="text-slate-600 text-[11px] pr-20 font-bold">يطرح -</div>

                {/* سطر 5: سماح تحصيل اليوم */}
                <div className="flex items-center gap-2 py-0.5">
                  <span className="w-36 text-right">سماح تحصيل اليوم:</span>
                  <input
                    type="number"
                    value={samahTahseelToday}
                    onChange={e => setSamahTahseelToday(Number(e.target.value))}
                    className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                  />
                </div>

                {/* خط فاصل */}
                <hr className="border-t-2 border-slate-700 my-1.5" />

                {/* سطر 6: اجمالي النقدية ومعدل اجمالي النقدية */}
                <div className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-36 text-right">اجمالي النقدية :</span>
                    <div className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900">
                      {totalCashCollected.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-700">معدل اجمالي النقدية لاجمالي بيع اليوم</span>
                    <div className="w-16 bg-[#f4f4f4] border border-slate-400 py-0.5 text-center font-mono text-xs font-bold text-slate-800">
                      {rateTotalCash}
                    </div>
                  </div>
                </div>

                {/* يطرح - */}
                <div className="text-slate-600 text-[11px] pr-20 font-bold">يطرح -</div>

                {/* سطر 7: اجمالي مصاريف اليوم */}
                <div className="flex items-center gap-2 py-0.5">
                  <span className="w-36 text-right">اجمالي مصاريف اليوم:</span>
                  <input
                    type="number"
                    value={expensesToday}
                    onChange={e => setExpensesToday(Number(e.target.value))}
                    className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                  />
                </div>

                {/* سطر 8: صافي صرف الرهن اليوم */}
                <div className="flex items-center gap-2 py-0.5">
                  <span className="w-36 text-right">صافي صرف الرهن اليوم :</span>
                  <input
                    type="number"
                    value={netRahnRefundToday}
                    onChange={e => setNetRahnRefundToday(Number(e.target.value))}
                    className="w-28 bg-[#f4f4f4] border border-slate-400 px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none shadow-inner"
                  />
                </div>

                {/* خط فاصل */}
                <hr className="border-t-2 border-slate-700 my-1.5" />

                {/* سطر 9: صافي النقدية المرحلة للخزنة باللون الأحمر كما بالصورة 1 */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-36 text-right text-rose-700 font-extrabold text-[12.5px]">
                    صافي النقدية المرحلة للخزنة:
                  </span>
                  <div className="w-28 bg-[#f4f4f4] border border-slate-500 px-1.5 py-1 text-center font-mono font-extrabold text-sm text-rose-800 shadow-inner">
                    {netCashToKhazna.toLocaleString()}
                  </div>
                </div>

              </div>

              {/* زر الطباعة المخصص وخانة البياعة بجوار الورقة كما بالصورة 1 */}
              <div className="flex flex-col items-center gap-3 pt-2">
                {/* زر الطابعة ذو الأيقونة الواقعية وإطار التحديد الأزرق الخفيف */}
                <button
                  type="button"
                  onClick={handlePrint}
                  title="طباعة التقرير"
                  className="w-16 h-12 bg-white hover:bg-slate-100 border border-blue-500 shadow-md flex items-center justify-center p-1 active:scale-95 transition-transform"
                >
                  <Printer className="w-9 h-9 text-slate-800 stroke-[1.5]" />
                </button>

                {/* خانة اختيار البياعة */}
                <label className="flex items-center gap-1.5 text-white font-bold text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeByaaa}
                    onChange={e => setIncludeByaaa(e.target.checked)}
                    className="w-3.5 h-3.5 accent-slate-800"
                  />
                  <span>البياعة</span>
                </label>
              </div>

            </div>

          </div>
        ) : (
          /* --- شاشة 8-2: تقرير الخزينة ورصيد الرهن (الصورة 2) --- */
          <div className="p-4 bg-[#b8c5d6] min-h-[520px] flex flex-col justify-start relative overflow-auto">
            
            {/* خانة التاريخ في الأعلى */}
            <div className="flex items-center justify-start mb-3">
              <div className="flex items-center bg-white border-2 border-black shadow-inner px-2 py-0.5 text-xs font-mono font-bold">
                <input
                  type="text"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-24 text-center outline-none bg-transparent font-bold text-slate-900"
                />
              </div>
            </div>

            {/* الجزء الأوسط: الورقة البيضاء في اليسار وصناديق الرهن في اليمين كما بالصورة 2 */}
            <div className="flex items-start gap-8">
              
              {/* الورقة البيضاء لحركة الخزينة اليومية */}
              <div className="flex items-start gap-3">
                <div className="w-[560px] max-w-full bg-white border border-slate-700 shadow-2xl p-4 flex flex-col gap-2 text-slate-900 text-xs font-bold">
                  
                  {/* السطر العلوي: رصيد أول المدة، التاريخ، وتاريخ الورقة */}
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
                    <div className="border border-slate-400 bg-slate-50 px-2 py-0.5 text-center font-mono text-[11px] text-slate-700">
                      {paperDate}
                    </div>

                    <div className="flex items-center gap-2">
                      <span>التاريخ</span>
                      <input
                        type="text"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-28 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono outline-none text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="border border-black px-2 py-0.5 bg-[#ece9d8] text-rose-700 font-extrabold text-xs">
                        رصيد اول المدة
                      </span>
                      <input
                        type="number"
                        value={initialKhaznaBalance}
                        onChange={e => setInitialKhaznaBalance(Number(e.target.value))}
                        className="w-28 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  {/* عمودان متوازيان: الإيداعات في اليمين والمسحوبات في اليسار المطابقان تماماً للصورة 2 */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* العمود الأيمن: الإيداعات والإيرادات (أزرار زرقاء) */}
                    <div className="flex flex-col gap-2">
                      {/* التقفيل اليومي */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-blue-900 px-2 py-0.5 bg-[#ece9d8] text-blue-900 font-bold text-xs w-28 text-center"
                        >
                          التقفيل اليومي
                        </button>
                        <input
                          type="number"
                          value={closingTransfer}
                          onChange={e => setClosingTransfer(Number(e.target.value))}
                          className="w-24 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono font-bold text-slate-900 outline-none"
                        />
                      </div>

                      {/* ايداع شريك */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-blue-900 px-2 py-0.5 bg-[#ece9d8] text-blue-900 font-bold text-xs w-28 text-center"
                        >
                          ايداع شريك
                        </button>
                        <input
                          type="number"
                          value={partnerDeposit}
                          onChange={e => setPartnerDeposit(Number(e.target.value))}
                          className="w-24 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-slate-900 outline-none"
                        />
                      </div>

                      {/* رد مسحوبات مورد */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-blue-900 px-2 py-0.5 bg-[#ece9d8] text-blue-900 font-bold text-xs w-28 text-center"
                        >
                          رد مسحوبات مورد
                        </button>
                        <input
                          type="number"
                          value={supCashback}
                          onChange={e => setSupCashback(Number(e.target.value))}
                          className="w-24 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    {/* العمود الأيسر: المسحوبات والمصروفات (باللون الأحمر كما بالصورة 2) */}
                    <div className="flex flex-col gap-1.5">
                      {/* مسحوبات شريك */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          مسحوبات شريك
                        </button>
                        <input
                          type="number"
                          value={partnerWithdrawal}
                          onChange={e => setPartnerWithdrawal(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* مسحوبات مورد */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          مسحوبات مورد
                        </button>
                        <input
                          type="number"
                          value={supWithdrawal}
                          onChange={e => setSupWithdrawal(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* مصروف مزرعة */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          مصروف مزرعة
                        </button>
                        <input
                          type="number"
                          value={farmExpense}
                          onChange={e => setFarmExpense(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* المرتبات */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          المرتبات
                        </button>
                        <input
                          type="number"
                          value={salariesExpense}
                          onChange={e => setSalariesExpense(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* فواتير مصروفة */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          فواتير مصروفة
                        </button>
                        <input
                          type="number"
                          value={invoicesExpense}
                          onChange={e => setInvoicesExpense(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* نقدية مستلمة */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          نقدية مستلمة
                        </button>
                        <input
                          type="number"
                          value={receivedCashOut}
                          onChange={e => setReceivedCashOut(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* دفعات عمالة */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          دفعات عمالة
                        </button>
                        <input
                          type="number"
                          value={workersPayments}
                          onChange={e => setWorkersPayments(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* ما يستجد */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          ما يستجد
                        </button>
                        <input
                          type="number"
                          value={extraExpenses}
                          onChange={e => setExtraExpenses(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* مسحوبات محلات كراتين */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          مسحوبات محلات كراتين
                        </button>
                        <input
                          type="number"
                          value={boxesWithdrawals}
                          onChange={e => setBoxesWithdrawals(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>

                      {/* فروق اسعار فواتير */}
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          className="border border-black px-1.5 py-0.5 bg-[#ece9d8] text-rose-700 font-bold text-xs w-32 text-center"
                        >
                          فروق اسعار فواتير
                        </button>
                        <input
                          type="number"
                          value={priceDiffExpense}
                          onChange={e => setPriceDiffExpense(Number(e.target.value))}
                          className="w-20 bg-[#f4f4f4] border border-slate-400 px-1 py-0.5 text-center font-mono text-xs outline-none"
                        />
                      </div>
                    </div>

                  </div>

                  {/* السطر السفلي: رصيد آخر المدة باللون الأحمر في أسفل الورقة */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-300 mt-2">
                    <span className="border border-black px-2 py-0.5 bg-[#ece9d8] text-rose-700 font-extrabold text-xs">
                      رصيد اخر المدة
                    </span>
                    <div className="w-32 bg-[#f4f4f4] border border-slate-500 py-1 text-center font-mono font-extrabold text-sm text-slate-900 shadow-inner">
                      {finalKhaznaBalance.toLocaleString()}
                    </div>
                  </div>

                </div>

                {/* زر الطباعة أسفل الورقة */}
                <div className="self-end pb-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    title="طباعة تقرير الخزينة"
                    className="w-16 h-11 bg-white hover:bg-slate-100 border border-slate-400 shadow-md flex items-center justify-center p-1 active:scale-95 transition-transform"
                  >
                    <Printer className="w-8 h-8 text-slate-800 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* الجزء الأيمن: صناديق رصيد الرهن ورهن الزمام المطابقان تماماً للصورة 2 */}
              <div className="flex flex-col items-center gap-6 pt-4 w-72">
                
                {/* صندوق رصيد الرهن */}
                <div className="w-full border border-slate-500 bg-[#cbd5e1] shadow-md">
                  <div className="bg-[#b0c4de] border-b border-slate-400 py-1 px-3 text-center font-bold text-xs text-slate-900">
                    رصيد الرهن
                  </div>
                  <div className="grid grid-cols-3 bg-[#b0c4de] text-center text-[10.5px] font-bold border-b border-slate-400 py-1">
                    <div className="border-l border-slate-400 px-1">نقدية الرهن بالخزينة</div>
                    <div className="border-l border-slate-400 px-1">نقدية رهن زمام</div>
                    <div className="px-1">رهن نقدية</div>
                  </div>
                  <div className="grid grid-cols-3 text-center font-mono font-bold text-xs py-2 bg-white">
                    <div className="border-l border-slate-300">{rahnCashInKhazna.toLocaleString()}</div>
                    <div className="border-l border-slate-300">{rahnZemamCash.toLocaleString()}</div>
                    <div>{rahnNakdiCash.toLocaleString()}</div>
                  </div>
                </div>

                {/* صندوق رهن الزمام */}
                <div className="w-44 border border-slate-500 bg-[#cbd5e1] shadow-md">
                  <div className="bg-[#b0c4de] border-b border-slate-400 py-1 px-3 text-center font-bold text-xs text-slate-900">
                    رهن الزمام
                  </div>
                  <div className="bg-white py-1.5 text-center font-mono font-bold text-xs text-slate-900">
                    {rahnZemam.toLocaleString()}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 3. شريط الحالة السفلي الكلاسيكي */}
        <div className="h-6 bg-[#cfd3db] border-t border-[#808080] px-2 flex items-center justify-between text-[11px] text-slate-800 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            <span className="font-sans font-bold">
              {activeMode === 'w_takfeel'
                ? 'جاهز (Ready) | شاشة التقفيل اليومي للبيع عن يوم'
                : 'جاهز (Ready) | تقرير حركة الخزينة والأرصدة'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>DataWindow: [{activeMode === 'w_takfeel' ? 'dw_takfeel' : 'dw_rep_khazna'}]</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">NUM</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">CAPS</span>
          </div>
        </div>

      </div>
    </div>
  );
};
