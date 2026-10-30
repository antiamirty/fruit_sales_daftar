/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { wholesaleStore } from './services/storage';
import { TopMenu, PBWindowName } from './components/layout/TopMenu';
import { HomeView } from './views/HomeView';
import { NaklaWindow } from './views/NaklaWindow';
import { NaklaManagementWindow } from './views/NaklaManagementWindow';
import { FatoraFWindow } from './views/FatoraFWindow';
import { FatoraBananaWindow } from './views/FatoraBananaWindow';
import { SarfFatoraWindow } from './views/SarfFatoraWindow';
import { TahseelWindow } from './views/TahseelWindow';
import { CustomerLedgerWindow } from './views/CustomerLedgerWindow';
import { ZemamWindow } from './views/ZemamWindow';
import { SuppliersWindow } from './views/SuppliersWindow';
import { FarmWindow } from './views/FarmWindow';
import { SupplierSahbWindow } from './views/SupplierSahbWindow';
import { SupplierFarmReportDialog } from './views/suppliers/SupplierFarmReportDialog';
import { CustomersWindow } from './views/CustomersWindow';
import { CustomerTahseelRahnWindow } from './views/CustomerTahseelRahnWindow';
import { CustomerRadRahnWindow } from './views/CustomerRadRahnWindow';
import { CustomerReportsPBWindow } from './views/CustomerReportsPBWindow';
import { BranchExpensesWindow } from './views/BranchExpensesWindow';
import { KhaznaWindow } from './views/KhaznaWindow';
import { TakfeelWindow } from './views/TakfeelWindow';
import { ReportsWindow } from './views/ReportsWindow';
import { CategoriesWindow } from './views/CategoriesWindow';
import { PackageRahnWindow } from './views/PackageRahnWindow';
import { PackagingManagementWindow } from './views/PackagingManagementWindow';
import { CompanyManagementWindow } from './views/CompanyManagementWindow';
import { TaxManagementWindow } from './views/TaxManagementWindow';
import { SettingsWindow } from './views/SettingsWindow';
import { EditsWindow } from './views/EditsWindow';
import { InvoicesManagementWindow } from './views/InvoicesManagementWindow';
import { DatabaseManagementWindow } from './views/DatabaseManagementWindow';
import { SqlServerConnectWindow } from './views/SqlServerConnectWindow';
import { VoiceDictationButton } from './components/layout/VoiceDictationButton';

// شاشات زر الشركة (PowerBuilder Company Menu Windows)
import { CompanyInfoDialog } from './views/company/CompanyInfoDialog';
import { BranchDataDialog } from './views/company/BranchDataDialog';
import { OwnersDialog } from './views/company/OwnersDialog';
import { EmployeesDialog } from './views/company/EmployeesDialog';
import { TreasuryDepositsDialog } from './views/company/TreasuryDepositsDialog';
import { OwnerWithdrawalsDialog } from './views/company/OwnerWithdrawalsDialog';
import { EmployeeSalaryDialog } from './views/company/EmployeeSalaryDialog';
import { CompanyRevenueReport } from './views/company/CompanyRevenueReport';
import { EmployeeSalaryReport } from './views/company/EmployeeSalaryReport';
import { AllSalariesReport } from './views/company/AllSalariesReport';
import { FinancialPositionReport } from './views/company/FinancialPositionReport';

// شاشات زر الفرع (PowerBuilder Branch Menu Windows)
import { BranchExpensesDialog } from './views/branch/BranchExpensesDialog';
import { SpecificBranchExpenseReport } from './views/branch/SpecificBranchExpenseReport';
import { TotalBranchExpensesReport } from './views/branch/TotalBranchExpensesReport';
import { PurchaseSupplierRevenueReport } from './views/branch/PurchaseSupplierRevenueReport';
import { PurchaseFarmRevenueReport } from './views/branch/PurchaseFarmRevenueReport';
import { CommissionSupplierRevenueReport } from './views/branch/CommissionSupplierRevenueReport';
import { CommissionFarmRevenueReport } from './views/branch/CommissionFarmRevenueReport';
import { ArdeyaReport } from './views/branch/ArdeyaReport';

import { FatoraPrintModal } from './components/print/FatoraPrintModal';
import { SarfFatoraPrintModal } from './components/print/SarfFatoraPrintModal';
import { TahseelReceiptModal } from './components/print/TahseelReceiptModal';
import { FatoraF, SafiFatora, TahseelRecord } from './types/schema';

export default function App() {
  const [activeWindow, setActiveWindow] = useState<PBWindowName>('home');
  const [openWindows, setOpenWindows] = useState<PBWindowName[]>([]);
  const [selectedNaklaId, setSelectedNaklaId] = useState<number | undefined>(undefined);
  const [dbState, setDbState] = useState(wholesaleStore.getState());

  // Print Modals
  const [printFatora, setPrintFatora] = useState<FatoraF | null>(null);
  const [printSarf, setPrintSarf] = useState<SafiFatora | null>(null);
  const [printReceipt, setPrintReceipt] = useState<TahseelRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // اشتراك في تحديثات قاعدة البيانات
  useEffect(() => {
    const unsubscribe = wholesaleStore.subscribe(() => {
      setDbState({ ...wholesaleStore.getState() });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenWindow = (win: PBWindowName) => {
    if (win === 'exit_backup') {
      handleExitBackup();
      return;
    }
    if (win !== 'home' && !openWindows.includes(win)) {
      setOpenWindows([...openWindows, win]);
    }
    setActiveWindow(win);
  };

  const handleCloseWindow = (win: PBWindowName) => {
    const nextList = openWindows.filter(w => w !== win);
    setOpenWindows(nextList);
    if (activeWindow === win) {
      setActiveWindow(nextList.length > 0 ? nextList[nextList.length - 1] : 'home');
    }
  };

  const handleExitBackup = () => {
    const dataStr = wholesaleStore.exportJson();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fruit67_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMsg('✓ تم تصدير نسخة قاعدة البيانات الاحتياطية (fruit67_backup.json) بنجاح.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenSaleForNakla = (naklaId: number) => {
    setSelectedNaklaId(naklaId);
    handleOpenWindow('w_fatora_f');
  };

  const handleOpenSettleForNakla = (naklaId: number) => {
    setSelectedNaklaId(naklaId);
    handleOpenWindow('w_sarf_fatora');
  };

  return (
    <div className="h-screen w-full bg-slate-300 flex flex-col font-sans text-slate-800 overflow-hidden" dir="rtl">
      {/* 1. الشريط العلوي والقوائم (PowerBuilder main_menu.srm) */}
      <TopMenu
        activeWindow={activeWindow}
        onSelectWindow={handleOpenWindow}
        openWindows={openWindows}
        onCloseWindow={handleCloseWindow}
      />

      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2 rounded-lg shadow-xl border border-emerald-400 font-bold text-xs flex items-center gap-2 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. مساحة العمل (MDI Active Window Area) - تدعم التمرير الرأسي والأفقي بسلاسة لكافة النوافذ والشاشات */}
      <main className="flex-1 p-2 w-full overflow-x-auto overflow-y-auto min-h-0">
        {/* الشاشة الرئيسية: w_main / الرئيسية محل 67 */}
        {activeWindow === 'home' && (
          <HomeView
            onOpenWindow={handleOpenWindow}
            onExitBackup={handleExitBackup}
          />
        )}

        {/* 1. قائمة الشركة (14 فورم وشاشة مطابقة لصور باور بيلدر) */}
        {/* 1.1 الشركة - معلومات الشركة (Image 1) */}
        {activeWindow === 'w_company_data' && (
          <CompanyInfoDialog onClose={() => handleCloseWindow('w_company_data')} />
        )}

        {/* 1.2 بيانات الفرع (Image 2) */}
        {activeWindow === 'w_branch_data' && (
          <BranchDataDialog onClose={() => handleCloseWindow('w_branch_data')} />
        )}

        {/* 1.3 اصحاب الشركة / الشركاء (Image 3) */}
        {activeWindow === 'w_owners' && (
          <OwnersDialog onClose={() => handleCloseWindow('w_owners')} />
        )}

        {/* 1.4 تسجيل موظف (Image 4) */}
        {activeWindow === 'w_employees' && (
          <EmployeesDialog onClose={() => handleCloseWindow('w_employees')} />
        )}

        {/* 1.5 ايداعات الخزينة (Image 5) */}
        {activeWindow === 'w_deposit_khazna' && (
          <TreasuryDepositsDialog onClose={() => handleCloseWindow('w_deposit_khazna')} />
        )}

        {/* 1.6 مسحوبات الشركاء */}
        {activeWindow === 'w_owner_sahb' && (
          <OwnerWithdrawalsDialog onClose={() => handleCloseWindow('w_owner_sahb')} />
        )}

        {/* 1.7 تسجيل مرتب موظف (Image 6) */}
        {activeWindow === 'w_employee_salary' && (
          <EmployeeSalaryDialog onClose={() => handleCloseWindow('w_employee_salary')} />
        )}

        {/* 1.8 تقارير ايراد الشركة (Images 7, 8, 12, 13, 14) */}
        {(activeWindow === 'w_company_revenue_today' ||
          activeWindow === 'w_company_revenue_period' ||
          activeWindow === 'w_company_revenue_fatora' ||
          activeWindow === 'w_company_revenue_period_fatora') && (
          <CompanyRevenueReport
            mode={activeWindow}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 1.9 تقرير مرتب موظف (Image 9) */}
        {activeWindow === 'w_rep_employee_salary' && (
          <EmployeeSalaryReport onClose={() => handleCloseWindow('w_rep_employee_salary')} />
        )}

        {/* 1.10 تقرير اجمالي المرتبات عن فترة (Image 10) */}
        {activeWindow === 'w_rep_all_salaries' && (
          <AllSalariesReport onClose={() => handleCloseWindow('w_rep_all_salaries')} />
        )}

        {/* 1.11 مركز مالي في تاريخ (Image 11) */}
        {activeWindow === 'w_markz_mali' && (
          <FinancialPositionReport onClose={() => handleCloseWindow('w_markz_mali')} />
        )}

        {/* 2. قائمة الفرع (8 فورمز وشاشات مطابقة لصورة باور بيلدر بزر الفرع) */}
        {/* 2.1 مصروفات الفرع */}
        {activeWindow === 'w_branch_exps' && (
          <BranchExpensesDialog onClose={() => handleCloseWindow('w_branch_exps')} />
        )}

        {/* 2.2 تقرير مصروف معين للفرع */}
        {activeWindow === 'w_rep_branch_specific_exp' && (
          <SpecificBranchExpenseReport onClose={() => handleCloseWindow('w_rep_branch_specific_exp')} />
        )}

        {/* 2.3 تقرير اجمالي مصروفات الفرع */}
        {activeWindow === 'w_rep_branch_total_exps' && (
          <TotalBranchExpensesReport onClose={() => handleCloseWindow('w_rep_branch_total_exps')} />
        )}

        {/* 2.4 تقرير ايرادات موردين مشتريات */}
        {activeWindow === 'w_rep_sup_revenue_purchase' && (
          <PurchaseSupplierRevenueReport onClose={() => handleCloseWindow('w_rep_sup_revenue_purchase')} />
        )}

        {/* 2.5 تقرير ايرادات مزارع مشتريات */}
        {activeWindow === 'w_rep_farm_revenue_purchase' && (
          <PurchaseFarmRevenueReport onClose={() => handleCloseWindow('w_rep_farm_revenue_purchase')} />
        )}

        {/* 2.6 تقرير ايرادات موردين عمولة */}
        {activeWindow === 'w_rep_sup_revenue_comm' && (
          <CommissionSupplierRevenueReport onClose={() => handleCloseWindow('w_rep_sup_revenue_comm')} />
        )}

        {/* 2.7 تقرير ايرادات مزارع عمولة */}
        {activeWindow === 'w_rep_farm_revenue_comm' && (
          <CommissionFarmRevenueReport onClose={() => handleCloseWindow('w_rep_farm_revenue_comm')} />
        )}

        {/* 2.8 تقرير الارضية */}
        {activeWindow === 'w_rep_ardeya' && (
          <ArdeyaReport onClose={() => handleCloseWindow('w_rep_ardeya')} />
        )}

        {/* 2. التقفيل اليومي */}
        {activeWindow === 'w_takfeel' && (
          <TakfeelWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 3. النقلات: تسجيل نقلة جديدة */}
        {activeWindow === 'w_nakla' && (
          <NaklaWindow
            onClose={() => handleCloseWindow('w_nakla')}
            onOpenSaleForNakla={handleOpenSaleForNakla}
            onOpenSettleForNakla={handleOpenSettleForNakla}
          />
        )}

        {/* 3. النقلات: تعديل أسماء النقلات ونقلات المورد والمزرعة المصروفة وغير المصروفة */}
        {(activeWindow === 'w_nakla_name_edit' ||
          activeWindow === 'w_sup_naklat_masrofa' ||
          activeWindow === 'w_sup_naklat_not_masrofa' ||
          activeWindow === 'w_farm_naklat_masrofa' ||
          activeWindow === 'w_farm_naklat_not_masrofa') && (
          <NaklaManagementWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
            onSelectNaklaForSale={handleOpenSaleForNakla}
            onSelectNaklaForSettle={handleOpenSettleForNakla}
          />
        )}

        {/* 4. الموردون: دليل الموردين وتعديل الاسم */}
        {(activeWindow === 'w_suppliers' || activeWindow === 'w_sup_name_edit') && (
          <SuppliersWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 4. المزارع: مزارع الموردين ومصروفات المزارع وتعديلها */}
        {(activeWindow === 'w_farm' ||
          activeWindow === 'w_farm_name_edit' ||
          activeWindow === 'w_farm_exps' ||
          activeWindow === 'w_farm_exps_editing') && (
          <FarmWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 4. الموردون: مسحوبات المورد ورد النقدية ورصيد المسحوبات والإيرادات */}
        {(activeWindow === 'w_sup_sahb' ||
          activeWindow === 'w_sup_cashback' ||
          activeWindow === 'w_sup_sahb_balance' ||
          activeWindow === 'w_sup_revenues' ||
          activeWindow === 'w_farm_revenues') && (
          <SupplierSahbWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 4. تقارير وعمولات ومصروفات الموردين والمزارع (الـ 18 تقريراً) */}
        {(activeWindow === 'w_sup_comission_exps' ||
          activeWindow === 'w_rep_sup_comission_exps' ||
          activeWindow === 'w_rep_sup_safi_sahb' ||
          activeWindow === 'w_rep_farm_exps' ||
          activeWindow === 'w_rep_farm_specific_exp' ||
          activeWindow === 'w_rep_all_sups_safi_sahb' ||
          activeWindow === 'w_rep_all_sups_safi_sahb_period' ||
          activeWindow === 'w_rep_sup_dues' ||
          activeWindow === 'w_rep_all_farms_sahb' ||
          activeWindow === 'w_rep_all_farms_sahb_period' ||
          activeWindow === 'w_rep_farm_qty_revenues' ||
          activeWindow === 'w_rep_sup_fatora_masrofa' ||
          activeWindow === 'w_rep_sup_fatora_mostahaqa' ||
          activeWindow === 'w_rep_sup_comission_byaaa' ||
          activeWindow === 'w_rep_farm_comission_byaaa' ||
          activeWindow === 'w_rep_farm_fatora_masrofa' ||
          activeWindow === 'w_rep_farm_fatora_mostahaqa' ||
          activeWindow === 'w_rep_all_sups_accounts' ||
          activeWindow === 'w_rep_farm_price_diff') && (
          <SupplierFarmReportDialog
            mode={activeWindow}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 5.1 الزبائن: تسجيل زبون (الصورة 1) */}
        {activeWindow === 'w_customers' && (
          <CustomersWindow onClose={() => handleCloseWindow('w_customers')} />
        )}

        {/* 5.2 الزبائن: تحصيل ورهن الزبائن / تسجيل تحصيل اليوم (الصورة 2) */}
        {activeWindow === 'w_tahseel_rahn_customers' && (
          <CustomerTahseelRahnWindow onClose={() => handleCloseWindow('w_tahseel_rahn_customers')} />
        )}

        {/* 5.3 الزبائن: رد رهن نقدية اليوم (الصورة 3) */}
        {activeWindow === 'w_rad_rahn_nakdi_today' && (
          <CustomerRadRahnWindow mode="nakdi" onClose={() => handleCloseWindow('w_rad_rahn_nakdi_today')} />
        )}

        {/* 5.4 الزبائن: رد رهن زمام اليوم (الصورة 4) */}
        {activeWindow === 'w_rad_rahn_zemam_today' && (
          <CustomerRadRahnWindow mode="zemam" onClose={() => handleCloseWindow('w_rad_rahn_zemam_today')} />
        )}

        {/* 5.5 الزبائن: التقارير العشرة للزبائن (الصور 5 إلى 14) */}
        {(activeWindow === 'w_rep_customer_purchases' ||
          activeWindow === 'w_rep_customer_purchases_naklat' ||
          activeWindow === 'w_rep_customer_zemam_tahseel' ||
          activeWindow === 'w_rep_zemam_today' ||
          activeWindow === 'w_rep_sales_today' ||
          activeWindow === 'w_rep_customer_movement_detail' ||
          activeWindow === 'w_rep_zemam_today_detail' ||
          activeWindow === 'w_rep_sales_today_nakla' ||
          activeWindow === 'w_rep_sales_nakla' ||
          activeWindow === 'w_rep_avg_prices_nakla') && (
          <CustomerReportsPBWindow
            mode={activeWindow}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* باقي نماذج الزبائن القديمة (للتوافق) */}
        {(activeWindow === 'w_customer_name_edit' ||
          activeWindow === 'w_tahseel_today2' ||
          activeWindow === 'w_zemam_print' ||
          activeWindow === 'w_zemam_print_delay' ||
          activeWindow === 'w_customer_zemam_report_daily' ||
          activeWindow === 'w_customer_zemam_report_full') && (
          <CustomerLedgerWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
            onPrintReceipt={r => setPrintReceipt(r)}
          />
        )}

        {/* 5. الزبائن: تحصيل اليوم مع إيصال */}
        {activeWindow === 'w_tahseel_today' && (
          <TahseelWindow
            onClose={() => handleCloseWindow('w_tahseel_today')}
            onPrintReceipt={r => setPrintReceipt(r)}
          />
        )}

        {/* 5. الزبائن: رصيد الذمم وتقرير ذمم الزبائن */}
        {(activeWindow === 'w_zemam_balance' || activeWindow === 'w_customer_zemam_report') && (
          <ZemamWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 6.1 تسجيل الرهن (شاشة باور بيلدر المطابقة بالكامل) */}
        {activeWindow === 'w_rahn' && (
          <PackageRahnWindow onClose={() => handleCloseWindow('w_rahn')} />
        )}

        {/* 6.2 مستلزمات التعبئة ومحلات الكراتين */}
        {(activeWindow === 'w_package_sups' ||
          activeWindow === 'w_package_exp_name' ||
          activeWindow === 'w_package_sup_sahb' ||
          activeWindow === 'w_kratin_sup_sahb2' ||
          activeWindow === 'w_rep_kratin_account' ||
          activeWindow === 'w_rep_all_kratin_accounts' ||
          activeWindow === 'w_rep_sup_packaging_total' ||
          activeWindow === 'w_rep_sup_packaging_detail' ||
          activeWindow === 'w_rep_company_packaging_status' ||
          activeWindow === 'w_rep_sup_packaging_not_deducted' ||
          activeWindow === 'w_rep_all_sups_packaging_not_deducted' ||
          activeWindow === 'w_tahseel_rahn_nakdi' ||
          activeWindow === 'w_tahseel_rahn_nakdi_editing' ||
          activeWindow === 'w_tahseel_rahn_zemam' ||
          activeWindow === 'w_tahseel_rahn_zemam_editing') && (
          <PackagingManagementWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 7. المبيعات وإصدار الفاتورة */}
        {(activeWindow === 'w_fatora_f' ||
          activeWindow === 'w_fatora_f_mahel') && (
          <FatoraFWindow
            mode={activeWindow as any}
            initialNaklaId={selectedNaklaId}
            onClose={() => handleCloseWindow(activeWindow)}
            onPrintFatora={f => setPrintFatora(f)}
          />
        )}

        {/* 7. المبيعات: فاتورة بيع الموز */}
        {activeWindow === 'w_fatora' && (
          <FatoraBananaWindow onClose={() => handleCloseWindow('w_fatora')} />
        )}

        {/* 7. المبيعات: الأصناف والأرضية */}
        {(activeWindow === 'w_category' ||
          activeWindow === 'w_category_name_edit' ||
          activeWindow === 'w_ardia') && (
          <CategoriesWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 8. الخزينة: التقفيل اليومي وتقرير الخزينة */}
        {(activeWindow === 'w_khazna' ||
          activeWindow === 'w_rep_khazna' ||
          activeWindow === 'w_khazina_debit' ||
          activeWindow === 'w_receipt' ||
          activeWindow === 'w_service_income' ||
          activeWindow === 'w_service') && (
          <KhaznaWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 9. الفواتير: كافة شاشات ونماذج زر الفواتير (مطابق للباور بيلدر 9-1 إلى 9-11) */}
        {(activeWindow === 'w_esdar_fatora' ||
          activeWindow === 'w_print_fwateer' ||
          activeWindow === 'w_fwateer_print_sum' ||
          activeWindow === 'w_fwateer_print_sum_for_sup' ||
          activeWindow === 'w_fwateer_print_sum_for_farm' ||
          activeWindow === 'w_sarf_fatora_group' ||
          activeWindow === 'w_fatora_today_report' ||
          activeWindow === 'w_fatora_period_report' ||
          activeWindow === 'w_sarf_fatora_group_for_sup' ||
          activeWindow === 'w_sarf_fatora_group_for_farm' ||
          activeWindow === 'w_print_fwateer_diff_avg_price' ||
          activeWindow === 'w_sarf_fatora' ||
          activeWindow === 'w_fwateer_resale') && (
          <InvoicesManagementWindow
            mode={activeWindow as any}
            initialNaklaId={selectedNaklaId}
            onClose={() => handleCloseWindow(activeWindow)}
            onPrintFatora={f => setPrintFatora(f)}
            onPrintSarfFatora={s => setPrintSarf(s)}
          />
        )}

        {/* 10. التقارير العامة */}
        {(activeWindow === 'w_sales_report' ||
          activeWindow === 'w_sales_report_nakla' ||
          activeWindow === 'w_customer_sales_report' ||
          activeWindow === 'w_sup_shab_safi_report' ||
          activeWindow === 'w_sup_debit_credit_report' ||
          activeWindow === 'w_statistics') && (
          <ReportsWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 11. المصروفات */}
        {(activeWindow === 'w_branch_exps_total_report' ||
          activeWindow === 'w_company_exps' ||
          activeWindow === 'w_c_exps' ||
          activeWindow === 'w_exp_branch_search' ||
          activeWindow === 'w_exp_company_search' ||
          activeWindow === 'w_exp_farm_search') && (
          <BranchExpensesWindow onClose={() => handleCloseWindow(activeWindow)} />
        )}

        {/* 12. قاعدة البيانات: تعديل كلمة المرور وأرصدة مدينة */}
        {(activeWindow === 'db_restore' ||
          activeWindow === 'w_change_password_user' ||
          activeWindow === 'w_arseda_madeena') && (
          <DatabaseManagementWindow
            initialMode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 12-4 نافذة الاتصال بقاعدة بيانات SQL Server واستعراض الجداول (local1) */}
        {activeWindow === 'w_sql_server_connect' && (
          <SqlServerConnectWindow
            onClose={() => handleCloseWindow('w_sql_server_connect')}
          />
        )}

        {/* 13. التعديلات: فورم زر التعديلات بالكامل المطابق تماماً لشاشة الزبائن مع تعديل المسميات الشامل */}
        {(activeWindow === 'w_editing' ||
          activeWindow === 'w_nakla_editing' ||
          activeWindow === 'w_fatora_editing' ||
          activeWindow === 'w_tahseel_editing' ||
          activeWindow === 'w_branch_exps_editing' ||
          activeWindow === 'w_names_editing' ||
          activeWindow === 'w_customer_name_edit' ||
          activeWindow === 'w_sup_name_edit' ||
          activeWindow === 'w_farm_name_edit' ||
          activeWindow === 'w_category_name_edit') && (
          <EditsWindow
            initialMode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}

        {/* 14. الضرائب والتقفيل السنوي */}
        {(activeWindow === 'w_fwateer_print_tax' ||
          activeWindow === 'w_fwateer_print_tax_reprint' ||
          activeWindow === 'w_tax_report_irad' ||
          activeWindow === 'w_tax_report_masrofat' ||
          activeWindow === 'w_takfeel_sanawy') && (
          <TaxManagementWindow
            mode={activeWindow as any}
            onClose={() => handleCloseWindow(activeWindow)}
          />
        )}
      </main>

      {/* نوافذ الطباعة المنبثقة للطباعة الفورية على ورق A4 أو بونات */}
      {printFatora && (
        <FatoraPrintModal
          fatora={printFatora}
          company={dbState.company}
          onClose={() => setPrintFatora(null)}
        />
      )}

      {printSarf && (
        <SarfFatoraPrintModal
          settlement={printSarf}
          company={dbState.company}
          onClose={() => setPrintSarf(null)}
        />
      )}

      {printReceipt && (
        <TahseelReceiptModal
          receipt={printReceipt}
          company={dbState.company}
          onClose={() => setPrintReceipt(null)}
        />
      )}

      <VoiceDictationButton />
    </div>
  );
}
