import React, { useState } from 'react';
import { wholesaleStore } from '../../services/storage';
import { PBWindowName } from '../../components/layout/TopMenu';
import { Printer, Minus, Square, X } from 'lucide-react';

interface SupplierFarmReportDialogProps {
  mode: PBWindowName;
  onClose: () => void;
}

export const SupplierFarmReportDialog: React.FC<SupplierFarmReportDialogProps> = ({
  mode,
  onClose
}) => {
  const db = wholesaleStore.getState();

  const [selectedSup, setSelectedSup] = useState(db.suppliers[0]?.sup_name || 'ابراهيم هلال');
  const [selectedFarm, setSelectedFarm] = useState(db.farms[0]?.farm_name || 'ابراهيم هلال');
  const [selectedExp, setSelectedExp] = useState('أسمدة ومبيدات');
  const [startDate, setStartDate] = useState('2024/07/01');
  const [endDate, setEndDate] = useState('2026/10/11');
  const [isCommissionOnly, setIsCommissionOnly] = useState(false);
  const [isCommissionAndPurchase, setIsCommissionAndPurchase] = useState(false);

  // التعرف على نوع التقرير
  const isTealBackground =
    mode === 'w_rep_farm_exps' ||
    mode === 'w_rep_farm_specific_exp' ||
    mode === 'w_rep_farm_qty_revenues';

  const getReportMeta = () => {
    switch (mode) {
      case 'w_rep_sup_comission_exps':
        return { title: 'تقرير عمولات و مصروفات مورد', showSup: true, showFarm: false };
      case 'w_rep_sup_safi_sahb':
        return { title: 'تقرير صافي مسحوبات مورد', showSup: true, showFarm: false };
      case 'w_rep_farm_exps':
        return { title: 'تقرير مصروفات مزرعة', showSup: false, showFarm: true };
      case 'w_rep_farm_specific_exp':
        return { title: 'تقرير مصروف معين للمزارع', showSup: false, showFarm: false, showExp: true };
      case 'w_rep_all_sups_safi_sahb':
        return { title: 'تقرير صافي مسحوبات الموردين', showSup: false, showFarm: false, singleDate: true };
      case 'w_rep_all_sups_safi_sahb_period':
        return { title: 'تقرير صافي مسحوبات الموردين عن فترة', showSup: false, showFarm: false };
      case 'w_rep_sup_dues':
        return { title: 'تقرير مستحقات مورد', showSup: true, showFarm: false, isDues: true };
      case 'w_rep_all_farms_sahb':
        return { title: 'تقرير مسحوبات جميع المزارع', showSup: false, showFarm: false, noDates: true };
      case 'w_rep_all_farms_sahb_period':
        return { title: 'تقرير مسحوبات جميع المزارع عن فترة', showSup: false, showFarm: false };
      case 'w_rep_farm_qty_revenues':
        return { title: 'تقرير كميات وايرادات مزرعة', showSup: false, showFarm: true };
      case 'w_rep_sup_fatora_masrofa':
        return { title: 'تقرير فواتير مصروفة لمورد', showSup: true, showFarm: false };
      case 'w_rep_sup_fatora_mostahaqa':
        return { title: 'تقرير فواتير مستحقة لمورد', showSup: true, showFarm: false };
      case 'w_rep_sup_comission_byaaa':
        return { title: 'تقرير عمولة و بياعة مورد', showSup: true, showFarm: false, showCheckboxes: true };
      case 'w_rep_farm_comission_byaaa':
        return { title: 'تقرير عمولة و بياعة مزرعة', showSup: true, showFarm: true };
      case 'w_rep_farm_fatora_masrofa':
        return { title: 'تقرير فواتير مصروفة لمزرعة', showSup: false, showFarm: true };
      case 'w_rep_farm_fatora_mostahaqa':
        return { title: 'تقرير فواتير مستحقة لمزرعة', showSup: false, showFarm: true };
      case 'w_rep_all_sups_accounts':
        return { title: 'حسابات جميع الموردين', showSup: false, showFarm: false, isAllSups: true };
      case 'w_rep_farm_price_diff':
        return { title: 'تقرير فروق اسعار لمزرعة', showSup: false, showFarm: true };
      default:
        return { title: 'تقرير الموردين والمزارع', showSup: true, showFarm: false };
    }
  };

  const meta = getReportMeta();

  // تصفية النقلات والبيانات
  const filteredNaklat = db.naklat.filter(n => {
    if (meta.showSup && selectedSup && n.sup_name !== selectedSup) return false;
    if (meta.showFarm && selectedFarm && n.farm_name !== selectedFarm) return false;
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col justify-start items-center p-2 bg-[#8c949d] select-none font-sans overflow-auto" dir="rtl">
      
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className={`w-full max-w-[1080px] ${isTealBackground ? 'bg-[#007070]' : 'bg-[#9fa6ad]'} border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto`}>
        
        {/* 1. شريط عنوان النافذة (Window Title Bar): أزرار التحكم على اليمين والعنوان على اليسار مطابق لشاشة الزبائن */}
        <div className="h-6 bg-[#cfd3db] text-slate-800 px-1.5 flex items-center justify-between border-b border-[#a0a0a0] text-xs font-bold">
          {/* أزرار التحكم بالنافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-[#cfd5dc] hover:bg-rose-500 hover:text-white border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center font-bold"
                title="إغلاق"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            <button
              type="button"
              className="w-4 h-4 bg-[#cfd5dc] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center hover:bg-[#d8dfe7]"
              title="تكبير"
            >
              <Square className="w-2.5 h-2.5 text-slate-700" />
            </button>
            <button
              type="button"
              className="w-4 h-4 bg-[#cfd5dc] border border-t-white border-l-white border-b-slate-600 border-r-slate-600 flex items-center justify-center hover:bg-[#d8dfe7]"
              title="تصغير"
            >
              <Minus className="w-2.5 h-2.5 text-slate-700" />
            </button>
          </div>

          {/* العنوان والأيقونة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-slate-800 tracking-wide font-bold">{meta.title}</span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-100 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة (Window Body) */}
        <div className={`p-4 flex flex-col gap-4 ${isTealBackground ? 'bg-[#007070]' : 'bg-[#9fa6ad]'}`}>
          
          {/* شريط الفلاتر العلوي */}
          <div className="flex items-center justify-between gap-4">
            
            {/* الفلاتر (المورد / المزرعة / المصروف) */}
            <div className="flex items-center gap-3">
              {meta.showSup && (
                <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5 w-40">
                  <div className="text-[10px] font-bold text-center border-b border-slate-400 bg-[#c2c8cf] py-0.5">المورد</div>
                  <select
                    value={selectedSup}
                    onChange={e => setSelectedSup(e.target.value)}
                    className="bg-[#0055ea] text-white border border-slate-600 text-xs font-bold px-1 py-0.5 outline-none cursor-pointer"
                  >
                    {db.suppliers.map(s => (
                      <option key={s.sup_id} value={s.sup_name} className="bg-white text-slate-900">{s.sup_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {meta.showFarm && (
                <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5 w-40">
                  <div className="text-[10px] font-bold text-center border-b border-slate-400 bg-[#c2c8cf] py-0.5">المزرعة</div>
                  <select
                    value={selectedFarm}
                    onChange={e => setSelectedFarm(e.target.value)}
                    className="bg-[#0055ea] text-white border border-slate-600 text-xs font-bold px-1 py-0.5 outline-none cursor-pointer"
                  >
                    {db.farms.map(f => (
                      <option key={f.farm_id} value={f.farm_name} className="bg-white text-slate-900">{f.farm_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {meta.showExp && (
                <div className="flex flex-col border border-slate-500 bg-[#b2b9c0] p-0.5 w-40">
                  <div className="text-[10px] font-bold text-center border-b border-slate-400 bg-[#c2c8cf] py-0.5">المصروف</div>
                  <select
                    value={selectedExp}
                    onChange={e => setSelectedExp(e.target.value)}
                    className="bg-[#0055ea] text-white border border-slate-600 text-xs font-bold px-1 py-0.5 outline-none cursor-pointer"
                  >
                    <option value="أسمدة ومبيدات" className="bg-white text-slate-900">أسمدة ومبيدات</option>
                    <option value="عمالة جني وتقليع" className="bg-white text-slate-900">عمالة جني وتقليع</option>
                    <option value="سولار وماكينات ري" className="bg-white text-slate-900">سولار وماكينات ري</option>
                  </select>
                </div>
              )}
            </div>

            {/* حقول التواريخ في أعلى اليسار */}
            {!meta.noDates && (
              <div className="flex items-center gap-2">
                {!meta.singleDate && (
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold ${isTealBackground ? 'text-white' : 'text-slate-900'}`}>من</span>
                    <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5 shadow-inner">
                      <input
                        type="text"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-24 text-center font-bold text-xs text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isTealBackground ? 'text-white' : 'text-slate-900'}`}>
                    {meta.singleDate ? 'حتى' : 'الى'}
                  </span>
                  <div className="flex items-center bg-white border-2 border-t-slate-700 border-l-slate-700 border-b-white border-r-white px-2 py-0.5 shadow-inner">
                    <input
                      type="text"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-24 text-center font-bold text-xs text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* مساحة عرض التقرير والأزرار الجانبية: الأزرار على اليمين والتقرير على اليسار مطابق لشاشة الزبائن */}
          <div className="flex items-start gap-4">
            
            {/* الأزرار الجانبية على اليمين: طابعة وزر عرض ومربعات اختيار */}
            <div className="flex flex-col gap-3 pt-1 w-44 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-16 h-11 bg-white border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-xs p-1"
                title="طباعة التقرير"
              >
                <Printer className="w-7 h-7 text-slate-800" />
              </button>

              {meta.showCheckboxes && (
                <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-900">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCommissionOnly}
                      onChange={e => setIsCommissionOnly(e.target.checked)}
                      className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                    />
                    <span>عمولة مشتريات فقط</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCommissionAndPurchase}
                      onChange={e => setIsCommissionAndPurchase(e.target.checked)}
                      className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                    />
                    <span>عمولة مشتريات و عمولة</span>
                  </label>
                </div>
              )}

              {meta.isAllSups ? (
                <button
                  type="button"
                  className="w-28 py-1.5 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-xs hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
                >
                  جميع الموردين
                </button>
              ) : (
                <button
                  type="button"
                  className="w-20 py-1.5 bg-[#cfd5dc] border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-bold text-xs hover:bg-[#d9e0e7] cursor-pointer shadow-xs"
                >
                  عرض
                </button>
              )}
            </div>

            {/* لوحة التقرير البيضاء الكلاسيكية على اليسار */}
            <div className="flex-1 bg-white border-2 border-slate-600 min-h-[380px] p-3 flex flex-col justify-between overflow-x-auto shadow-inner">
              
              <div>
                {/* ترويسة التقرير الزرقاء الداخلية */}
                <div className="text-right text-xs font-bold text-blue-900 mb-3 border-b border-slate-200 pb-1">
                  <span>{meta.title} </span>
                  {meta.showSup && <span>{selectedSup} </span>}
                  {meta.showFarm && <span>{selectedFarm} </span>}
                  {!meta.noDates && <span>من {startDate} الى {endDate}</span>}
                </div>

                {/* حالة تقرير مستحقات مورد (Image 12) */}
                {meta.isDues ? (
                  <div className="grid grid-cols-2 gap-4 my-6 text-xs font-bold">
                    <div className="border border-blue-300 bg-blue-50/50 p-3 text-center">
                      <div className="text-blue-900 mb-2 border-b border-blue-200 pb-1">اجمالي مستحق للمورد</div>
                      <div className="text-blue-800">اجمالي صافي الفواتير التي لم تصرف</div>
                      <div className="text-lg font-mono font-black text-blue-950 mt-2">0 ج.م</div>
                    </div>
                    <div className="border border-rose-300 bg-rose-50/50 p-3 text-center">
                      <div className="text-rose-900 mb-2 border-b border-rose-200 pb-1">اجمالي مستحق على المورد</div>
                      <div className="text-rose-800 mb-1">العمولات / مصروفات المورد</div>
                      <div className="text-rose-700">حساب كراتين لم تخصم</div>
                      <div className="text-lg font-mono font-black text-rose-950 mt-2">0 ج.م</div>
                    </div>
                  </div>
                ) : meta.isAllSups ? (
                  /* جدول حسابات جميع الموردين (Image 22) */
                  <table className="w-full text-center border-collapse text-xs border border-slate-400">
                    <thead className="bg-[#b4cbe5] font-bold text-slate-900">
                      <tr>
                        <th className="p-1 border border-slate-400">صافي المورد</th>
                        <th className="p-1 border border-slate-400">حالة المورد</th>
                        <th className="p-1 border border-slate-400 text-rose-800">مصروفات مزارع</th>
                        <th className="p-1 border border-slate-400 text-blue-800">رد مسحوبات</th>
                        <th className="p-1 border border-slate-400 text-rose-800">مسحوبات</th>
                        <th className="p-1 border border-slate-400 text-blue-900">فواتير مستحقة</th>
                        <th className="p-1 border border-slate-400">المورد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.suppliers.map((s, idx) => (
                        <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50">
                          <td className="p-1 border border-slate-300 font-mono font-bold">0</td>
                          <td className="p-1 border border-slate-300 text-emerald-800">خالص</td>
                          <td className="p-1 border border-slate-300 font-mono">0</td>
                          <td className="p-1 border border-slate-300 font-mono">0</td>
                          <td className="p-1 border border-slate-300 font-mono">0</td>
                          <td className="p-1 border border-slate-300 font-mono">0</td>
                          <td className="p-1 border border-slate-300 font-bold text-right pr-2">{s.sup_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  /* جدول عام للحركات والفواتير للتقارير الأخرى */
                  <table className="w-full text-center border-collapse text-xs border border-slate-400">
                    <thead className="bg-slate-100 font-bold text-slate-900">
                      <tr>
                        {mode === 'w_rep_farm_qty_revenues' ? (
                          <>
                            <th className="p-1 border border-slate-300">صافي الفاتورة</th>
                            <th className="p-1 border border-slate-300">عدد</th>
                            <th className="p-1 border border-slate-300">تاريخ النقلة</th>
                            <th className="p-1 border border-slate-300">النقلة</th>
                            <th className="p-1 border border-slate-300 w-10">م</th>
                          </>
                        ) : mode === 'w_rep_sup_comission_byaaa' || mode === 'w_rep_farm_comission_byaaa' ? (
                          <>
                            <th className="p-1 border border-slate-300">تاريخ الفاتورة</th>
                            <th className="p-1 border border-slate-300">اجمالي</th>
                            <th className="p-1 border border-slate-300">البياعة</th>
                            <th className="p-1 border border-slate-300">العمولة</th>
                            <th className="p-1 border border-slate-300">النقلة</th>
                          </>
                        ) : (
                          <>
                            <th className="p-1 border border-slate-300">صافي فاتورة</th>
                            <th className="p-1 border border-slate-300">النقلة</th>
                            <th className="p-1 border border-slate-300">تاريخ الفاتورة</th>
                            <th className="p-1 border border-slate-300">تاريخ الصرف</th>
                            {mode === 'w_rep_farm_price_diff' && <th className="p-1 border border-slate-300">فروق اسعار</th>}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNaklat.map((n, idx) => {
                        const fawateerF = db.fatora_f.filter(f => f.nakla_id === n.nakla_id);
                        const fawateerB = db.fatora_banana.filter(b => b.nakla_id === n.nakla_id);
                        const nSales = fawateerF.reduce((s, f) => s + (Number(f.totally) || 0), 0) +
                                       fawateerB.reduce((s, b) => s + (Number(b.totally) || 0), 0);
                        const safi = db.safi_fatora.find(s => s.nakla_id === n.nakla_id);
                        const sup = db.suppliers.find(s => s.sup_name === n.sup_name);
                        let rate = n.comission !== undefined && n.comission > 0 ? n.comission : (sup?.comission || 0.06);
                        if (rate > 1) rate = rate / 100;
                        const nComm = safi && safi.comission > 0 ? Number(safi.comission) : Math.round(nSales * rate);
                        const nByaaa = fawateerF.reduce((s, f) => s + (Number(f.byaaa) || 0), 0);
                        const nSafi = safi ? safi.safi_fatora : Math.max(0, nSales - nComm);

                        return (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            {mode === 'w_rep_farm_qty_revenues' ? (
                              <>
                                <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900">{nSafi.toLocaleString()} ج.م</td>
                                <td className="p-1 border border-slate-300 font-mono">{n.sobata_number}</td>
                                <td className="p-1 border border-slate-300 font-mono">{n.nakla_date || n.date_nakla}</td>
                                <td className="p-1 border border-slate-300 font-bold">{n.nakla_name}</td>
                                <td className="p-1 border border-slate-300 font-mono">{idx + 1}</td>
                              </>
                            ) : mode === 'w_rep_sup_comission_byaaa' || mode === 'w_rep_farm_comission_byaaa' ? (
                              <>
                                <td className="p-1 border border-slate-300 font-mono">{n.nakla_date || n.date_nakla}</td>
                                <td className="p-1 border border-slate-300 font-mono font-bold">{nSales.toLocaleString()}</td>
                                <td className="p-1 border border-slate-300 font-mono">{nByaaa.toLocaleString()}</td>
                                <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900">{nComm.toLocaleString()}</td>
                                <td className="p-1 border border-slate-300 font-bold">{n.nakla_name}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900">{nSafi.toLocaleString()} ج.م</td>
                                <td className="p-1 border border-slate-300 font-bold">{n.nakla_name}</td>
                                <td className="p-1 border border-slate-300 font-mono">{n.nakla_date || n.date_nakla}</td>
                                <td className="p-1 border border-slate-300 font-mono">{safi ? safi.trans_date : (n.nakla_sarf ? 'تم الصرف' : 'معلق')}</td>
                                {mode === 'w_rep_farm_price_diff' && <td className="p-1 border border-slate-300 font-mono">0</td>}
                              </>
                            )}
                          </tr>
                        );
                      })}
                      {filteredNaklat.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                            لا توجد بيانات مسجلة في هذا التقرير للفترة المحددة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* صف الإجمالي السفلي الدقيق */}
              <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-xs font-bold">
                {mode === 'w_rep_sup_safi_sahb' || mode === 'w_rep_all_sups_safi_sahb' ? (
                  <div className="flex items-center gap-2 border border-slate-400 p-1 bg-slate-50">
                    <span>الصافي:</span>
                    <span className="font-mono text-emerald-800">0 ج.م</span>
                  </div>
                ) : mode === 'w_rep_sup_comission_byaaa' || mode === 'w_rep_farm_comission_byaaa' ? (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                      <span>إجمالي المبيعات:</span>
                      <span className="font-mono text-slate-900">
                        {filteredNaklat.reduce((sum, n) => {
                          const sf = db.fatora_f.filter(f => f.nakla_id === n.nakla_id).reduce((s, f) => s + (Number(f.totally) || 0), 0);
                          const sb = db.fatora_banana.filter(b => b.nakla_id === n.nakla_id).reduce((s, b) => s + (Number(b.totally) || 0), 0);
                          return sum + sf + sb;
                        }, 0).toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>إجمالي العمولة:</span>
                      <span className="font-mono text-blue-900">
                        {filteredNaklat.reduce((sum, n) => {
                          const sf = db.fatora_f.filter(f => f.nakla_id === n.nakla_id).reduce((s, f) => s + (Number(f.totally) || 0), 0);
                          const sb = db.fatora_banana.filter(b => b.nakla_id === n.nakla_id).reduce((s, b) => s + (Number(b.totally) || 0), 0);
                          const safi = db.safi_fatora.find(s => s.nakla_id === n.nakla_id);
                          const sup = db.suppliers.find(s => s.sup_name === n.sup_name);
                          let rate = n.comission !== undefined && n.comission > 0 ? n.comission : (sup?.comission || 0.06);
                          if (rate > 1) rate = rate / 100;
                          return sum + (safi && safi.comission > 0 ? Number(safi.comission) : Math.round((sf + sb) * rate));
                        }, 0).toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>الاجمالي:</span>
                    <span className="font-mono text-blue-900">
                      {filteredNaklat.length} نقلة
                    </span>
                  </div>
                )}
              </div>

            </div>



          </div>

        </div>

        {/* 3. شريط الحالة السفلي */}
        <div className="bg-[#cfd5dc] border-t border-slate-400 px-3 py-1 flex items-center justify-between text-xs text-slate-700">
          <span className="font-mono">{meta.title} - جاهز</span>
          <span>التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
        </div>

      </div>

    </div>
  );
};
