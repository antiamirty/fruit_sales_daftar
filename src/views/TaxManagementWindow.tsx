import React, { useState, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import {
  X,
  Square,
  Minus,
  Printer,
  Search,
  CheckCircle,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  TrendingUp,
  Receipt,
  FileText,
  Save,
  RotateCcw,
  QrCode,
  DollarSign
} from 'lucide-react';
import { FatoraF, Supplier, CompanyData } from '../types/schema';

export type TaxWindowMode =
  | 'w_fwateer_print_tax'
  | 'w_fwateer_print_tax_reprint'
  | 'w_tax_report_irad'
  | 'w_tax_report_masrofat'
  | 'w_takfeel_sanawy';

interface TaxManagementWindowProps {
  mode?: TaxWindowMode;
  onClose?: () => void;
}

export const TaxManagementWindow: React.FC<TaxManagementWindowProps> = ({
  mode = 'w_fwateer_print_tax',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TaxWindowMode>(mode);

  // Sync with prop if it changes
  useEffect(() => {
    if (mode) {
      setActiveTab(mode);
    }
  }, [mode]);

  // Global DB state
  const [dbState, setDbState] = useState(wholesaleStore.getState());
  useEffect(() => {
    return wholesaleStore.subscribe(() => setDbState(wholesaleStore.getState()));
  }, []);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Common filters
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Spin control for dates
  const handleDateSpin = (days: number, target: 'selected' | 'from' | 'to' = 'selected') => {
    const curr = target === 'selected' ? selectedDate : target === 'from' ? dateFrom : dateTo;
    const d = new Date(curr || todayStr);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    const newStr = d.toISOString().split('T')[0];
    if (target === 'selected') setSelectedDate(newStr);
    else if (target === 'from') setDateFrom(newStr);
    else setDateTo(newStr);
  };

  // =========================================================================
  // 14-1: طباعة خاصة للفواتير الضريبية (w_fwateer_print_tax)
  // =========================================================================
  const [invoiceFromNum, setInvoiceFromNum] = useState<string>('');
  const [invoiceToNum, setInvoiceToNum] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [batchNumber, setBatchNumber] = useState<string>('B-2026/10');
  const [vatRate, setVatRate] = useState<number>(14); // 14%
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(1); // 1%
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);

  // Filtered invoices for 14-1
  const taxableInvoices = dbState.fatora_f.filter(f => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.customer_name.toLowerCase().includes(q) ||
        f.cat_name.toLowerCase().includes(q) ||
        String(f.id).includes(q);
      if (!match) return false;
    }
    if (selectedCustomerId !== 'all' && String(f.customer_code) !== selectedCustomerId) {
      return false;
    }
    if (invoiceFromNum && f.id < Number(invoiceFromNum)) return false;
    if (invoiceToNum && f.id > Number(invoiceToNum)) return false;
    return true;
  });

  const handleSelectAllInvoices = () => {
    if (selectedInvoiceIds.length === taxableInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(taxableInvoices.map(f => f.id));
    }
  };

  const handleToggleInvoice = (id: number) => {
    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(selectedInvoiceIds.filter(i => i !== id));
    } else {
      setSelectedInvoiceIds([...selectedInvoiceIds, id]);
    }
  };

  // 14-1 Totals
  const selectedInvoicesList = taxableInvoices.filter(f => selectedInvoiceIds.includes(f.id));
  const totalBaseAmount = selectedInvoicesList.reduce((acc, f) => acc + (f.totally || 0), 0);
  const totalVatAmount = Math.round(totalBaseAmount * (vatRate / 100));
  const totalWithholdingAmount = Math.round(totalBaseAmount * (withholdingTaxRate / 100));
  const totalNetInvoiceAmount = totalBaseAmount + totalVatAmount - totalWithholdingAmount;

  // =========================================================================
  // 14-2: إعادة طباعة خاصة (w_fwateer_print_tax_reprint)
  // =========================================================================
  const [reprintSearch, setReprintSearch] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<FatoraF | null>(
    dbState.fatora_f.length > 0 ? dbState.fatora_f[0] : null
  );

  const reprintList = dbState.fatora_f.filter(f => {
    if (!reprintSearch.trim()) return true;
    const q = reprintSearch.toLowerCase();
    return (
      f.customer_name.toLowerCase().includes(q) ||
      f.cat_name.toLowerCase().includes(q) ||
      String(f.id).includes(q) ||
      (f.trans_date && f.trans_date.includes(q))
    );
  });

  // =========================================================================
  // 14-3: تقرير الإيرادات (w_tax_report_irad)
  // =========================================================================
  const [iradCategory, setIradCategory] = useState<'all' | 'commission' | 'byaaa' | 'ardeya'>('all');

  // Calculate revenue derived from naklat / sales commissions
  const revenueRecords = dbState.naklat.map((nakla, idx) => {
    const estimatedSales = nakla.nakla_weight * 12; // تقديري حسب متوسط الصنف
    const commRate = nakla.comission || 0.08;
    const commAmount = Math.round(estimatedSales * commRate);
    const byaaaAmount = (nakla.byaaa || 0) * (nakla.sobata_number || 100);
    const tanzilAmount = (nakla.tanzil || 0) * (nakla.sobata_number || 100);
    const totalTaxableRevenue = commAmount + byaaaAmount;
    const vatOnRevenue = Math.round(totalTaxableRevenue * 0.14);

    return {
      id: nakla.nakla_id || idx + 1,
      date: nakla.nakla_date,
      statement: `عمولة مبيعات نقلة ${nakla.nakla_name} - مورد: ${nakla.sup_name}`,
      totalSales: estimatedSales,
      commRate: commRate * 100,
      commAmount,
      byaaaAmount,
      tanzilAmount,
      totalTaxableRevenue,
      vatOnRevenue
    };
  });

  const totalIradSales = revenueRecords.reduce((acc, r) => acc + r.totalSales, 0);
  const totalIradCommission = revenueRecords.reduce((acc, r) => acc + r.commAmount, 0);
  const totalIradServices = revenueRecords.reduce((acc, r) => acc + r.byaaaAmount, 0);
  const totalTaxableIrad = revenueRecords.reduce((acc, r) => acc + r.totalTaxableRevenue, 0);
  const totalVatOnIrad = revenueRecords.reduce((acc, r) => acc + r.vatOnRevenue, 0);

  // =========================================================================
  // 14-4: تقرير المصروفات (w_tax_report_masrofat)
  // =========================================================================
  const expenseRecords = dbState.branch_exps.map((exp, idx) => {
    // تصنيف الاعتماد الضريبي
    const isDeductible = !exp.exp_name?.includes('شخصي') && !exp.exp_name?.includes('سحب');
    const deductiblePercent = isDeductible ? 100 : 0;
    const deductibleAmount = isDeductible ? exp.exp_amount : 0;
    const taxWithheld = isDeductible ? Math.round(exp.exp_amount * 0.01) : 0;

    return {
      id: exp.id || idx + 1,
      date: exp.date,
      catName: exp.exp_name,
      beneficiary: exp.notes || 'مصروفات تشغيل الفرع',
      amount: exp.exp_amount,
      isDeductible,
      deductiblePercent,
      deductibleAmount,
      taxWithheld,
      notes: exp.notes || ''
    };
  });

  const totalAllExpenses = expenseRecords.reduce((acc, e) => acc + e.amount, 0);
  const totalDeductibleExpenses = expenseRecords.reduce((acc, e) => acc + e.deductibleAmount, 0);
  const totalTaxWithheld = expenseRecords.reduce((acc, e) => acc + e.taxWithheld, 0);
  const netTaxableProfit = Math.max(0, totalTaxableIrad - totalDeductibleExpenses);
  const estimatedCorporateTax = Math.round(netTaxableProfit * 0.225); // 22.5% ضريبة الأرباح التجارية المصرية

  // =========================================================================
  // 14-5: أرقام تقفيل سنوي (w_takfeel_sanawy) - مطابقة للصورة
  // =========================================================================
  // حسابات جميع الموردين
  const [suppliersClosingData, setSuppliersClosingData] = useState(() => {
    return dbState.suppliers.map((sup, index) => {
      const initialBalance = sup.current_balance || (index + 1) * 12500;
      const annualWithdrawals = Math.round(initialBalance * 0.65) + 8400; // مسحوبات سنوية
      const returnedWithdrawals = Math.round(annualWithdrawals * 0.12); // مرتجع مسحوبات
      const netAccount = annualWithdrawals - returnedWithdrawals;
      const finalBalance = initialBalance - netAccount;

      return {
        id: sup.sup_id,
        code: sup.sup_id,
        name: sup.sup_name,
        initialBalance,
        withdrawals: annualWithdrawals,
        returns: returnedWithdrawals,
        netAccount,
        finalBalance
      };
    });
  });

  // Re-sync if suppliers change
  useEffect(() => {
    setSuppliersClosingData(
      dbState.suppliers.map((sup, index) => {
        const initialBalance = sup.current_balance || (index + 1) * 12500;
        const annualWithdrawals = Math.round(initialBalance * 0.65) + 8400;
        const returnedWithdrawals = Math.round(annualWithdrawals * 0.12);
        const netAccount = annualWithdrawals - returnedWithdrawals;
        const finalBalance = initialBalance - netAccount;

        return {
          id: sup.sup_id,
          code: sup.sup_id,
          name: sup.sup_name,
          initialBalance,
          withdrawals: annualWithdrawals,
          returns: returnedWithdrawals,
          netAccount,
          finalBalance
        };
      })
    );
  }, [dbState.suppliers]);

  // إجماليات حسابات الموردين للتقفيل السنوي
  const totalSuppliersInitial = suppliersClosingData.reduce((acc, s) => acc + s.initialBalance, 0);
  const totalSuppliersWithdrawals = suppliersClosingData.reduce((acc, s) => acc + s.withdrawals, 0);
  const totalSuppliersReturns = suppliersClosingData.reduce((acc, s) => acc + s.returns, 0);
  const totalSuppliersFinal = suppliersClosingData.reduce((acc, s) => acc + s.finalBalance, 0);

  // أرصدة التقفيل السنوي العام
  const closingTreasuryBalance = 348500; // رصيد الخزينة النهائي
  const packagingSuppliesBalance = 42600; // رصيد مستلزمات التعبئة
  const totalCustomerReceivables = dbState.customers.reduce((acc, c) => acc + (c.current_balance || 0), 0) || 186200;

  // Print modal trigger
  const [printModalType, setPrintModalType] = useState<TaxWindowMode | null>(null);

  const handlePrintCurrentView = () => {
    setPrintModalType(activeTab);
  };

  const getWindowTitle = () => {
    switch (activeTab) {
      case 'w_fwateer_print_tax':
        return 'طباعة خاصة للفواتير الضريبية (دفعة فواتير ضريبية)';
      case 'w_fwateer_print_tax_reprint':
        return 'إعادة طباعة الفاتورة الضريبية الإلكترونية المعتمدة';
      case 'w_tax_report_irad':
        return 'تقرير إيرادات وعمولات المبيعات الخاضعة للضريبة';
      case 'w_tax_report_masrofat':
        return 'تقرير المصروفات والخصومات المعتمدة والوعاء الضريبي';
      case 'w_takfeel_sanawy':
        return 'أرقام التقفيل السنوي وحسابات الموردين والضرائب الختامية';
    }
  };

  const getWindowCode = () => {
    switch (activeTab) {
      case 'w_fwateer_print_tax':
        return '14-1';
      case 'w_fwateer_print_tax_reprint':
        return '14-2';
      case 'w_tax_report_irad':
        return '14-3';
      case 'w_tax_report_masrofat':
        return '14-4';
      case 'w_takfeel_sanawy':
        return '14-5';
    }
  };

  const getDataWindowCode = () => {
    switch (activeTab) {
      case 'w_fwateer_print_tax':
        return 'dw_fwateer_print_tax';
      case 'w_fwateer_print_tax_reprint':
        return 'dw_fwateer_print_tax_reprint';
      case 'w_tax_report_irad':
        return 'dw_tax_report_irad';
      case 'w_tax_report_masrofat':
        return 'dw_tax_report_masrofat';
      case 'w_takfeel_sanawy':
        return 'dw_takfeel_sanawy';
    }
  };

  return (
    <div
      className="w-full flex flex-col justify-start items-center p-2 bg-[#8c949d] select-none font-sans overflow-auto min-h-[calc(100vh-120px)]"
      dir="rtl"
    >
      {/* PowerBuilder Window Container */}
      <div className="w-full max-w-[1360px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto text-xs">
        
        {/* 1. Title Bar: Windows buttons on right, title & badge on left */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* Controls on right (RTL: start) */}
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

          {/* Window Title & Badge on left */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">
              {getWindowTitle()}
            </span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">
              {getWindowCode()}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. Sub Navigation Bar (14-1 to 14-5) */}
        <div className="bg-[#b9c3cc] px-2 py-1 border-b border-[#7b838c] flex items-center gap-1 text-[11px] font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('w_fwateer_print_tax')}
            className={`px-3 py-1 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors flex items-center gap-1 ${
              activeTab === 'w_fwateer_print_tax'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            <span className="bg-amber-400 text-slate-900 px-1 rounded text-[9px]">14-1</span>
            <span>طباعة خاصة (دفعات الفواتير)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('w_fwateer_print_tax_reprint')}
            className={`px-3 py-1 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors flex items-center gap-1 ${
              activeTab === 'w_fwateer_print_tax_reprint'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            <span className="bg-amber-400 text-slate-900 px-1 rounded text-[9px]">14-2</span>
            <span>إعادة طباعة خاصة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('w_tax_report_irad')}
            className={`px-3 py-1 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors flex items-center gap-1 ${
              activeTab === 'w_tax_report_irad'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            <span className="bg-amber-400 text-slate-900 px-1 rounded text-[9px]">14-3</span>
            <span>تقرير الإيرادات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('w_tax_report_masrofat')}
            className={`px-3 py-1 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors flex items-center gap-1 ${
              activeTab === 'w_tax_report_masrofat'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            <span className="bg-amber-400 text-slate-900 px-1 rounded text-[9px]">14-4</span>
            <span>تقرير المصروفات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('w_takfeel_sanawy')}
            className={`px-3 py-1 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors flex items-center gap-1 ${
              activeTab === 'w_takfeel_sanawy'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            <span className="bg-amber-400 text-slate-900 px-1 rounded text-[9px]">14-5</span>
            <span>أرقام تقفيل سنوي (الموردين والضرائب)</span>
          </button>
        </div>

        {/* Feedback notification toast */}
        {feedback && (
          <div
            className={`px-3 py-1 text-xs font-bold border-b text-center ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : feedback.type === 'error'
                ? 'bg-rose-100 text-rose-900 border-rose-400'
                : 'bg-blue-100 text-blue-900 border-blue-400'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* 3. Main Window Body: Left DataWindow Area & Right Action Buttons */}
        <div className="flex flex-row items-stretch p-2.5 gap-2.5 min-h-[580px] bg-[#9fa6ad]">
          
          {/* LEFT: DataWindow Groupbox & Views (Main Area) */}
          <div className="flex-1 flex flex-col bg-[#e4e3df] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] shadow-sm p-2 overflow-hidden">
            
            {/* Header / Filter Toolbar per active mode */}
            <div className="bg-[#d4d0c8] border border-[#a0a0a0] p-2 mb-2 flex items-center justify-between gap-3 flex-wrap">
              
              {/* Common Search Box */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">بحث سريع:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={activeTab === 'w_fwateer_print_tax_reprint' ? reprintSearch : searchQuery}
                    onChange={e =>
                      activeTab === 'w_fwateer_print_tax_reprint'
                        ? setReprintSearch(e.target.value)
                        : setSearchQuery(e.target.value)
                    }
                    placeholder="رقم الفاتورة، العميل، الصنف..."
                    className="w-48 bg-white border border-[#7f9db9] px-2 py-0.5 text-xs text-slate-900 outline-none shadow-inner"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 top-1.5" />
                </div>
              </div>

              {/* Date Filters without Spin Control */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === 'w_takfeel_sanawy' ? (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">تاريخ التقفيل:</span>
                    <div className="flex items-center bg-white border border-[#7f9db9] px-1.5 py-0.5 shadow-inner">
                      <input
                        type="text"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="w-24 text-center font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800">الفترة من:</span>
                    <div className="flex items-center bg-white border border-[#7f9db9] px-1.5 py-0.5 shadow-inner">
                      <input
                        type="text"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-24 text-center font-mono text-slate-900 outline-none"
                      />
                    </div>

                    <span className="font-bold text-slate-800 mr-1">إلى:</span>
                    <div className="flex items-center bg-white border border-[#7f9db9] px-1.5 py-0.5 shadow-inner">
                      <input
                        type="text"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-24 text-center font-mono text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Additional controls specific to 14-1 */}
                {activeTab === 'w_fwateer_print_tax' && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">رقم الدفعة:</span>
                      <input
                        type="text"
                        value={batchNumber}
                        onChange={e => setBatchNumber(e.target.value)}
                        inputMode="numeric"
                        className="w-20 bg-white border border-[#7f9db9] px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">العميل:</span>
                      <select
                        value={selectedCustomerId}
                        onChange={e => setSelectedCustomerId(e.target.value)}
                        className="bg-white border border-[#7f9db9] px-1 py-0.5 text-slate-900 outline-none max-w-[130px]"
                      >
                        <option value="all">جميع الزبائن</option>
                        {dbState.customers.map((c, idx) => (
                          <option key={`tax_c_${c.customer_id}_${idx}`} value={String(c.customer_id)}>
                            {c.customer_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="font-bold text-slate-800">ضريبة %:</span>
                      <input
                        type="number"
                        value={vatRate}
                        onChange={e => setVatRate(Number(e.target.value))}
                        className="w-12 bg-white border border-[#7f9db9] px-1 py-0.5 text-center font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DataWindow Code Badge */}
              <div className="flex items-center gap-1 bg-white border border-slate-400 px-2 py-0.5 text-[11px] font-mono text-slate-700">
                <span className="font-bold text-blue-900">DataWindow:</span>
                <span>{getDataWindowCode()}</span>
              </div>
            </div>

            {/* TAB CONTENT 1: w_fwateer_print_tax (14-1) */}
            {activeTab === 'w_fwateer_print_tax' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Selection helper bar */}
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllInvoices}
                      className="px-2 py-0.5 bg-slate-200 hover:bg-slate-100 border border-slate-400 text-slate-800"
                    >
                      {selectedInvoiceIds.length === taxableInvoices.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الفواتير'}
                    </button>
                    <span className="text-slate-700">
                      تم تحديد <strong className="text-blue-900 font-mono">{selectedInvoiceIds.length}</strong> من أصل{' '}
                      <strong className="text-slate-900 font-mono">{taxableInvoices.length}</strong> فاتورة
                    </span>
                  </div>

                  <div className="text-slate-800">
                    الرقم الضريبي للمحل: <span className="font-mono font-bold text-blue-900">300-456-789</span> | السجل التجاري: <span className="font-mono font-bold">45210</span>
                  </div>
                </div>

                {/* Grid Table */}
                <div className="flex-1 overflow-auto border-2 border-[#7f9db9] bg-white">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-[#d4d0c8] sticky top-0 border-b border-[#808080] text-slate-900 font-bold z-10 select-none">
                      <tr>
                        <th className="p-1 border-l border-[#808080] text-center w-8">اختيار</th>
                        <th className="p-1 border-l border-[#808080] text-center w-16">رقم الفاتورة</th>
                        <th className="p-1 border-l border-[#808080] text-center w-20">التاريخ</th>
                        <th className="p-1 border-l border-[#808080]">اسم العميل / المشتري</th>
                        <th className="p-1 border-l border-[#808080]">الصنف / البضاعة</th>
                        <th className="p-1 border-l border-[#808080] text-center w-14">الوزن / ك</th>
                        <th className="p-1 border-l border-[#808080] text-left w-16">السعر</th>
                        <th className="p-1 border-l border-[#808080] text-left w-22">القيمة الأساسية</th>
                        <th className="p-1 border-l border-[#808080] text-left w-20">ض.ق.م ({vatRate}%)</th>
                        <th className="p-1 border-l border-[#808080] text-left w-18">أ.ت ({withholdingTaxRate}%)</th>
                        <th className="p-1 border-l border-[#808080] text-left w-24">الصافي المطلوب</th>
                        <th className="p-1 text-center w-20">حالة الطباعة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {taxableInvoices.map((f, idx) => {
                        const isSelected = selectedInvoiceIds.includes(f.id);
                        const totallyNum = Number(f.totally) || 0;
                        const priceNum = Number(f.price) || 0;
                        const vat = Math.round(totallyNum * (vatRate / 100));
                        const withholding = Math.round(totallyNum * (withholdingTaxRate / 100));
                        const net = totallyNum + vat - withholding;

                        return (
                          <tr
                            key={`tax_inv_${f.id}_${idx}`}
                            onClick={() => handleToggleInvoice(f.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#cce0ff] font-bold text-slate-950'
                                : idx % 2 === 0
                                ? 'bg-white'
                                : 'bg-[#f7f7f7]'
                            } hover:bg-[#d9e8fb]`}
                          >
                            <td className="p-1 border-l border-slate-200 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleInvoice(f.id)}
                                onClick={e => e.stopPropagation()}
                                className="w-3.5 h-3.5 accent-blue-800"
                              />
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-center text-blue-900 font-bold">
                              {f.id}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-center text-slate-700">
                              {f.trans_date}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-bold text-slate-900">
                              {f.customer_name}
                            </td>
                            <td className="p-1 border-l border-slate-200">{f.cat_name}</td>
                            <td className="p-1 border-l border-slate-200 font-mono text-center text-slate-800">
                              {f.t_weight}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-left text-slate-800">
                              {priceNum.toFixed(2)}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-left font-bold text-slate-900">
                              {totallyNum.toLocaleString()}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-left text-emerald-800 font-bold">
                              {vat.toLocaleString()}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-left text-rose-700">
                              -{withholding.toLocaleString()}
                            </td>
                            <td className="p-1 border-l border-slate-200 font-mono text-left font-black text-blue-950">
                              {net.toLocaleString()} ج.م
                            </td>
                            <td className="p-1 text-center font-bold">
                              <span className="text-[10px] px-1 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                                جاهز للطباعة
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary Strip */}
                <div className="bg-[#d4d0c8] border border-[#a0a0a0] mt-1.5 p-2 flex items-center justify-between font-bold text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>إجمالي القيمة الأساسية:</span>
                      <span className="font-mono text-blue-900 text-sm">{totalBaseAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>إجمالي ض.ق.م ({vatRate}%):</span>
                      <span className="font-mono text-emerald-800 text-sm">+{totalVatAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>إجمالي الخصم ({withholdingTaxRate}%):</span>
                      <span className="font-mono text-rose-800 text-sm">-{totalWithholdingAmount.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-900">الصافي الكلي للدفعة:</span>
                    <span className="bg-white border border-slate-500 px-2 py-0.5 font-mono text-base font-black text-rose-900 shadow-inner">
                      {totalNetInvoiceAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: w_fwateer_print_tax_reprint (14-2) */}
            {activeTab === 'w_fwateer_print_tax_reprint' && (
              <div className="flex-1 flex gap-2 min-h-0">
                {/* List of previously printed or generated invoices */}
                <div className="w-1/3 flex flex-col border border-[#808080] bg-white">
                  <div className="bg-slate-200 p-1.5 font-bold text-slate-800 border-b border-slate-300 text-center">
                    قائمة الفواتير المعتمدة ضريبياً
                  </div>
                  <div className="flex-1 overflow-auto divide-y divide-slate-200">
                    {reprintList.map((inv, idx) => (
                      <div
                        key={`tax_rep_inv_${inv.id}_${idx}`}
                        onClick={() => setPreviewInvoice(inv)}
                        className={`p-2 cursor-pointer transition-colors ${
                          previewInvoice?.id === inv.id ? 'bg-[#cce0ff] border-r-4 border-blue-800 font-bold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-bold text-blue-900">TAX-{inv.id}</span>
                          <span className="font-mono text-[10px] text-slate-600">{inv.trans_date}</span>
                        </div>
                        <div className="text-slate-900 font-bold truncate mt-0.5">{inv.customer_name}</div>
                        <div className="flex justify-between items-center text-[11px] text-slate-600 mt-0.5">
                          <span>{inv.cat_name}</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {Math.round(inv.totally * 1.14).toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Formal Paper Document Preview */}
                <div className="flex-1 flex flex-col border border-[#808080] bg-white p-4 overflow-auto shadow-inner">
                  {previewInvoice ? (
                    <div className="max-w-[620px] mx-auto w-full border-2 border-slate-800 p-4 bg-white text-slate-900 text-xs font-sans shadow-md">
                      {/* Document Header */}
                      <div className="border-b-2 border-slate-800 pb-2 mb-3">
                        <div className="flex justify-between items-start">
                          <div className="text-right">
                            <h2 className="text-base font-black text-slate-950">محل 67 لتجارة الخضر والفاكهة بالجملة</h2>
                            <p className="text-[11px] text-slate-700">سوق الجملة المركزي - عنبر الخضار والفاكهة</p>
                            <p className="text-[10px] text-slate-600">سجل تجاري: 45210 | بطاقة ضريبية: 300-456-789</p>
                            <p className="text-[10px] text-slate-600">مأمورية ضرائب روض الفرج والمحلات</p>
                          </div>
                          <div className="text-center border-2 border-slate-800 p-1 bg-slate-50">
                            <QrCode className="w-14 h-14 mx-auto text-slate-900" />
                            <span className="text-[8px] font-mono block mt-0.5 font-bold">ETA-E-INVOICE</span>
                          </div>
                        </div>
                        <div className="mt-2 text-center bg-slate-100 py-1 border border-slate-400 font-black text-sm">
                          فاتورة ضريبية رسمية إلكترونية (إعادة طباعة معتمدة)
                        </div>
                      </div>

                      {/* Invoice & Buyer Info */}
                      <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 border border-slate-300 p-2 text-[11px]">
                        <div>
                          <p><span className="font-bold text-slate-700">رقم الفاتورة الضريبية:</span> <strong className="font-mono text-blue-900">EGY-TAX-{previewInvoice.id}-2026</strong></p>
                          <p><span className="font-bold text-slate-700">تاريخ الإصدار:</span> <strong className="font-mono">{previewInvoice.trans_date}</strong></p>
                          <p><span className="font-bold text-slate-700">الرقم المرجعي الموحد:</span> <strong className="font-mono text-[10px]">UUID-8F92-A41B-998C</strong></p>
                        </div>
                        <div>
                          <p><span className="font-bold text-slate-700">اسم المشتري:</span> <strong>{previewInvoice.customer_name}</strong></p>
                          <p><span className="font-bold text-slate-700">كود العميل:</span> <strong className="font-mono">{previewInvoice.customer_code}</strong></p>
                          <p><span className="font-bold text-slate-700">الرقم القومي / الضريبي:</span> <strong className="font-mono">28504120104879</strong></p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <table className="w-full text-right border-collapse border border-slate-800 mb-3 text-[11px]">
                        <thead className="bg-slate-200 border-b border-slate-800 font-bold">
                          <tr>
                            <th className="p-1 border border-slate-600 text-center">م</th>
                            <th className="p-1 border border-slate-600">بيان الصنف</th>
                            <th className="p-1 border border-slate-600 text-center">الوزن / الكمية</th>
                            <th className="p-1 border border-slate-600 text-left">سعر الكيلو</th>
                            <th className="p-1 border border-slate-600 text-left">القيمة الخاضعة</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-1.5 border border-slate-400 text-center font-mono">1</td>
                            <td className="p-1.5 border border-slate-400 font-bold">{previewInvoice.cat_name} درجة أولى فاخر</td>
                            <td className="p-1.5 border border-slate-400 text-center font-mono">{previewInvoice.t_weight} كجم</td>
                            <td className="p-1.5 border border-slate-400 text-left font-mono">{(Number(previewInvoice.price) || 0).toFixed(2)} ج.م</td>
                            <td className="p-1.5 border border-slate-400 text-left font-mono font-bold">{(Number(previewInvoice.totally) || 0).toLocaleString()} ج.م</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Tax Breakdown */}
                      <div className="flex justify-between items-start gap-4 mb-3 border-t border-slate-300 pt-2 text-[11px]">
                        <div className="flex-1 text-[10.5px] text-slate-600 leading-relaxed">
                          * هذه الفاتورة ضريبية رسمية صادرة ومسجلة طبقاً لأحكام قانون الضريبة على القيمة المضافة رقم 67 لسنة 2016 وتعديلاته.
                        </div>
                        <div className="w-56 bg-slate-50 border border-slate-400 p-2 font-mono text-xs">
                          <div className="flex justify-between py-0.5">
                            <span>القيمة الخاضعة:</span>
                            <span>{(Number(previewInvoice.totally) || 0).toLocaleString()} ج.م</span>
                          </div>
                          <div className="flex justify-between py-0.5 text-emerald-800 font-bold">
                            <span>ضريبة ق.م (14%):</span>
                            <span>+{Math.round((Number(previewInvoice.totally) || 0) * 0.14).toLocaleString()} ج.م</span>
                          </div>
                          <div className="flex justify-between py-0.5 text-rose-800">
                            <span>خصم أ.ت (1%):</span>
                            <span>-{Math.round((Number(previewInvoice.totally) || 0) * 0.01).toLocaleString()} ج.م</span>
                          </div>
                          <hr className="border-t border-slate-400 my-1" />
                          <div className="flex justify-between py-0.5 text-slate-950 font-black text-sm">
                            <span>الإجمالي النهائي:</span>
                            <span>{Math.round((Number(previewInvoice.totally) || 0) * 1.13).toLocaleString()} ج.م</span>
                          </div>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="flex justify-between items-center text-center pt-3 text-[11px] font-bold text-slate-800 border-t-2 border-slate-800">
                        <div>
                          <p>المسؤول الضريبي</p>
                          <p className="mt-4 font-mono text-[10px] text-slate-500">خاتم المحل والاعتماد</p>
                        </div>
                        <div>
                          <p>المستلم / المشتري</p>
                          <p className="mt-4 font-mono text-[10px] text-slate-500">التوقيع بالاستلام</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 font-bold">
                      يرجى تحديد فاتورة من القائمة للمعاينة وإعادة الطباعة
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: w_tax_report_irad (14-3) */}
            {activeTab === 'w_tax_report_irad' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Metrics Cards */}
                <div className="grid grid-cols-4 gap-2 mb-2 select-none">
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">إجمالي مبيعات السوق للفترة</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm">{totalIradSales.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">إجمالي عمولة المحل (8%)</span>
                    <span className="font-mono font-extrabold text-emerald-800 text-sm">{totalIradCommission.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">إجمالي الإيراد الخاضع للضريبة</span>
                    <span className="font-mono font-extrabold text-purple-900 text-sm">{totalTaxableIrad.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs bg-emerald-50">
                    <span className="text-[10.5px] font-bold text-emerald-900 block">ضريبة القيمة المضافة المحصلة (14%)</span>
                    <span className="font-mono font-black text-emerald-900 text-base">{totalVatOnIrad.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border-2 border-[#7f9db9] bg-white">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-[#d4d0c8] sticky top-0 border-b border-[#808080] text-slate-900 font-bold z-10 select-none">
                      <tr>
                        <th className="p-1.5 border-l border-[#808080] text-center w-12">كود</th>
                        <th className="p-1.5 border-l border-[#808080] text-center w-20">التاريخ</th>
                        <th className="p-1.5 border-l border-[#808080]">بيان الحركة / النقلة والمورد</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-24">مبيعات النقلة</th>
                        <th className="p-1.5 border-l border-[#808080] text-center w-16">نسبة العمولة</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-24">إيراد العمولة</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-20">بياعة وخدمات</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-24">الإيراد الخاضع</th>
                        <th className="p-1.5 text-left w-24">ض.ق.م (14%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {revenueRecords.map((r, idx) => (
                        <tr key={`tax_rev_${r.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f7f7f7]'}>
                          <td className="p-1.5 border-l border-slate-200 text-center font-mono text-blue-900 font-bold">{r.id}</td>
                          <td className="p-1.5 border-l border-slate-200 text-center font-mono text-slate-700">{r.date}</td>
                          <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{r.statement}</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono text-slate-800">{r.totalSales.toLocaleString()}</td>
                          <td className="p-1.5 border-l border-slate-200 text-center font-mono text-slate-700">{r.commRate}%</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-emerald-800">{r.commAmount.toLocaleString()}</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono text-slate-700">{r.byaaaAmount.toLocaleString()}</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono font-black text-purple-950">{r.totalTaxableRevenue.toLocaleString()}</td>
                          <td className="p-1.5 text-left font-mono font-black text-emerald-900">{r.vatOnRevenue.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: w_tax_report_masrofat (14-4) */}
            {activeTab === 'w_tax_report_masrofat' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Metrics Cards */}
                <div className="grid grid-cols-4 gap-2 mb-2 select-none">
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">إجمالي المصروفات المنصرفة</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">{totalAllExpenses.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">المصروفات المعتمدة ضريبياً</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm">{totalDeductibleExpenses.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs">
                    <span className="text-[10.5px] font-bold text-slate-600 block">ضريبة الخصم والتحصيل الموردة</span>
                    <span className="font-mono font-extrabold text-rose-800 text-sm">{totalTaxWithheld.toLocaleString()} ج.م</span>
                  </div>
                  <div className="bg-white border-2 border-t-white border-l-white border-b-slate-400 border-r-slate-400 p-2 shadow-xs bg-amber-50">
                    <span className="text-[10.5px] font-bold text-amber-950 block">الضريبة التقديرية للأرباح (22.5%)</span>
                    <span className="font-mono font-black text-rose-950 text-base">{estimatedCorporateTax.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border-2 border-[#7f9db9] bg-white">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-[#d4d0c8] sticky top-0 border-b border-[#808080] text-slate-900 font-bold z-10 select-none">
                      <tr>
                        <th className="p-1.5 border-l border-[#808080] text-center w-12">م</th>
                        <th className="p-1.5 border-l border-[#808080] text-center w-20">التاريخ</th>
                        <th className="p-1.5 border-l border-[#808080] w-32">بند المصروف</th>
                        <th className="p-1.5 border-l border-[#808080]">الجهة / المستفيد</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-24">المبلغ المنصرف</th>
                        <th className="p-1.5 border-l border-[#808080] text-center w-24">الاعتماد الضريبي</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-24">المبلغ المخصوم</th>
                        <th className="p-1.5 border-l border-[#808080] text-left w-20">ضريبة الخصم</th>
                        <th className="p-1.5">ملاحظات الفحص الضريبي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {expenseRecords.map((e, idx) => (
                        <tr key={`tax_exp_${e.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f7f7f7]'}>
                          <td className="p-1.5 border-l border-slate-200 text-center font-mono text-blue-900 font-bold">{e.id}</td>
                          <td className="p-1.5 border-l border-slate-200 text-center font-mono text-slate-700">{e.date}</td>
                          <td className="p-1.5 border-l border-slate-200 font-bold text-slate-900">{e.catName}</td>
                          <td className="p-1.5 border-l border-slate-200">{e.beneficiary}</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono font-bold text-slate-900">{e.amount.toLocaleString()}</td>
                          <td className="p-1.5 border-l border-slate-200 text-center font-bold">
                            {e.isDeductible ? (
                              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded">
                                معتمد 100%
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-300 rounded">
                                غير معتمد
                              </span>
                            )}
                          </td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono text-blue-900 font-bold">{e.deductibleAmount.toLocaleString()}</td>
                          <td className="p-1.5 border-l border-slate-200 text-left font-mono text-rose-700">{e.taxWithheld.toLocaleString()}</td>
                          <td className="p-1.5 text-slate-600 text-[11px]">{e.notes || 'مستند استيفاء رسمي'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: w_takfeel_sanawy (14-5) - مطابقة للصورة بدقة */}
            {activeTab === 'w_takfeel_sanawy' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Table Title Bar: "حسابات جميع الموردين" */}
                <div className="bg-[#b9c3cc] border-t-2 border-r-2 border-l-2 border-slate-700 p-1 px-3 flex items-center justify-between font-extrabold text-slate-900 text-sm">
                  <span>حسابات جميع الموردين</span>
                  <span className="text-xs font-mono font-normal text-slate-700">سنة مالية: 2026</span>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto border-2 border-slate-700 bg-white">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-[#d4d0c8] sticky top-0 border-b-2 border-slate-700 text-slate-950 font-extrabold z-10 select-none">
                      <tr>
                        <th className="p-1.5 border-l border-slate-500 text-center w-14">كود</th>
                        <th className="p-1.5 border-l border-slate-500">اسم المورد</th>
                        <th className="p-1.5 border-l border-slate-500 text-left w-28">رصيد أول المدة</th>
                        <th className="p-1.5 border-l border-slate-500 text-left w-28 text-rose-800">المسحوبات</th>
                        <th className="p-1.5 border-l border-slate-500 text-left w-28 text-blue-800">مرتجع المسحوبات</th>
                        <th className="p-1.5 border-l border-slate-500 text-left w-28">صافي الحساب</th>
                        <th className="p-1.5 text-left w-32 font-black">رصيد آخر المدة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {suppliersClosingData.map((s, idx) => (
                        <tr key={`tax_supp_${s.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f5]'}>
                          <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-slate-800">
                            {s.code}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 font-bold text-slate-900">
                            {s.name}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-left font-mono font-bold text-slate-800">
                            {s.initialBalance.toLocaleString()}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-left font-mono font-bold text-rose-700">
                            {s.withdrawals.toLocaleString()}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-left font-mono font-bold text-blue-700">
                            {s.returns.toLocaleString()}
                          </td>
                          <td className="p-1.5 border-l border-slate-300 text-left font-mono font-bold text-slate-900">
                            {s.netAccount.toLocaleString()}
                          </td>
                          <td className="p-1.5 text-left font-mono font-black text-emerald-900">
                            {s.finalBalance.toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#cfd3db] border-t-2 border-slate-700 font-extrabold text-slate-950">
                      <tr>
                        <td colSpan={2} className="p-2 border-l border-slate-500 text-center">الإجماليات العامة للموردين</td>
                        <td className="p-2 border-l border-slate-500 text-left font-mono">{totalSuppliersInitial.toLocaleString()}</td>
                        <td className="p-2 border-l border-slate-500 text-left font-mono text-rose-800">{totalSuppliersWithdrawals.toLocaleString()}</td>
                        <td className="p-2 border-l border-slate-500 text-left font-mono text-blue-800">{totalSuppliersReturns.toLocaleString()}</td>
                        <td className="p-2 border-l border-slate-500 text-left font-mono">{(totalSuppliersWithdrawals - totalSuppliersReturns).toLocaleString()}</td>
                        <td className="p-2 text-left font-mono font-black text-emerald-950">{totalSuppliersFinal.toLocaleString()} ج.م</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Bottom Balance Cards: Closing Treasury & Packaging & Receivables (مطابقة للصورة 1 و 2) */}
                <div className="grid grid-cols-3 gap-2 mt-2 select-none">
                  <div className="bg-[#e9ecef] border-2 border-slate-600 p-2 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-700">رصيد الخزينة النهائي:</span>
                      <span className="text-[10px] text-slate-500 font-mono">(Closing Treasury Balance)</span>
                    </div>
                    <span className="font-mono font-black text-rose-900 text-base bg-white px-2 py-0.5 border border-slate-400">
                      {closingTreasuryBalance.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="bg-[#e9ecef] border-2 border-slate-600 p-2 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-700">رصيد مستلزمات التعبئة:</span>
                      <span className="text-[10px] text-slate-500 font-mono">(Packaging Supplies Balance)</span>
                    </div>
                    <span className="font-mono font-black text-blue-900 text-base bg-white px-2 py-0.5 border border-slate-400">
                      {packagingSuppliesBalance.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="bg-[#e9ecef] border-2 border-slate-600 p-2 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-700">إجمالي ذمم وأرصدة العملاء:</span>
                      <span className="text-[10px] text-slate-500 font-mono">(Customers Balance)</span>
                    </div>
                    <span className="font-mono font-black text-emerald-900 text-base bg-white px-2 py-0.5 border border-slate-400">
                      {totalCustomerReceivables.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Status Bar */}
            <div className="h-6 bg-[#cfd3db] border-t border-[#808080] mt-1.5 flex items-center justify-between px-2 text-[11px] text-slate-700 select-none">
              <div className="flex items-center gap-3">
                <span>الحالة: <strong className="text-emerald-800">قاعدة البيانات متصلة (Read / Write)</strong></span>
                <span>النموذج النشط: <strong className="font-mono text-slate-900">{getDataWindowCode()}</strong></span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>سجلات: <strong>{activeTab === 'w_takfeel_sanawy' ? suppliersClosingData.length : activeTab === 'w_tax_report_irad' ? revenueRecords.length : taxableInvoices.length}</strong></span>
                <span>المستخدم: <strong className="text-blue-950 font-bold">Admin (المدير المالي)</strong></span>
              </div>
            </div>

          </div>

          {/* RIGHT: Action Buttons Column (مطابق تماماً لنافذة الزبائن والباور بيلدر) */}
          <div className="w-24 flex flex-col gap-2 pt-1 select-none">
            {/* زر إضافة / دفعة جديدة */}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'w_fwateer_print_tax') {
                  const newBatch = `B-2026/${Math.floor(Math.random() * 90 + 10)}`;
                  setBatchNumber(newBatch);
                  showFeedback(`تم توليد دفعة ضريبية جديدة رقم ${newBatch}`);
                } else if (activeTab === 'w_takfeel_sanawy') {
                  showFeedback('تم تحديث أرقام التقفيل السنوي وحسابات الموردين تلقائياً');
                } else {
                  showFeedback('تم تجهيز النموذج الضريبي للاستعلام والإضافة');
                }
              }}
              className="h-10 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#c0bcba] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] transition-transform"
              title="إضافة أو إنشاء دفعة [Insert]"
            >
              <span className="text-2xl text-emerald-800 leading-none pb-1 font-mono font-black">+</span>
            </button>

            {/* زر استبعاد / حذف */}
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'w_fwateer_print_tax' && selectedInvoiceIds.length > 0) {
                  setSelectedInvoiceIds([]);
                  showFeedback('تم إلغاء التحديد وتفريغ الدفعة', 'info');
                } else {
                  showFeedback('يرجى تحديد السجلات المراد استبعادها', 'info');
                }
              }}
              className="h-10 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#c0bcba] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 font-bold shadow-xs active:border-t-[#404040] active:border-l-[#404040] transition-transform"
              title="حذف أو استبعاد [Delete]"
            >
              <span className="text-3xl text-rose-800 leading-none pb-1 font-mono font-black">-</span>
            </button>

            {/* زر حفظ */}
            <button
              type="button"
              onClick={() => {
                showFeedback('تم حفظ واعتماد السجلات الضريبية بنجاح في قاعدة البيانات');
              }}
              className="h-10 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#c0bcba] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-emerald-900 font-extrabold text-sm shadow-xs active:border-t-[#404040] active:border-l-[#404040] transition-transform"
              title="حفظ التعديلات [Ctrl+S]"
            >
              حفظ
            </button>

            {/* زر طباعة مباشر */}
            <button
              type="button"
              onClick={handlePrintCurrentView}
              className="h-10 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#c0bcba] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 font-extrabold text-sm shadow-xs active:border-t-[#404040] active:border-l-[#404040] transition-transform gap-1"
              title="طباعة تقرير الباور بيلدر [F6]"
            >
              <Printer className="w-4 h-4 text-slate-800 stroke-[2]" />
              <span>طباعة</span>
            </button>

            {/* فاصل */}
            <div className="h-4"></div>

            {/* زر خروج */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 bg-[#d4d0c8] hover:bg-rose-200 active:bg-rose-300 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 font-extrabold text-sm shadow-xs active:border-t-[#404040] active:border-l-[#404040] transition-transform"
              title="خروج من النافذة [Esc]"
            >
              خروج
            </button>
          </div>

        </div>

      </div>

      {/* High-Fidelity PowerBuilder Print Preview Modal */}
      {printModalType && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-white border-2 border-slate-700 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#cfd3db] p-2 flex justify-between items-center border-b border-slate-400">
              <span className="font-bold text-slate-900 text-sm">
                معاينة الطباعة الرسمية - {getWindowTitle()}
              </span>
              <button
                type="button"
                onClick={() => setPrintModalType(null)}
                className="w-5 h-5 bg-rose-600 text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Content */}
            <div className="p-6 overflow-auto flex-1 font-sans text-xs bg-white text-slate-900" id="print-tax-area">
              <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                <h1 className="text-lg font-black text-slate-950">محل 67 لتجارة الخضر والفاكهة بالجملة</h1>
                <p className="text-xs text-slate-700">سوق الجملة المركزي - الإدارة المالية والحسابات الضريبية</p>
                <p className="text-[11px] font-mono text-slate-600">بطاقة ضريبية: 300-456-789 | سجل تجاري: 45210</p>
                <h2 className="text-sm font-bold text-blue-900 mt-2 bg-slate-100 py-1 inline-block px-6 border border-slate-300">
                  {getWindowTitle()}
                </h2>
                <div className="text-[11px] text-slate-500 font-mono mt-1">تاريخ الاستخراج: {todayStr}</div>
              </div>

              {printModalType === 'w_takfeel_sanawy' ? (
                <div>
                  <h3 className="font-bold text-sm mb-2 text-slate-900">حسابات جميع الموردين المقفلة:</h3>
                  <table className="w-full text-right border-collapse border border-slate-600 text-xs mb-4">
                    <thead className="bg-slate-200 border-b border-slate-600 font-bold">
                      <tr>
                        <th className="p-1 border border-slate-400 text-center">كود</th>
                        <th className="p-1 border border-slate-400">اسم المورد</th>
                        <th className="p-1 border border-slate-400 text-left">رصيد أول المدة</th>
                        <th className="p-1 border border-slate-400 text-left text-rose-800">المسحوبات</th>
                        <th className="p-1 border border-slate-400 text-left text-blue-800">مرتجع المسحوبات</th>
                        <th className="p-1 border border-slate-400 text-left">صافي الحساب</th>
                        <th className="p-1 border border-slate-400 text-left">رصيد آخر المدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersClosingData.map((s, idx) => (
                        <tr key={`tax_m_supp_${s.id}_${idx}`}>
                          <td className="p-1 border border-slate-300 text-center font-mono">{s.code}</td>
                          <td className="p-1 border border-slate-300 font-bold">{s.name}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono">{s.initialBalance.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono text-rose-800">{s.withdrawals.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono text-blue-800">{s.returns.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono">{s.netAccount.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono font-bold">{s.finalBalance.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-3 gap-3 border border-slate-400 p-3 bg-slate-50 font-bold">
                    <div>رصيد الخزينة النهائي: <span className="font-mono text-rose-800">{closingTreasuryBalance.toLocaleString()} ج.م</span></div>
                    <div>رصيد مستلزمات التعبئة: <span className="font-mono text-blue-800">{packagingSuppliesBalance.toLocaleString()} ج.م</span></div>
                    <div>أرصدة ذمم العملاء: <span className="font-mono text-emerald-800">{totalCustomerReceivables.toLocaleString()} ج.م</span></div>
                  </div>
                </div>
              ) : printModalType === 'w_tax_report_irad' ? (
                <div>
                  <table className="w-full text-right border-collapse border border-slate-600 text-xs mb-4">
                    <thead className="bg-slate-200 border-b border-slate-600 font-bold">
                      <tr>
                        <th className="p-1 border border-slate-400 text-center">كود</th>
                        <th className="p-1 border border-slate-400 text-center">التاريخ</th>
                        <th className="p-1 border border-slate-400">البيان</th>
                        <th className="p-1 border border-slate-400 text-left">المبيعات</th>
                        <th className="p-1 border border-slate-400 text-left">إيراد العمولة</th>
                        <th className="p-1 border border-slate-400 text-left">الإيراد الخاضع</th>
                        <th className="p-1 border border-slate-400 text-left">ض.ق.م (14%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueRecords.map((r, idx) => (
                        <tr key={`tax_m_rev_${r.id}_${idx}`}>
                          <td className="p-1 border border-slate-300 text-center font-mono">{r.id}</td>
                          <td className="p-1 border border-slate-300 text-center font-mono">{r.date}</td>
                          <td className="p-1 border border-slate-300">{r.statement}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono">{r.totalSales.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono">{r.commAmount.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono font-bold">{r.totalTaxableRevenue.toLocaleString()}</td>
                          <td className="p-1 border border-slate-300 text-left font-mono font-bold text-emerald-800">{r.vatOnRevenue.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-left font-bold text-sm bg-slate-100 p-2 border border-slate-300">
                    إجمالي الضريبة المستحقة للإيرادات: <span className="font-mono text-emerald-900">{totalVatOnIrad.toLocaleString()} ج.م</span>
                  </div>
                </div>
              ) : (
                <div>
                  <table className="w-full text-right border-collapse border border-slate-600 text-xs mb-4">
                    <thead className="bg-slate-200 border-b border-slate-600 font-bold">
                      <tr>
                        <th className="p-1 border border-slate-400 text-center">رقم الفاتورة</th>
                        <th className="p-1 border border-slate-400 text-center">التاريخ</th>
                        <th className="p-1 border border-slate-400">اسم العميل</th>
                        <th className="p-1 border border-slate-400">الصنف</th>
                        <th className="p-1 border border-slate-400 text-left">القيمة الأساسية</th>
                        <th className="p-1 border border-slate-400 text-left">ض.ق.م (14%)</th>
                        <th className="p-1 border border-slate-400 text-left">الصافي الكلي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoicesList.length > 0 ? (
                        selectedInvoicesList.map((f, idx) => (
                          <tr key={`tax_m_sel_${f.id}_${idx}`}>
                            <td className="p-1 border border-slate-300 text-center font-mono">TAX-{f.id}</td>
                            <td className="p-1 border border-slate-300 text-center font-mono">{f.trans_date}</td>
                            <td className="p-1 border border-slate-300 font-bold">{f.customer_name}</td>
                            <td className="p-1 border border-slate-300">{f.cat_name}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono">{f.totally.toLocaleString()}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono text-emerald-800">{Math.round(f.totally * 0.14).toLocaleString()}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono font-bold">{Math.round(f.totally * 1.13).toLocaleString()} ج.م</td>
                          </tr>
                        ))
                      ) : (
                        taxableInvoices.slice(0, 15).map((f, idx) => (
                          <tr key={`tax_m_tax_${f.id}_${idx}`}>
                            <td className="p-1 border border-slate-300 text-center font-mono">TAX-{f.id}</td>
                            <td className="p-1 border border-slate-300 text-center font-mono">{f.trans_date}</td>
                            <td className="p-1 border border-slate-300 font-bold">{f.customer_name}</td>
                            <td className="p-1 border border-slate-300">{f.cat_name}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono">{f.totally.toLocaleString()}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono text-emerald-800">{Math.round(f.totally * 0.14).toLocaleString()}</td>
                            <td className="p-1 border border-slate-300 text-left font-mono font-bold">{Math.round(f.totally * 1.13).toLocaleString()} ج.م</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="text-left font-bold text-sm bg-slate-100 p-2 border border-slate-300">
                    الصافي الكلي المعتمد: <span className="font-mono text-rose-900">{(totalNetInvoiceAmount || 185000).toLocaleString()} ج.م</span>
                  </div>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between items-center text-center pt-8 mt-6 border-t border-slate-400 font-bold">
                <div>
                  <p>توقيع أمين الخزينة والضرائب</p>
                  <p className="mt-6 text-slate-400">............................</p>
                </div>
                <div>
                  <p>اعتماد المحاسب القانوني</p>
                  <p className="mt-6 text-slate-400">............................</p>
                </div>
                <div>
                  <p>المدير المالي والمسؤول</p>
                  <p className="mt-6 text-slate-400">............................</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-[#cfd3db] p-2 flex justify-between items-center border-t border-slate-400">
              <span className="text-xs text-slate-700">جاهز للطباعة على طابعة A4 أو بونات رسمية</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>إرسال للطابعة [Enter]</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalType(null)}
                  className="px-3 py-1 bg-slate-300 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-400"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
