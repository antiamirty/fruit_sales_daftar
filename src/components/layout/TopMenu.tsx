import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Database,
  Save,
  X,
  Minus,
  Square,
  Truck,
  Scale,
  DollarSign,
  Users,
  Wallet,
  Building2,
  Sprout,
  Receipt,
  FileText,
  Printer,
  FileCheck,
  Package,
  Layers,
  HelpCircle,
  HardDriveDownload,
  RotateCcw,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { syncEngine } from '../../services/syncEngine';

export type PBWindowName =
  | 'home'
  // 1. الشركة
  | 'w_company_data'
  | 'w_branch_data'
  | 'w_owners'
  | 'w_employees'
  | 'w_deposit_khazna'
  | 'w_owner_sahb'
  | 'w_employee_salary'
  | 'w_company_revenue_today'
  | 'w_company_revenue_period'
  | 'w_rep_employee_salary'
  | 'w_rep_all_salaries'
  | 'w_markz_mali'
  | 'w_company_revenue_fatora'
  | 'w_company_revenue_period_fatora'
  // 2. الفرع (مطابق لصورة باور بيلدر بزر الفرع)
  | 'w_branch_exps'
  | 'w_rep_branch_specific_exp'
  | 'w_rep_branch_total_exps'
  | 'w_rep_sup_revenue_purchase'
  | 'w_rep_farm_revenue_purchase'
  | 'w_rep_sup_revenue_comm'
  | 'w_rep_farm_revenue_comm'
  | 'w_rep_ardeya'
  | 'w_takfeel'
  | 'w_takfeel_sanawy'
  // 3. النقلات
  | 'w_nakla'
  | 'w_nakla_editing'
  | 'w_nakla_name_edit'
  | 'w_sup_naklat_masrofa'
  | 'w_sup_naklat_not_masrofa'
  | 'w_farm_naklat_masrofa'
  | 'w_farm_naklat_not_masrofa'
  // 4. الموردون و المزارع (مطابق لصورة باور بيلدر الأصلية)
  | 'w_suppliers'
  | 'w_farm'
  | 'w_sup_sahb'
  | 'w_sup_cashback'
  | 'w_sup_comission_exps'
  | 'w_rep_sup_comission_exps'
  | 'w_rep_sup_safi_sahb'
  | 'w_rep_farm_exps'
  | 'w_rep_farm_specific_exp'
  | 'w_rep_all_sups_safi_sahb'
  | 'w_rep_all_sups_safi_sahb_period'
  | 'w_rep_sup_dues'
  | 'w_rep_all_farms_sahb'
  | 'w_rep_all_farms_sahb_period'
  | 'w_rep_farm_qty_revenues'
  | 'w_rep_sup_fatora_masrofa'
  | 'w_rep_sup_fatora_mostahaqa'
  | 'w_rep_sup_comission_byaaa'
  | 'w_rep_farm_comission_byaaa'
  | 'w_rep_farm_fatora_masrofa'
  | 'w_rep_farm_fatora_mostahaqa'
  | 'w_rep_all_sups_accounts'
  | 'w_rep_farm_price_diff'
  | 'w_sup_name_edit'
  | 'w_farm_name_edit'
  | 'w_farm_exps'
  | 'w_farm_exps_editing'
  | 'w_sup_sahb_balance'
  | 'w_sup_revenues'
  | 'w_farm_revenues'
  // 5. الزبائن (مطابق لشاشة الباور بيلدر الأصلية)
  | 'w_customers'
  | 'w_tahseel_rahn_customers'
  | 'w_rad_rahn_nakdi_today'
  | 'w_rad_rahn_zemam_today'
  | 'w_rep_customer_purchases'
  | 'w_rep_customer_purchases_naklat'
  | 'w_rep_customer_zemam_tahseel'
  | 'w_rep_zemam_today'
  | 'w_rep_sales_today'
  | 'w_rep_customer_movement_detail'
  | 'w_rep_zemam_today_detail'
  | 'w_rep_sales_today_nakla'
  | 'w_rep_sales_nakla'
  | 'w_rep_avg_prices_nakla'
  | 'w_customer_name_edit'
  | 'w_tahseel_today'
  | 'w_tahseel_today2'
  | 'w_tahseel_editing'
  | 'w_zemam_balance'
  | 'w_zemam_print'
  | 'w_zemam_print_delay'
  | 'w_customer_zemam_report'
  | 'w_customer_zemam_report_daily'
  | 'w_customer_zemam_report_full'
  // 6. مستلزمات التعبئة (مطابق للباور بيلدر)
  | 'w_package_sups'
  | 'w_package_exp_name'
  | 'w_package_sup_sahb'
  | 'w_kratin_sup_sahb2'
  | 'w_rep_kratin_account'
  | 'w_rep_all_kratin_accounts'
  | 'w_rep_sup_packaging_total'
  | 'w_rep_sup_packaging_detail'
  | 'w_rep_company_packaging_status'
  | 'w_rep_sup_packaging_not_deducted'
  | 'w_rep_all_sups_packaging_not_deducted'
  | 'w_rahn'
  | 'w_tahseel_rahn_nakdi'
  | 'w_tahseel_rahn_nakdi_editing'
  | 'w_tahseel_rahn_zemam'
  | 'w_tahseel_rahn_zemam_editing'
  // 7. المبيعات
  | 'w_fatora_f'
  | 'w_fatora'
  | 'w_fatora_f_mahel'
  | 'w_category'
  | 'w_category_name_edit'
  | 'w_ardia'
  // 8. الخزينة
  | 'w_khazna'
  | 'w_rep_khazna'
  | 'w_khazina_debit'
  | 'w_receipt'
  | 'w_service_income'
  | 'w_service'
  // 9. الفواتير (مطابق للباور بيلدر)
  | 'w_esdar_fatora'
  | 'w_print_fwateer'
  | 'w_fwateer_print_sum'
  | 'w_fwateer_print_sum_for_sup'
  | 'w_fwateer_print_sum_for_farm'
  | 'w_sarf_fatora_group'
  | 'w_sarf_fatora_group_for_sup'
  | 'w_sarf_fatora_group_for_farm'
  | 'w_print_fwateer_diff_avg_price'
  | 'w_sarf_fatora'
  | 'w_fatora_editing'
  | 'w_fwateer_resale'
  // 10. التقارير
  | 'w_sales_report'
  | 'w_fatora_today_report'
  | 'w_fatora_period_report'
  | 'w_sales_report_nakla'
  | 'w_customer_sales_report'
  | 'w_sup_shab_safi_report'
  | 'w_sup_debit_credit_report'
  | 'w_statistics'
  // 11. المصروفات
  | 'w_branch_exps'
  | 'w_branch_exps_editing'
  | 'w_branch_exps_total_report'
  | 'w_company_exps'
  | 'w_c_exps'
  | 'w_exp_branch_search'
  | 'w_exp_company_search'
  | 'w_exp_farm_search'
  // 12. قاعدة البيانات (مطابق للباور بيلدر)
  | 'w_change_password_user'
  | 'w_arseda_madeena'
  | 'exit_backup'
  | 'db_restore'
  | 'w_sql_server_connect'
  // 13. التعديلات
  | 'w_editing'
  | 'w_names_editing'
  // 14. الضرائب
  | 'w_fwateer_print_tax'
  | 'w_fwateer_print_tax_reprint'
  | 'w_tax_report_irad'
  | 'w_tax_report_masrofat';

interface TopMenuProps {
  activeWindow: PBWindowName;
  onSelectWindow: (tab: PBWindowName) => void;
  openWindows: PBWindowName[];
  onCloseWindow: (tab: PBWindowName) => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  activeWindow,
  onSelectWindow,
  openWindows,
  onCloseWindow
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [syncStatus, setSyncStatus] = useState(syncEngine.getStatus());

  useEffect(() => {
    const unsub = syncEngine.subscribe(() => {
      setSyncStatus(syncEngine.getStatus());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (win: PBWindowName) => {
    onSelectWindow(win);
    setOpenDropdown(null);
  };

  return (
    <div className="select-none text-slate-900 border-b border-slate-300 font-sans" ref={menuRef}>
      {/* 1. PowerBuilder Window Title Bar (الرئيسية ------- ( محل 67 )) */}
      <div className="bg-slate-200 border-b border-slate-300 px-3 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Windows / PB App Icon */}
          <div className="w-4 h-4 bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px] rounded-xs shadow-xs">
            67
          </div>
          <span className="font-bold text-slate-800 text-[13px] tracking-wide">
            الرئيسية ------- ( محل 67 )
          </span>
          {/* مؤشر حالة الاتصال والمزامنة مع سيرفر SQL Server LocalDB */}
          <button
            type="button"
            onClick={() => onSelectWindow('w_sql_server_connect')}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer mr-3 ${
              syncStatus.isOnline
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400'
            }`}
            title="انقر لفتح شاشة إدارة اتصال SQL Server والمزامنة"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus.isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
              }`}
            />
            <span>
              {syncStatus.isOnline ? 'SQL Server (local1): متصل' : 'قاعدة بيانات محلية (Offline)'}
            </span>
            {syncStatus.pendingCount > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 rounded-full font-mono font-bold">
                {syncStatus.pendingCount} معلق
              </span>
            )}
          </button>
        </div>

        {/* Windows Standard Controls */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <button
            onClick={() => onSelectWindow('home')}
            className="px-2 py-0.5 hover:bg-slate-300 rounded text-[11px] font-semibold text-slate-700 border border-slate-300 bg-slate-100"
            title="العودة للشاشة الرئيسية"
          >
            الشاشة الرئيسية
          </button>
          <div className="flex items-center gap-1 border-r border-slate-300 pr-2">
            <span className="w-5 h-4 flex items-center justify-center hover:bg-slate-300 rounded text-slate-700 cursor-pointer">
              <Minus className="w-3 h-3" />
            </span>
            <span className="w-5 h-4 flex items-center justify-center hover:bg-slate-300 rounded text-slate-700 cursor-pointer">
              <Square className="w-2.5 h-2.5" />
            </span>
            <span className="w-5 h-4 flex items-center justify-center hover:bg-rose-500 hover:text-white rounded text-slate-700 cursor-pointer">
              <X className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 2. شريط القوائم الرئيسي (main_menu.srm) المطابق للصورة 100% من اليمين لليسار مع ترقيم مؤقت للأزرار */}
      <div className="bg-slate-100 border-b border-slate-300 px-1 py-0.5 flex flex-wrap items-center text-[12px] font-medium text-slate-800" dir="rtl">
        {/* 1. الشركة */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'company' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">1</span>
            <span>الشركة</span>
          </button>
          {openDropdown === 'company' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_company_data')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>الشركة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-1</span>
              </button>
              <button onClick={() => handleItemClick('w_branch_data')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>بيانات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-2</span>
              </button>
              <button onClick={() => handleItemClick('w_owners')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>اصحاب الشركة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-3</span>
              </button>
              <button onClick={() => handleItemClick('w_employees')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تسجيل موظف</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-4</span>
              </button>
              <button onClick={() => handleItemClick('w_deposit_khazna')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>ايداعات الخزينة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-5</span>
              </button>
              <button onClick={() => handleItemClick('w_owner_sahb')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>مسحوبات الشركاء</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-6</span>
              </button>
              <button onClick={() => handleItemClick('w_employee_salary')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تسجيل مرتب موظف</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-7</span>
              </button>

              <div className="border-t border-slate-300 my-1 mx-2"></div>
              <div className="border-t border-slate-200 my-0.5 mx-2"></div>

              <button onClick={() => handleItemClick('w_company_revenue_today')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>ايراد الشركة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-8</span>
              </button>
              <button onClick={() => handleItemClick('w_company_revenue_period')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايراد الشركة عن فترة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-9</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_employee_salary')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير مرتب موظف</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-10</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_salaries')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير اجمالي المرتبات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-11</span>
              </button>
              <button onClick={() => handleItemClick('w_markz_mali')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>مركز مالي في تاريخ</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-12</span>
              </button>
              <button onClick={() => handleItemClick('w_company_revenue_fatora')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايراد الشركة بتاريخ الفاتورة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-13</span>
              </button>
              <button onClick={() => handleItemClick('w_company_revenue_period_fatora')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايراد الشركة عن فترة بتاريخ الفاتورة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">1-14</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. الفرع */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'branch' ? null : 'branch')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'branch' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">2</span>
            <span>الفرع</span>
          </button>
          {openDropdown === 'branch' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_branch_exps')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-1</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_branch_specific_exp')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير مصروف معين للفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-2</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_branch_total_exps')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير اجمالي مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-3</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_revenue_purchase')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايرادات موردين مشتريات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-4</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_revenue_purchase')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايرادات مزارع مشتريات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-5</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_revenue_comm')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايرادات موردين عمولة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-6</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_revenue_comm')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير ايرادات مزارع عمولة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-7</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_ardeya')} className="w-full text-right px-3 py-1 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير الارضية</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">2-8</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. النقلات */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'nakla' ? null : 'nakla')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors font-semibold flex items-center gap-1 ${openDropdown === 'nakla' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">3</span>
            <span>النقلات</span>
          </button>
          {openDropdown === 'nakla' && (
            <div className="absolute right-0 top-full mt-0.5 w-56 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_nakla')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-bold">
                <span>تسجيل النقلات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300 font-normal">3-1</span>
              </button>
              <button onClick={() => handleItemClick('w_category')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>الاصناف</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">3-2</span>
              </button>
              <button onClick={() => handleItemClick('w_rahn')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تسجيل الرهن</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">3-3</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. الموردون و المزارع */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'suppliers' ? null : 'suppliers')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'suppliers' ? 'bg-slate-300 text-slate-900 font-semibold' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">4</span>
            <span>الموردون و المزارع</span>
          </button>
          {openDropdown === 'suppliers' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 max-h-[85vh] overflow-y-auto bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              {/* القسم الأول: نماذج تسجيل الحركات */}
              <button onClick={() => handleItemClick('w_suppliers')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>الموردون</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-1</span>
              </button>
              <button onClick={() => handleItemClick('w_farm')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>المزارع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-2</span>
              </button>
              <button onClick={() => handleItemClick('w_sup_sahb')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>مسحوبات الموردين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-3</span>
              </button>
              <button onClick={() => handleItemClick('w_sup_cashback')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>رد مسحوبات الموردين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-4</span>
              </button>
              <button onClick={() => handleItemClick('w_sup_comission_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>عمولات و مصروفات مورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-5</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثاني: التقارير الـ 18 للموردين والمزارع */}
              <button onClick={() => handleItemClick('w_rep_sup_comission_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير عمولات ومصروفات مورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-6</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_safi_sahb')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير صافي مسحوبات مورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-7</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مصروفات مزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-8</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_specific_exp')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مصروف معين للمزارع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-9</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_sups_safi_sahb')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير صافي مسحوبات الموردين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-10</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_sups_safi_sahb_period')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير صافي مسحوبات الموردين عن فترة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-11</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_dues')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مستحقات مورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-12</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_farms_sahb')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مسحوبات جميع المزارع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-13</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_farms_sahb_period')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مسحوبات جميع المزارع عن فترة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-14</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_qty_revenues')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير كميات و ايرادات مزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-15</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_fatora_masrofa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير فواتير مصروفة لمورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-16</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_fatora_mostahaqa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير فواتير مستحقة لمورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-17</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_comission_byaaa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير عمولة و بياعة مورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-18</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_comission_byaaa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير عمولة و بياعة مزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-19</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_fatora_masrofa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير فواتير مصروفة لمزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-20</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_fatora_mostahaqa')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير فواتير مستحقة لمزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-21</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_sups_accounts')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>حسابات جميع الموردين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-22</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_farm_price_diff')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير فروق اسعار لمزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">4-23</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. الزبائن */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'customers' ? null : 'customers')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors font-semibold flex items-center gap-1 ${openDropdown === 'customers' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">5</span>
            <span>الزبائن</span>
          </button>
          {openDropdown === 'customers' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 max-h-[85vh] overflow-y-auto bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              {/* القسم الأول: نماذج التسجيل والحركات */}
              <button onClick={() => handleItemClick('w_customers')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تسجيل زبون</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-1</span>
              </button>
              <button onClick={() => handleItemClick('w_tahseel_rahn_customers')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تحصيل و رهن الزبائن</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-2</span>
              </button>
              <button onClick={() => handleItemClick('w_rad_rahn_nakdi_today')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>رد رهن نقدية اليوم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-3</span>
              </button>
              <button onClick={() => handleItemClick('w_rad_rahn_zemam_today')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>رد رهن زمام اليوم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-4</span>
              </button>

              {/* فاصل مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثاني: التقارير العشرة للزبائن */}
              <button onClick={() => handleItemClick('w_rep_customer_purchases')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مشتريات زبون</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-5</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_customer_purchases_naklat')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مشتريات زبون مع النقلات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-6</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_customer_zemam_tahseel')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير زمام و تحصيل زبون</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-7</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_zemam_today')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير زمام اليوم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-8</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sales_today')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مبيعات اليوم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-9</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_customer_movement_detail')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>حركة زبون زمام وتحصيل مفصل</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-10</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_zemam_today_detail')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير زمام اليوم مفصل</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-11</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sales_today_nakla')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مبيعات اليوم بالنقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-12</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sales_nakla')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مبيعات نقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-13</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_avg_prices_nakla')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير متوسط اسعار نقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">5-14</span>
              </button>
            </div>
          )}
        </div>

        {/* 6. مستلزمات التعبئة */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'packaging' ? null : 'packaging')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'packaging' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">6</span>
            <span>مستلزمات التعبئة</span>
          </button>
          {openDropdown === 'packaging' && (
            <div className="absolute right-0 top-full mt-0.5 w-72 max-h-[85vh] overflow-y-auto bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              {/* القسم الأول: التسجيل */}
              <button onClick={() => handleItemClick('w_package_sups')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تسجيل محلات الكراتين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-1</span>
              </button>
              <button onClick={() => handleItemClick('w_package_exp_name')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تسجيل مستلزمات التعبئة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-2</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثاني: الحركات */}
              <button onClick={() => handleItemClick('w_package_sup_sahb')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>مسحوبات محلات الكراتين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-3</span>
              </button>
              <button onClick={() => handleItemClick('w_kratin_sup_sahb2')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>صرف الكراتين للموردين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-4</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثالث: كشوفات الحساب والتقارير */}
              <button onClick={() => handleItemClick('w_rep_kratin_account')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>كشف حساب محلات كراتين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-5</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_kratin_accounts')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>كشف حساب جميع محلات الكراتين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-6</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_packaging_total')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مستلزمات التعبئة لمورد ----- اجمالي</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-7</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_sup_packaging_detail')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مستلزمات التعبئة لمورد ----- تفصيلي</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-8</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_company_packaging_status')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>وضع الشركة بالنسبة للموردين و محلات الكراتين</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-9</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الرابع: تقارير غير مخصوم على نقلة */}
              <button onClick={() => handleItemClick('w_rep_sup_packaging_not_deducted')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مستلزمات التعبئة لمورد غير مخصوم على نقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-10</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_all_sups_packaging_not_deducted')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 text-[11.5px] flex items-center justify-between">
                <span>تقرير مستلزمات التعبئة للموردين غير مخصوم على نقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">6-11</span>
              </button>
            </div>
          )}
        </div>

        {/* 7. المبيعات */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'sales' ? null : 'sales')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors font-bold text-emerald-800 flex items-center gap-1 ${openDropdown === 'sales' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">7</span>
            <span>المبيعات</span>
          </button>
          {openDropdown === 'sales' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_fatora_f')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تسجيل المبيعات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">7-1</span>
              </button>
              <button onClick={() => handleItemClick('w_fatora_f_mahel')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تسجيل مبيعات مشتريات المحل</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">7-2</span>
              </button>
            </div>
          )}
        </div>

        {/* 8. الخزينة */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'khazna' ? null : 'khazna')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'khazna' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">8</span>
            <span>الخزينة</span>
          </button>
          {openDropdown === 'khazna' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_takfeel')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>التقفيل اليومي</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">8-1</span>
              </button>
              <button onClick={() => handleItemClick('w_rep_khazna')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تقرير الخزينة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">8-2</span>
              </button>
            </div>
          )}
        </div>

        {/* 9. الفواتير */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'invoices' ? null : 'invoices')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors font-bold flex items-center gap-1 ${openDropdown === 'invoices' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">9</span>
            <span>الفواتير</span>
          </button>
          {openDropdown === 'invoices' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 max-h-[85vh] overflow-y-auto bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              {/* القسم الأول */}
              <button onClick={() => handleItemClick('w_esdar_fatora')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>اصدار فاتورة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-1</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثاني: الطباعة */}
              <button onClick={() => handleItemClick('w_print_fwateer')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة فواتير</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-2</span>
              </button>
              <button onClick={() => handleItemClick('w_fwateer_print_sum')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة مجموعة فواتير</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-3</span>
              </button>
              <button onClick={() => handleItemClick('w_fwateer_print_sum_for_sup')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة مجموعة فواتير لمورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-4</span>
              </button>
              <button onClick={() => handleItemClick('w_fwateer_print_sum_for_farm')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة مجموعة فواتير لمزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-5</span>
              </button>

              {/* فاصل منقط مطابق للباور بيلدر */}
              <div className="my-1 border-t border-dashed border-slate-300" />
              <div className="my-1 border-t border-dashed border-slate-300" />

              {/* القسم الثالث: الصرف والتقارير */}
              <button onClick={() => handleItemClick('w_sarf_fatora_group')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>صرف مجموعة فواتير</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-6</span>
              </button>
              <button onClick={() => handleItemClick('w_fatora_today_report')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تقرير فواتير اليوم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-7</span>
              </button>
              <button onClick={() => handleItemClick('w_fatora_period_report')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تقرير فواتير عن فترة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-8</span>
              </button>
              <button onClick={() => handleItemClick('w_sarf_fatora_group_for_sup')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>صرف فواتير لمورد</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-9</span>
              </button>
              <button onClick={() => handleItemClick('w_sarf_fatora_group_for_farm')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>صرف فواتير لمزرعة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-10</span>
              </button>
              <button onClick={() => handleItemClick('w_print_fwateer_diff_avg_price')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة فواتير بفروق متوسط اسعار</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">9-11</span>
              </button>
            </div>
          )}
        </div>

        {/* 10. التقارير */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'reports' ? null : 'reports')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'reports' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">10</span>
            <span>التقارير</span>
          </button>
          {openDropdown === 'reports' && (
            <div className="absolute right-0 top-full mt-0.5 w-48 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button
                onClick={() => handleItemClick('w_sales_report')}
                className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between"
              >
                <span>تقارير</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">10-1</span>
              </button>

              {/* تقارير الزمام مع سهم القائمة الفرعية */}
              <div className="relative group">
                <button
                  onClick={() => handleItemClick('w_zemam_balance')}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between"
                >
                  <span className="text-[10px] text-slate-600 font-bold">‹</span>
                  <div className="flex items-center gap-1">
                    <span>تقارير الزمام</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">10-2</span>
                  </div>
                </button>
                <div className="hidden group-hover:block absolute right-full top-0 w-48 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[11.5px]">
                  <button onClick={() => handleItemClick('w_zemam_balance')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                    <span>رصيد الذمم</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded">10-2-1</span>
                  </button>
                  <button onClick={() => handleItemClick('w_rep_zemam_today')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                    <span>تقرير زمام اليوم</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded">10-2-2</span>
                  </button>
                  <button onClick={() => handleItemClick('w_rep_zemam_today_detail')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                    <span>تقرير زمام اليوم مفصل</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded">10-2-3</span>
                  </button>
                </div>
              </div>

              {/* تقارير الصنف مع سهم القائمة الفرعية */}
              <div className="relative group">
                <button
                  onClick={() => handleItemClick('w_category')}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between"
                >
                  <span className="text-[10px] text-slate-600 font-bold">‹</span>
                  <div className="flex items-center gap-1">
                    <span>تقارير الصنف</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">10-3</span>
                  </div>
                </button>
                <div className="hidden group-hover:block absolute right-full top-0 w-48 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[11.5px]">
                  <button onClick={() => handleItemClick('w_category')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                    <span>تقرير الأصناف</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded">10-3-1</span>
                  </button>
                  <button onClick={() => handleItemClick('w_rep_avg_prices_nakla')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                    <span>متوسط أسعار الصنف</span>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded">10-3-2</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 11. المصروفات */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'expenses' ? null : 'expenses')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'expenses' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">11</span>
            <span>المصروفات</span>
          </button>
          {openDropdown === 'expenses' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px]">
              <button onClick={() => handleItemClick('w_branch_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-bold flex items-center justify-between">
                <span>مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300 font-normal">11-1</span>
              </button>
              <button onClick={() => handleItemClick('w_branch_exps_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تعديل مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">11-2</span>
              </button>
              <button onClick={() => handleItemClick('w_branch_exps_total_report')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تقرير إجمالي مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">11-3</span>
              </button>
              <div className="my-1 border-t border-slate-200" />
              <button onClick={() => handleItemClick('w_company_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>مصروفات الشركة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">11-4</span>
              </button>
              <button onClick={() => handleItemClick('w_c_exps')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>بنود المصروفات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">11-5</span>
              </button>
              <button onClick={() => handleItemClick('w_exp_branch_search')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>بحث مصروفات الفرع</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">11-6</span>
              </button>
            </div>
          )}
        </div>

        {/* 12. قاعدة البيانات */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'database' ? null : 'database')}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'database' ? 'bg-slate-300 text-slate-900' : ''}`}
            title="فورمز زر قاعدة البيانات (w_change_password_user) [12]"
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">12</span>
            <span>قاعدة البيانات</span>
          </button>
          {openDropdown === 'database' && (
            <div className="absolute right-0 top-full mt-0.5 w-64 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_change_password_user')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تعديل كلمة المرور و اسم المستخدم</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">12-1</span>
              </button>
              <button onClick={() => handleItemClick('w_arseda_madeena')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>ارصدة مدينة (كشف أرصدة الزبائن)</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">12-2</span>
              </button>
              <div className="my-1 border-t border-slate-200"></div>
              <button onClick={() => handleItemClick('db_restore')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between text-slate-700">
                <span>النسخ الاحتياطي وإعدادات الوكالة</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded border border-slate-300">12-3</span>
              </button>
              <button onClick={() => handleItemClick('w_sql_server_connect')} className="w-full text-right px-3 py-1.5 hover:bg-blue-50 font-bold flex items-center justify-between text-blue-900 bg-blue-50/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>اتصال SQL Server (local1)</span>
                </span>
                <span className="text-[10px] font-mono text-blue-800 bg-blue-100 px-1 rounded border border-blue-300">12-4</span>
              </button>
            </div>
          )}
        </div>

        {/* 13. التعديلات */}
        <div className="relative">
          <button
            onClick={() => {
              handleItemClick('w_editing');
              setOpenDropdown(openDropdown === 'edits' ? null : 'edits');
            }}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'edits' ? 'bg-slate-300 text-slate-900' : ''}`}
            title="فورم زر التعديلات (w_editing) [13]"
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">13</span>
            <span>التعديلات</span>
          </button>
          {openDropdown === 'edits' && (
            <div className="absolute right-0 top-full mt-0.5 w-60 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px]">
              <button onClick={() => handleItemClick('w_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-bold text-slate-900 border-b border-slate-200">
                <span>شاشة التعديلات العامة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-amber-100 px-1 rounded border border-amber-300">13</span>
              </button>
              <button onClick={() => handleItemClick('w_nakla_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تعديل النقلة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">13-1</span>
              </button>
              <button onClick={() => handleItemClick('w_fatora_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تعديل الفاتورة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">13-2</span>
              </button>
              <button onClick={() => handleItemClick('w_tahseel_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تعديل التحصيل</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">13-3</span>
              </button>
              <button onClick={() => handleItemClick('w_branch_exps_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between">
                <span>تعديل المصروفات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">13-4</span>
              </button>
              <button onClick={() => handleItemClick('w_names_editing')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between font-bold text-blue-900 border-t border-slate-200">
                <span>تعديل المسميات وقاعدة البيانات</span>
                <span className="text-[10px] font-mono text-blue-800 bg-blue-100 px-1 rounded border border-blue-300">13-5</span>
              </button>
            </div>
          )}
        </div>

        {/* 14. الضرائب */}
        <div className="relative">
          <button
            onClick={() => {
              handleItemClick('w_fwateer_print_tax');
              setOpenDropdown(openDropdown === 'taxes' ? null : 'taxes');
            }}
            className={`px-2.5 py-1 hover:bg-slate-200 transition-colors flex items-center gap-1 ${openDropdown === 'taxes' ? 'bg-slate-300 text-slate-900' : ''}`}
          >
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">14</span>
            <span>الضرائب</span>
          </button>
          {openDropdown === 'taxes' && (
            <div className="absolute right-0 top-full mt-0.5 w-48 bg-white border border-slate-300 shadow-xl py-1 z-50 text-[12px] text-slate-800">
              <button onClick={() => handleItemClick('w_fwateer_print_tax')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>طباعة خاصة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">14-1</span>
              </button>
              <button onClick={() => handleItemClick('w_fwateer_print_tax_reprint')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>اعادة طباعة خاصة</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">14-2</span>
              </button>
              <button onClick={() => handleItemClick('w_tax_report_irad')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تقرير الايرادات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">14-3</span>
              </button>
              <button onClick={() => handleItemClick('w_tax_report_masrofat')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>تقرير المصروفات</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">14-4</span>
              </button>
              <button onClick={() => handleItemClick('w_takfeel_sanawy')} className="w-full text-right px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between">
                <span>ارقام تقفيل سنوي</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1 rounded border border-slate-300">14-5</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2.5 شريط أدوات باور بيلدر الكلاسيكي (PowerBuilder ToolBar) مع ترقيم مؤقت TB-0 إلى TB-17 */}
      <div className="bg-[#e4e3df] border-b-2 border-slate-300 px-2 py-1 flex items-center gap-1 overflow-x-auto shadow-inner select-none" dir="rtl">
        {/* زر العودة للرئيسية [TB-0] */}
        <button
          onClick={() => onSelectWindow('home')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[54px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'home' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="الشاشة الرئيسية (w_main) [TB-0]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-0</span>
          <div className="w-4 h-4 bg-emerald-700 text-white rounded-xs flex items-center justify-center font-bold text-[9px]">
            67
          </div>
          <span className="mt-0.5">الرئيسية</span>
        </button>

        <div className="w-[2px] h-9 bg-slate-300 mx-0.5 border-r border-white"></div>

        {/* 1. نقلات [TB-1] */}
        <button
          onClick={() => onSelectWindow('w_nakla')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_nakla' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="تسجيل نقلة جديدة (w_nakla) [TB-1]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-1</span>
          <Truck className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">نقلة</span>
        </button>

        {/* 2. مبيعات فاكهة [TB-2] */}
        <button
          onClick={() => onSelectWindow('w_fatora_f')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_fatora_f' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="فاتورة بيع الفاكهة والخضار (w_fatora_f) [TB-2]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-2</span>
          <Scale className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">بيع فاكهة</span>
        </button>

        {/* 3. مبيعات موز [TB-3] */}
        <button
          onClick={() => onSelectWindow('w_fatora')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_fatora' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="فاتورة بيع الموز (w_fatora) [TB-3]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-3</span>
          <Scale className="w-4 h-4 text-amber-700" />
          <span className="mt-0.5 whitespace-nowrap">بيع موز</span>
        </button>

        {/* 4. صرف فواتير [TB-4] */}
        <button
          onClick={() => onSelectWindow('w_sarf_fatora')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_sarf_fatora' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="صرف وتصفية الفواتير (w_sarf_fatora) [TB-4]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-4</span>
          <DollarSign className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">صرف فواتير</span>
        </button>

        <div className="w-[2px] h-9 bg-slate-300 mx-0.5 border-r border-white"></div>

        {/* 5. تحصيل اليوم [TB-5] */}
        <button
          onClick={() => onSelectWindow('w_tahseel_today')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_tahseel_today' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="تحصيل اليوم (w_tahseel_today) [TB-5]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-5</span>
          <Receipt className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">تحصيل 1</span>
        </button>

        {/* 6. تحصيل اليوم 2 [TB-6] */}
        <button
          onClick={() => onSelectWindow('w_tahseel_today2')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_tahseel_today2' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="تحصيل اليوم السريع 2 (w_tahseel_today2) [TB-6]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-6</span>
          <Receipt className="w-4 h-4 text-blue-800" />
          <span className="mt-0.5 whitespace-nowrap">تحصيل 2</span>
        </button>

        {/* 7. رصيد الذمم [TB-7] */}
        <button
          onClick={() => onSelectWindow('w_zemam_balance')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_zemam_balance' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="رصيد الذمم وطباعتها (w_zemam_balance) [TB-7]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-7</span>
          <FileText className="w-4 h-4 text-rose-800" />
          <span className="mt-0.5 whitespace-nowrap">رصيد الذمم</span>
        </button>

        {/* 8. الزبائن [TB-8] */}
        <button
          onClick={() => onSelectWindow('w_customers')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_customers' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="دليل الزبائن (w_customers) [TB-8]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-8</span>
          <Users className="w-4 h-4 text-slate-800" />
          <span className="mt-0.5 whitespace-nowrap">الزبائن</span>
        </button>

        <div className="w-[2px] h-9 bg-slate-300 mx-0.5 border-r border-white"></div>

        {/* 9. الخزينة [TB-9] */}
        <button
          onClick={() => onSelectWindow('w_khazna')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_khazna' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="الخزينة وحركة النقدية (w_khazna) [TB-9]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-9</span>
          <Wallet className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">الخزينة</span>
        </button>

        {/* 10. الموردين [TB-10] */}
        <button
          onClick={() => onSelectWindow('w_suppliers')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_suppliers' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="دليل الموردين (w_suppliers) [TB-10]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-10</span>
          <Users className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">الموردين</span>
        </button>

        {/* 11. المزارع [TB-11] */}
        <button
          onClick={() => onSelectWindow('w_farm')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_farm' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="المزارع ومصروفاتها (w_farm) [TB-11]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-11</span>
          <Sprout className="w-4 h-4 text-emerald-700" />
          <span className="mt-0.5 whitespace-nowrap">المزارع</span>
        </button>

        {/* 12. مسحوبات المورد [TB-12] */}
        <button
          onClick={() => onSelectWindow('w_sup_sahb')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_sup_sahb' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="مسحوبات المورد ورد النقدية (w_sup_sahb) [TB-12]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-12</span>
          <DollarSign className="w-4 h-4 text-amber-800" />
          <span className="mt-0.5 whitespace-nowrap">مسحوبات</span>
        </button>

        <div className="w-[2px] h-9 bg-slate-300 mx-0.5 border-r border-white"></div>

        {/* 13. مصروفات الفرع [TB-13] */}
        <button
          onClick={() => onSelectWindow('w_branch_exps')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_branch_exps' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="مصروفات الفرع (w_branch_exps) [TB-13]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-13</span>
          <FileText className="w-4 h-4 text-slate-800" />
          <span className="mt-0.5 whitespace-nowrap">مصروفات</span>
        </button>

        {/* 14. المركز المالي [TB-14] */}
        <button
          onClick={() => onSelectWindow('w_markz_mali')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_markz_mali' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="المركز المالي للفرع (w_markz_mali) [TB-14]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-14</span>
          <Building2 className="w-4 h-4 text-purple-800" />
          <span className="mt-0.5 whitespace-nowrap">المركز المالي</span>
        </button>

        {/* 15. فواتير ضريبية [TB-15] */}
        <button
          onClick={() => onSelectWindow('w_fwateer_print_tax')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_fwateer_print_tax' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="الفواتير الضريبية (w_fwateer_print_tax) [TB-15]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-15</span>
          <FileCheck className="w-4 h-4 text-emerald-800" />
          <span className="mt-0.5 whitespace-nowrap">ضرائب</span>
        </button>

        {/* 16. مستلزمات التعبئة [TB-16] */}
        <button
          onClick={() => onSelectWindow('w_package_sups')}
          className={`px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-slate-900 shadow-xs ${
            activeWindow === 'w_package_sups' ? 'bg-slate-300 border-t-slate-700 border-l-slate-700 border-b-white border-r-white' : ''
          }`}
          title="موردي الفوارغ والرهن (w_package_sups) [TB-16]"
        >
          <span className="text-[8px] font-mono font-bold bg-amber-300 text-slate-950 px-1 rounded border border-amber-500 mb-0.5">TB-16</span>
          <Package className="w-4 h-4 text-amber-800" />
          <span className="mt-0.5 whitespace-nowrap">الفوارغ</span>
        </button>

        <div className="w-[2px] h-9 bg-slate-300 mx-0.5 border-r border-white"></div>

        {/* 17. النسخ الاحتياطي [TB-17] */}
        <button
          onClick={() => onSelectWindow('exit_backup')}
          className="px-1.5 py-1 bg-slate-200 hover:bg-slate-100 active:bg-slate-300 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex flex-col items-center justify-center min-w-[56px] text-[10px] font-bold text-rose-900 shadow-xs"
          title="النسخ الاحتياطي (exit_backup) [TB-17]"
        >
          <span className="text-[8px] font-mono font-bold bg-rose-200 text-rose-950 px-1 rounded border border-rose-400 mb-0.5">TB-17</span>
          <HardDriveDownload className="w-4 h-4 text-rose-700" />
          <span className="mt-0.5 whitespace-nowrap">backup</span>
        </button>
      </div>

      {/* 3. شريط النوافذ المفتوحة (Open MDI Windows Tabs) */}
      {openWindows.length > 0 && (
        <div className="bg-slate-200 border-b border-slate-300 px-2 py-1 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => onSelectWindow('home')}
            className={`px-2.5 py-1 rounded-t flex items-center gap-1 font-semibold border-t border-x ${
              activeWindow === 'home'
                ? 'bg-white text-emerald-800 border-slate-300'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-100 border-transparent'
            }`}
          >
            <span>الرئيسية (محل 67)</span>
          </button>

          {openWindows.map((win, idx) => (
            <div
              key={`win_tab_${win}_${idx}`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-t font-mono text-[11px] font-bold border-t border-x cursor-pointer ${
                activeWindow === win
                  ? 'bg-white text-slate-900 border-slate-300 shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-100 border-transparent'
              }`}
              onClick={() => onSelectWindow(win)}
            >
              <span>{win}</span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onCloseWindow(win);
                }}
                className="hover:text-rose-600 p-0.5 rounded text-slate-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
