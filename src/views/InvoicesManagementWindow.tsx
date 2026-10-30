import React, { useState, useEffect, useMemo } from 'react';
import { wholesaleStore } from '../services/storage';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Layers,
  Building2,
  Truck,
  ArrowUpDown,
  RotateCcw,
  Eye,
  X,
  Minus,
  Maximize2,
  Check
} from 'lucide-react';
import { FatoraF, SafiFatora, Supplier, Farm, Nakla, Category } from '../types/schema';

export type InvoiceWindowMode =
  | 'w_esdar_fatora'
  | 'w_print_fwateer'
  | 'w_fwateer_print_sum'
  | 'w_fwateer_print_sum_for_sup'
  | 'w_fwateer_print_sum_for_farm'
  | 'w_sarf_fatora_group'
  | 'w_fatora_today_report'
  | 'w_fatora_period_report'
  | 'w_sarf_fatora_group_for_sup'
  | 'w_sarf_fatora_group_for_farm'
  | 'w_print_fwateer_diff_avg_price'
  | 'w_sarf_fatora';

interface InvoicesManagementWindowProps {
  mode?: InvoiceWindowMode;
  initialNaklaId?: number;
  onClose?: () => void;
  onPrintFatora?: (fatora: FatoraF) => void;
  onPrintSarfFatora?: (settlement: SafiFatora) => void;
}

export const InvoicesManagementWindow: React.FC<InvoicesManagementWindowProps> = ({
  mode = 'w_esdar_fatora',
  initialNaklaId,
  onClose,
  onPrintFatora,
  onPrintSarfFatora
}) => {
  const [activeTab, setActiveTab] = useState<InvoiceWindowMode>(mode);

  // Sync prop changes
  useEffect(() => {
    if (mode) {
      setActiveTab(mode);
    }
  }, [mode]);

  // Global store sync
  const [db, setDb] = useState(wholesaleStore.getState());
  useEffect(() => {
    return wholesaleStore.subscribe(() => setDb(wholesaleStore.getState()));
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Feedback notifications
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showNotice = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Shared Filters
  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>(todayStr);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('الكل');
  const [selectedFarm, setSelectedFarm] = useState<string>('الكل');
  const [selectedNaklaFilter, setSelectedNaklaFilter] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'credit'>('all');
  const [sarfFilter, setSarfFilter] = useState<'all' | 'unsarfed' | 'sarfed'>('unsarfed');

  // Multi-selection state for batch screens
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Preview / Print Modal state
  const [previewFatora, setPreviewFatora] = useState<FatoraF | null>(null);
  const [batchPrintModal, setBatchPrintModal] = useState<{
    title: string;
    invoices: FatoraF[];
    supplierName?: string;
    farmName?: string;
  } | null>(null);

  // ==========================================
  // TAB 1: إصدار فاتورة (w_esdar_fatora) State
  // تحويل النقلة من نقلة بالمبيعات إلى فاتورة ملخصة في حالة حفظ النقلة
  // ==========================================
  const naklatList = db.naklat || [];
  const defaultNakla =
    naklatList.find(n => n.nakla_name === 'الحاج احمد شتا 1') ||
    naklatList.find(n => n.nakla_id === initialNaklaId) ||
    naklatList[0];

  const [selectedNaklaId, setSelectedNaklaId] = useState<number>(defaultNakla?.nakla_id || 1);
  const currentNakla = naklatList.find(n => n.nakla_id === selectedNaklaId) || defaultNakla;

  const [esdarSupFilter, setEsdarSupFilter] = useState<string>(currentNakla?.sup_name || 'الحاج احمد شتا');
  const [isEditCommission, setIsEditCommission] = useState<boolean>(false);
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(currentNakla?.comission || 0.10);
  const [customCommissionAmount, setCustomCommissionAmount] = useState<number | null>(null);
  const [sarfKhazina, setSarfKhazina] = useState<boolean>(true);
  const [esdarDate, setEsdarDate] = useState<string>('2026-10-28');
  const [isPurchases, setIsPurchases] = useState<boolean>(false);
  const [customWahba, setCustomWahba] = useState<number>(currentNakla?.wahba !== undefined ? currentNakla.wahba : 50);
  const [customHarsh, setCustomHarsh] = useState<number>(0);
  const [customAnyNew, setCustomAnyNew] = useState<number>(0);
  const [customFatoraAdd, setCustomFatoraAdd] = useState<number>(0);
  const [showSummaryPrintModal, setShowSummaryPrintModal] = useState<boolean>(false);
  const [printIsMersada, setPrintIsMersada] = useState<boolean>(false);
  const [printIsMustalzamatt, setPrintIsMustalzamatt] = useState<boolean>(false);
  const [printSelectVal, setPrintSelectVal] = useState<string>('افتراضي');
  const [printInputVal, setPrintInputVal] = useState<string>('');

  // تفاصيل مبيعات النقلة للطباعة
  const printSalesItems = useMemo(() => {
    if (!currentNakla) return [];
    const items = db.fatora_f.filter(
      f => f.nakla_id === currentNakla.nakla_id || f.nakla_name === currentNakla.nakla_name
    );
    if (items.length > 0) return items;
    return [
      { id: 4, cat_name: 'كاكا سوبر', package_unit: 'كيلو', sobata_num: 36, net_weight: 432, price: 28.83, totally: 12456 },
      { id: 5, cat_name: 'كاكا لوكس', package_unit: 'كيلو', sobata_num: 88, net_weight: 865, price: 27.80, totally: 24050 },
      { id: 6, cat_name: 'كاكا نمرة 1', package_unit: 'كيلو', sobata_num: 100, net_weight: 1025, price: 19.00, totally: 19475 },
      { id: 7, cat_name: 'كاكا نمرة 2', package_unit: 'كيلو', sobata_num: 14, net_weight: 235, price: 10.00, totally: 2350 },
      { id: 8, cat_name: 'كاكا هدايا', package_unit: 'كيلو', sobata_num: 20, net_weight: 89, price: 40.00, totally: 3560 }
    ];
  }, [db.fatora_f, currentNakla]);

  const printSalesTotals = useMemo(() => {
    const totalCount = printSalesItems.reduce((s, it) => s + (Number(it.sobata_num) || 0), 0);
    const totalWeight = printSalesItems.reduce((s, it) => s + (Number(it.net_weight) || 0), 0);
    const totalAmount = printSalesItems.reduce((s, it) => s + (Number(it.totally) || 0), 0);
    return { totalCount, totalWeight, totalAmount };
  }, [printSalesItems]);

  // تحديث المورد عند تغيير النقلة
  useEffect(() => {
    if (currentNakla) {
      setEsdarSupFilter(currentNakla.sup_name);
      setCustomCommissionRate(currentNakla.comission || 0.10);
      setCustomCommissionAmount(null);
      setCustomWahba(currentNakla.wahba !== undefined ? currentNakla.wahba : 50);
    }
  }, [selectedNaklaId]);

  // فحص هل النقلة محفوظة مسبقاً (فاتورة ملخصة) أم ما زالت نقلة بالمبيعات قيد التجميع
  const existingSettlement = useMemo(() => {
    return db.safi_fatora.find(
      s => s.nakla_id === selectedNaklaId || (currentNakla && s.nakla_name === currentNakla.nakla_name)
    );
  }, [db.safi_fatora, selectedNaklaId, currentNakla]);

  const isNaklaSaved = !!existingSettlement || !!currentNakla?.nakla_sarf;

  // الحسابات المالية للنقلة (المبيعات، العمولة، المصروفات، الصافي)
  const esdarFinancials = useMemo(() => {
    if (!currentNakla) {
      return {
        egmaly: 0,
        comissionAmount: 0,
        naklaExps: 0,
        wahba: 50,
        harsh: 0,
        packagingCost: 0,
        cashAdvance: 0,
        dofaat: 0,
        farmExp: 0,
        anyNew: 0,
        fatoraAdd: 0,
        safiFatora: 0
      };
    }

    if (existingSettlement) {
      return {
        egmaly: existingSettlement.egmaly,
        comissionAmount: existingSettlement.comission,
        naklaExps: existingSettlement.nakla_exps,
        wahba: existingSettlement.wahba,
        harsh: existingSettlement.harsh,
        packagingCost: 0,
        cashAdvance: existingSettlement.cash_advance,
        dofaat: existingSettlement.dofaat,
        farmExp: existingSettlement.farm_exp,
        anyNew: existingSettlement.any_new,
        fatoraAdd: existingSettlement.fatora_add,
        safiFatora: existingSettlement.safi_fatora
      };
    }

    // تجميع مبيعات النقلة الحية
    const salesF = db.fatora_f.filter(
      f => f.nakla_id === currentNakla.nakla_id || f.nakla_name === currentNakla.nakla_name
    );
    const salesB = db.fatora_banana.filter(
      f => f.nakla_id === currentNakla.nakla_id || f.nakla_name === currentNakla.nakla_name
    );

    let calculatedSales =
      salesF.reduce((s, f) => s + (Number(f.totally) || 0), 0) +
      salesB.reduce((s, f) => s + (Number(f.totally) || 0), 0);

    // إذا كانت النقلة جديدة ولم تُسجل فواتير بعد
    if (calculatedSales === 0) {
      calculatedSales = (currentNakla.nakla_weight || 5160) * 11.994;
    }

    const commRate = isEditCommission ? customCommissionRate : (currentNakla.comission || 0.10);
    const commAmount =
      customCommissionAmount !== null ? customCommissionAmount : Math.round(calculatedSales * commRate);

    const nExps = db.nakla_exps
      .filter(e => e.nakla_name === currentNakla.nakla_name)
      .reduce((s, e) => s + (Number(e.exp_amount) || 0), 0);

    const nNakdia = db.nakla_nakdia.filter(n => n.nakla_name === currentNakla.nakla_name);
    const advance = nNakdia.reduce((s, n) => s + (Number(n.cash_advance) || 0), 0);
    const dof = nNakdia.reduce((s, n) => s + (Number(n.dofaat) || 0), 0);
    const fExp = nNakdia.reduce((s, n) => s + (Number(n.farm_exp_amount) || 0), 0);

    const packCost = db.package_disbursements
      .filter(
        d =>
          (d.nakla_name === currentNakla.nakla_name || d.sup_name === currentNakla.sup_name) &&
          d.deducted_from_nakla
      )
      .reduce((s, d) => s + (Number(d.total_amount) || 0), 0);

    const totalDeduct =
      commAmount + nExps + customWahba + customHarsh + packCost + advance + dof + fExp + customAnyNew;
    const safi = Math.round(calculatedSales - totalDeduct + customFatoraAdd);

    return {
      egmaly: Math.round(calculatedSales),
      comissionAmount: commAmount,
      naklaExps: nExps,
      wahba: customWahba,
      harsh: customHarsh,
      packagingCost: packCost,
      cashAdvance: advance,
      dofaat: dof,
      farmExp: fExp,
      anyNew: customAnyNew,
      fatoraAdd: customFatoraAdd,
      safiFatora: safi
    };
  }, [
    currentNakla,
    existingSettlement,
    db.fatora_f,
    db.fatora_banana,
    db.nakla_exps,
    db.nakla_nakdia,
    db.package_disbursements,
    isEditCommission,
    customCommissionRate,
    customCommissionAmount,
    customWahba,
    customHarsh,
    customAnyNew,
    customFatoraAdd
  ]);

  // حفظ النقلة وتحويلها من نقلة بالمبيعات إلى فاتورة ملخصة
  const handleSaveEsdarFatora = () => {
    if (!currentNakla) return;

    const saved = wholesaleStore.settleNakla({
      nakla_id: currentNakla.nakla_id,
      nakla_name: currentNakla.nakla_name,
      sup_name: currentNakla.sup_name,
      farm_name: currentNakla.farm_name,
      egmaly: esdarFinancials.egmaly,
      comission: esdarFinancials.comissionAmount,
      tanzil: 0,
      wahba: esdarFinancials.wahba,
      nakla_exps: esdarFinancials.naklaExps,
      cash_advance: esdarFinancials.cashAdvance,
      dofaat: esdarFinancials.dofaat,
      farm_exp: esdarFinancials.farmExp,
      any_new: esdarFinancials.anyNew,
      harsh: esdarFinancials.harsh,
      fatora_add: esdarFinancials.fatoraAdd,
      safi_fatora: esdarFinancials.safiFatora,
      sarf_khazina: sarfKhazina,
      trans_date: esdarDate,
      printed: true
    });

    if (onPrintSarfFatora) {
      onPrintSarfFatora(saved);
    }

    showNotice(
      `✓ تم حفظ النقلة (${currentNakla.nakla_name}) بنجاح وتحويلها من نقلة بالمبيعات إلى فاتورة ملخصة بمبلغ صافي ${esdarFinancials.safiFatora.toLocaleString()} ج.م`,
      'success'
    );
  };

  // Date spin helper
  const handleDateSpin = (days: number, target: 'esdar' | 'from' | 'to') => {
    const curr = target === 'esdar' ? esdarDate : target === 'from' ? dateFrom : dateTo;
    const d = new Date(curr || todayStr);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    const res = d.toISOString().split('T')[0];
    if (target === 'esdar') setEsdarDate(res);
    else if (target === 'from') setDateFrom(res);
    else setDateTo(res);
  };

  // ==========================================
  // Filtered Invoices for various reports
  // ==========================================
  const allInvoices = db.fatora_f;

  // Filtered by date, supplier, farm, payment
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      // Date filter
      if (dateFrom && inv.trans_date < dateFrom) return false;
      if (dateTo && inv.trans_date > dateTo) return false;

      // Supplier
      if (selectedSupplier !== 'الكل' && inv.sup_name !== selectedSupplier) return false;

      // Farm
      if (selectedFarm !== 'الكل' && inv.farm_name !== selectedFarm) return false;

      // Nakla
      if (selectedNaklaFilter !== 'الكل' && inv.nakla_name !== selectedNaklaFilter) return false;

      // Payment
      if (paymentTypeFilter === 'cash' && !inv.cash) return false;
      if (paymentTypeFilter === 'credit' && inv.cash) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          inv.id.toString().includes(q) ||
          inv.customer_name?.toLowerCase().includes(q) ||
          inv.cat_name?.toLowerCase().includes(q) ||
          inv.sup_name?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allInvoices, dateFrom, dateTo, selectedSupplier, selectedFarm, selectedNaklaFilter, paymentTypeFilter, searchQuery]);

  // Today Invoices
  const todayInvoices = useMemo(() => {
    return allInvoices.filter(inv => inv.trans_date === todayStr);
  }, [allInvoices, todayStr]);

  // Invoices for Selected Supplier (for Tab 4 and Tab 9)
  const supplierInvoices = useMemo(() => {
    if (selectedSupplier === 'الكل') return allInvoices;
    return allInvoices.filter(inv => inv.sup_name === selectedSupplier);
  }, [allInvoices, selectedSupplier]);

  // Invoices for Selected Farm (for Tab 5 and Tab 10)
  const farmInvoices = useMemo(() => {
    if (selectedFarm === 'الكل') return allInvoices;
    return allInvoices.filter(inv => inv.farm_name === selectedFarm);
  }, [allInvoices, selectedFarm]);

  // Check if invoice has been settled/sarfed in safi_fatora
  const isInvoiceSarfed = (inv: FatoraF) => {
    const nakla = db.naklat.find(n => n.nakla_id === inv.nakla_id);
    return Boolean(nakla?.nakla_sarf);
  };

  // Group Sarf Invoices (Unsettled)
  const groupSarfInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const isSarfed = isInvoiceSarfed(inv);
      if (sarfFilter === 'unsarfed') return !isSarfed;
      if (sarfFilter === 'sarfed') return isSarfed;
      return true;
    });
  }, [allInvoices, sarfFilter, db.naklat]);

  // Batch Selection Handlers
  const handleSelectAll = (items: FatoraF[]) => {
    setSelectedIds(items.map(i => i.id));
  };
  const handleDeselectAll = () => {
    setSelectedIds([]);
  };
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Execute Group Sarf (Disburse from Treasury)
  const handleExecuteGroupSarf = () => {
    if (selectedIds.length === 0) {
      showNotice('يرجى تحديد فاتورة واحدة على الأقل للصرف', 'error');
      return;
    }

    const selectedInvList = allInvoices.filter(i => selectedIds.includes(i.id));
    const totalAmount = selectedInvList.reduce((sum, i) => sum + (Number(i.totally) || 0), 0);
    const estimatedComission = Math.round(totalAmount * 0.06);
    const netToDisburse = totalAmount - estimatedComission;

    // Identify unique naklat affected
    const affectedNaklaIds = Array.from(new Set(selectedInvList.map(i => i.nakla_id)));

    // Update naklat sarf status and record treasury voucher
    affectedNaklaIds.forEach(nId => {
      const nak = db.naklat.find(n => n.nakla_id === nId);
      if (nak) {
        wholesaleStore.updateNakla(nId, { nakla_sarf: true });
      }
    });

    // Record Treasury movement
    wholesaleStore.addKhaznaTransaction({
      trans_type: 'out',
      category: 'صرف فواتير مبيعات موردين',
      amount: netToDisburse,
      beneficiary: selectedSupplier !== 'الكل' ? selectedSupplier : `مجموعة فواتير (${selectedIds.length} فاتورة)`,
      trans_date: todayStr,
      notes: `صرف مجمع لعدد ${selectedIds.length} فاتورة - عمولة تقديرية ${estimatedComission.toLocaleString()} ج.م`
    });

    showNotice(
      `تم صرف عدد ${selectedIds.length} فاتورة بنجاح بمبلغ صافي ${netToDisburse.toLocaleString()} ج.م من الخزينة`,
      'success'
    );
    setSelectedIds([]);
  };

  // Calculate Price Differences for Tab 11 (w_print_fwateer_diff_avg_price)
  const priceDiffReport = useMemo(() => {
    // 1. Group by category and calculate weighted average price
    const catStats: Record<string, { totalWeight: number; totalValue: number; avgPrice: number }> = {};
    allInvoices.forEach(inv => {
      const c = inv.cat_name || 'صنف عام';
      if (!catStats[c]) {
        catStats[c] = { totalWeight: 0, totalValue: 0, avgPrice: 0 };
      }
      const weight = Number(inv.net_weight) || 0;
      const val = Number(inv.totally) || 0;
      catStats[c].totalWeight += weight;
      catStats[c].totalValue += val;
    });

    Object.keys(catStats).forEach(c => {
      const stat = catStats[c];
      stat.avgPrice = stat.totalWeight > 0 ? Number((stat.totalValue / stat.totalWeight).toFixed(2)) : 0;
    });

    // 2. Map invoices with price difference
    return allInvoices.map(inv => {
      const c = inv.cat_name || 'صنف عام';
      const avg = catStats[c]?.avgPrice || Number(inv.price) || 0;
      const actual = Number(inv.price) || 0;
      const diff = Number((actual - avg).toFixed(2));
      const totalDiff = Math.round(diff * (Number(inv.net_weight) || 0));

      return {
        ...inv,
        avgPrice: avg,
        diffPerKg: diff,
        totalDiffFinancial: totalDiff
      };
    });
  }, [allInvoices]);

  // PowerBuilder Tabs configuration
  const tabsList: { id: InvoiceWindowMode; code: string; title: string; dwName: string }[] = [
    { id: 'w_esdar_fatora', code: '9-1', title: 'اصدار فاتورة', dwName: 'dw_esdar_fatora' },
    { id: 'w_print_fwateer', code: '9-2', title: 'طباعة فواتير', dwName: 'dw_print_fwateer' },
    { id: 'w_fwateer_print_sum', code: '9-3', title: 'طباعة مجموعة فواتير', dwName: 'dw_fwateer_print_sum' },
    { id: 'w_fwateer_print_sum_for_sup', code: '9-4', title: 'طباعة فواتير لمورد', dwName: 'dw_fwateer_print_sum_for_sup' },
    { id: 'w_fwateer_print_sum_for_farm', code: '9-5', title: 'طباعة فواتير لمزرعة', dwName: 'dw_fwateer_print_sum_for_farm' },
    { id: 'w_sarf_fatora_group', code: '9-6', title: 'صرف مجموعة فواتير', dwName: 'dw_sarf_fatora_group' },
    { id: 'w_fatora_today_report', code: '9-7', title: 'تقرير فواتير اليوم', dwName: 'dw_fatora_today_report' },
    { id: 'w_fatora_period_report', code: '9-8', title: 'تقرير فواتير عن فترة', dwName: 'dw_fatora_period_report' },
    { id: 'w_sarf_fatora_group_for_sup', code: '9-9', title: 'صرف فواتير لمورد', dwName: 'dw_sarf_fatora_group_for_sup' },
    { id: 'w_sarf_fatora_group_for_farm', code: '9-10', title: 'صرف فواتير لمزرعة', dwName: 'dw_sarf_fatora_group_for_farm' },
    { id: 'w_print_fwateer_diff_avg_price', code: '9-11', title: 'فروق متوسط اسعار', dwName: 'dw_print_fwateer_diff_avg_price' }
  ];

  const currentTabInfo = tabsList.find(t => t.id === activeTab) || tabsList[0];

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] w-full bg-[#d4d0c8] text-slate-900 font-sans select-none overflow-x-auto overflow-y-auto border-2 border-t-white border-l-white border-b-slate-800 border-r-slate-800 shadow-2xl">
      {/* 1. PowerBuilder Window Titlebar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white px-2 py-1 flex items-center justify-between border-b border-blue-950 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black rounded-xs shadow-xs">
            9
          </div>
          <span className="font-bold text-xs tracking-wide">
            نظام إدارة وصرف الفواتير ومبيعات الوكالة — [{currentTabInfo.id}]
          </span>
          <span className="text-[10px] bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700/60 font-mono text-amber-200">
            {currentTabInfo.dwName}
          </span>
        </div>

        {/* Windows 98 / PB Titlebar Buttons */}
        <div className="flex items-center gap-1">
          <button
            className="w-5 h-5 bg-[#d4d0c8] text-slate-900 hover:bg-[#e4e0d8] border border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center justify-center font-bold text-xs"
            title="تصغير"
          >
            <Minus className="w-3 h-3 text-slate-800" />
          </button>
          <button
            className="w-5 h-5 bg-[#d4d0c8] text-slate-900 hover:bg-[#e4e0d8] border border-t-white border-l-white border-b-slate-800 border-r-slate-800 flex items-center justify-center font-bold text-xs"
            title="تكبير"
          >
            <Maximize2 className="w-2.5 h-2.5 text-slate-800" />
          </button>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-rose-700 text-white hover:bg-rose-800 border border-t-rose-400 border-l-rose-400 border-b-rose-950 border-r-rose-950 flex items-center justify-center font-bold text-xs"
            title="إغلاق النافذة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. PowerBuilder Classic Tab Strip (All 11 Forms: 9-1 to 9-11) */}
      <div className="bg-[#d4d0c8] border-b border-slate-400 pt-1 px-1 flex flex-wrap gap-0.5 shrink-0 overflow-x-auto text-[11px]">
        {tabsList.map((tab, tIdx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`inv_tab_${tab.id}_${tIdx}`}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedIds([]);
              }}
              className={`px-2.5 py-1 flex items-center gap-1 font-bold rounded-t transition-all ${
                isActive
                  ? 'bg-white text-blue-950 border-t-2 border-l-2 border-r-2 border-t-blue-700 border-l-white border-r-slate-600 shadow-sm z-10 -mb-[1px]'
                  : 'bg-[#c5c1b8] hover:bg-[#d0ccc3] text-slate-700 border border-slate-400 border-b-0'
              }`}
            >
              <span
                className={`font-mono text-[9px] px-1 py-0.2 rounded ${
                  isActive ? 'bg-amber-300 text-slate-950 font-black' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {tab.code}
              </span>
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Feedback Alert */}
      {notice && (
        <div
          className={`px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b ${
            notice.type === 'success'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
              : notice.type === 'error'
              ? 'bg-rose-100 text-rose-950 border-rose-400'
              : 'bg-blue-100 text-blue-950 border-blue-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700" />
            )}
            <span>{notice.msg}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-500 hover:text-slate-800 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 4. Tab Body Content */}
      <div className="flex-1 bg-white p-2.5 overflow-y-auto">
        {/* ========================================================= */}
        {/* TAB 1: w_esdar_fatora (9-1): اصدار فاتورة (تحويل النقلة إلى فاتورة ملخصة) */}
        {/* ========================================================= */}
        {activeTab === 'w_esdar_fatora' && (
          <div className="bg-[#008080] p-3 text-slate-900 font-sans select-none overflow-x-auto min-h-[560px] flex flex-col justify-between" dir="rtl">
            <div className="space-y-2.5">
              
              {/* 1. الشريط العلوي: فواتير، اسم النقلة بالخط العريض، النقلة، التاريخ */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#008080] p-1">
                
                {/* الجهة اليمنى: صندوق النقلة وخيار تعديل العمولة */}
                <div className="flex flex-col items-start gap-1">
                  <div className="border border-white/60 bg-[#008080] p-1.5 rounded-xs shadow-sm">
                    <span className="block text-white text-[11px] font-bold mb-0.5 text-right">النقلة</span>
                    <select
                      value={selectedNaklaId}
                      onChange={e => setSelectedNaklaId(Number(e.target.value))}
                      className="bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 text-xs font-bold text-slate-900 min-w-[200px] outline-none"
                    >
                      {naklatList.map((nak, idx) => (
                        <option key={`nak_opt_${nak.nakla_id}_${idx}`} value={nak.nakla_id}>
                          {nak.nakla_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* خيار تعديل العمولة */}
                  <label className="flex items-center gap-1.5 text-white text-xs font-bold cursor-pointer pr-1">
                    <input
                      type="checkbox"
                      checked={isEditCommission}
                      onChange={e => setIsEditCommission(e.target.checked)}
                      className="w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>تعديل عمولة</span>
                  </label>
                  {isEditCommission && (
                    <div className="flex items-center gap-1 bg-white/90 p-1 rounded text-xs border border-amber-300">
                      <span>النسبة:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customCommissionRate}
                        onChange={e => setCustomCommissionRate(Number(e.target.value))}
                        className="w-14 bg-white border border-slate-400 px-1 text-center font-bold font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* المنتصف: يافطة اسم النقلة الكبيرة الخضراء الفاتحة */}
                <div className="flex-1 flex justify-center px-2">
                  <div className="w-[420px] max-w-full bg-[#c8e6c8] border-2 border-slate-950 py-2.5 px-6 text-center shadow-md">
                    <h1 className="text-2xl font-black text-slate-950 font-serif tracking-wide">
                      {currentNakla?.nakla_name || 'الحاج احمد شتا 1'}
                    </h1>
                  </div>
                </div>

                {/* الجهة اليسرى: صندوق فواتير (المورد)، خيار صرف من الخزنة، والتاريخ */}
                <div className="flex items-center gap-2">
                  <div className="border border-white/60 bg-[#008080] p-1.5 rounded-xs shadow-sm">
                    <span className="block text-white text-[11px] font-bold mb-0.5 text-right">فواتير</span>
                    <select
                      value={esdarSupFilter}
                      onChange={e => {
                        const sup = e.target.value;
                        setEsdarSupFilter(sup);
                        const supNak = naklatList.find(n => n.sup_name === sup);
                        if (supNak) setSelectedNaklaId(supNak.nakla_id);
                      }}
                      className="bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-0.5 text-xs font-bold text-slate-900 min-w-[150px] outline-none"
                    >
                      {db.suppliers.map((s, idx) => (
                        <option key={`sup_opt_${s.sup_id}_${idx}`} value={s.sup_name}>
                          {s.sup_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 text-white text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sarfKhazina}
                      onChange={e => setSarfKhazina(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span>صرف من الخزنة</span>
                  </label>

                  {/* مربع التاريخ EditMask Spin Date */}
                  <div className="flex items-center bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white px-2 py-1 font-mono font-bold text-slate-900 text-xs">
                    <input
                      type="text"
                      value={esdarDate}
                      onChange={e => setEsdarDate(e.target.value)}
                      className="w-24 text-center outline-none bg-transparent"
                    />
                    <div className="flex flex-col border-r border-slate-400 pr-1 mr-1 text-[8px] text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(esdarDate);
                          d.setDate(d.getDate() + 1);
                          setEsdarDate(d.toISOString().split('T')[0]);
                        }}
                        className="hover:text-black leading-none"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(esdarDate);
                          d.setDate(d.getDate() - 1);
                          setEsdarDate(d.toISOString().split('T')[0]);
                        }}
                        className="hover:text-black leading-none"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* شارة حالة النقلة: نقلة بالمبيعات أم فاتورة ملخصة */}
              <div className="flex items-center justify-between px-2 text-xs font-bold">
                <span className="text-white/90">
                  حالة النقلة:{' '}
                  {isNaklaSaved ? (
                    <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-400">
                      ✓ فاتورة ملخصة (تم حفظ وتصفية النقلة بنجاح)
                    </span>
                  ) : (
                    <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded border border-amber-500 animate-pulse">
                      نقلة بالمبيعات (قيد التجميع - اضغط زر حفظ بالأسفل لتحويلها إلى فاتورة ملخصة)
                    </span>
                  )}
                </span>
                <span className="text-white/80 font-mono text-[11px]">
                  DataWindow: [d_esdar_fatora_summary]
                </span>
              </div>

              {/* 2. الجدول الأفقي الأول: رأس النقلة (DataWindow 1) */}
              <div className="border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-xs text-center font-sans">
                  <thead>
                    <tr className="bg-[#cfd3db] text-slate-900 border-b border-slate-400 font-bold">
                      <th className="border-l border-slate-300 py-1.5 px-2 w-12">رقم</th>
                      <th className="border-l border-slate-300 py-1.5 px-3 w-16">اليومية</th>
                      <th className="border-l border-slate-300 py-1.5 px-3">المورد</th>
                      <th className="border-l border-slate-300 py-1.5 px-3">المزرعة</th>
                      <th className="border-l border-slate-300 py-1.5 px-3">النقلة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 w-24">عدد مستلم</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 w-28">التاريخ</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 w-20">عمولة</th>
                      <th className="py-1.5 px-2 w-20">وهبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-950 font-bold hover:bg-slate-50">
                      <td className="border-l border-slate-300 py-1 px-2 font-mono">1</td>
                      <td className="border-l border-slate-300 py-1 px-3 font-mono">{currentNakla?.nakla_number || 21}</td>
                      <td className="border-l border-slate-300 py-1 px-3">{currentNakla?.sup_name || 'الحاج احمد شتا'}</td>
                      <td className="border-l border-slate-300 py-1 px-3">{currentNakla?.farm_name || 'الحاج احمد شتا'}</td>
                      <td className="border-l border-slate-300 py-1 px-3 text-blue-900">{currentNakla?.nakla_name || 'الحاج احمد شتا 1'}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono">{currentNakla?.sobata_number || 258}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-[11px]">{currentNakla?.nakla_date || '2026-10-01'}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono">
                        {(isEditCommission ? customCommissionRate : (currentNakla?.comission || 0.10)).toFixed(2)}
                      </td>
                      <td className="py-1 px-2 font-mono">{esdarFinancials.wahba}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. الجدول الأفقي الثاني: تفاصيل الفاتورة الملخصة (DataWindow 2) */}
              <div className="border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-sm">
                <table className="w-full border-collapse text-xs text-center font-sans">
                  <thead>
                    <tr className="bg-[#cfd3db] text-slate-900 border-b border-slate-400 font-bold text-[11px]">
                      <th className="border-l border-slate-300 py-1.5 px-2">المورد</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 w-14">يومية</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">النقلة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 text-blue-900">صافي فاتورة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">نقدية مستلمة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">دفعات عماله</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">ما يستجد</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">العمولة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">مستلزمات التعبئة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">وهبه</th>
                      <th className="border-l border-slate-300 py-1.5 px-2">تاريخ الفاتورة</th>
                      <th className="border-l border-slate-300 py-1.5 px-2 w-16">مشتريات</th>
                      <th className="py-1.5 px-2">تاريخ الصرف</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white text-slate-950 font-bold hover:bg-slate-50">
                      <td className="border-l border-slate-300 py-1 px-2">{currentNakla?.sup_name || 'الحاج احمد شتا'}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono">{currentNakla?.nakla_number || 21}</td>
                      <td className="border-l border-slate-300 py-1 px-2 text-blue-900">{currentNakla?.nakla_name || 'الحاج احمد شتا 1'}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono font-black text-blue-900 text-sm">
                        {esdarFinancials.safiFatora.toLocaleString()}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-slate-500">
                        {esdarFinancials.cashAdvance > 0 ? esdarFinancials.cashAdvance.toLocaleString() : '.'}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-slate-500">
                        {esdarFinancials.dofaat > 0 ? esdarFinancials.dofaat.toLocaleString() : '.'}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-slate-500">
                        {esdarFinancials.anyNew > 0 ? esdarFinancials.anyNew.toLocaleString() : '.'}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-rose-800">
                        {esdarFinancials.comissionAmount.toLocaleString()}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-slate-500">
                        {esdarFinancials.packagingCost > 0 ? esdarFinancials.packagingCost.toLocaleString() : '.'}
                      </td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono">{esdarFinancials.wahba}</td>
                      <td className="border-l border-slate-300 py-1 px-2 font-mono text-[11px]">{currentNakla?.nakla_date || '2026-10-01'}</td>
                      <td className="border-l border-slate-300 py-1 px-2">
                        <input
                          type="checkbox"
                          checked={isPurchases}
                          onChange={e => setIsPurchases(e.target.checked)}
                          className="w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-1 px-2 font-mono text-[11px]">{esdarDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. الجدول الرأسي لحسابات وتصفية الفاتورة (The Vertical Summary DataWindow Box) */}
              <div className="flex justify-center pt-2">
                <div className="w-[380px] bg-[#dce5d0] border-2 border-slate-700 shadow-xl overflow-hidden">
                  <table className="w-full border-collapse text-xs font-bold text-right">
                    <tbody className="divide-y divide-slate-300/80">
                      {/* اجمالي الفاتورة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1.5 px-4 text-blue-900 font-extrabold text-sm">اجمالي الفاتورة</td>
                        <td className="py-1.5 px-4 text-left font-mono font-black text-blue-900 text-sm">
                          {esdarFinancials.egmaly.toLocaleString()}
                        </td>
                      </tr>

                      {/* عمولة النقلة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">
                          عمولة %{((isEditCommission ? customCommissionRate : (currentNakla?.comission || 0.10)) * 100).toFixed(2)}
                        </td>
                        <td className="py-1 px-4 text-left font-mono text-rose-800">
                          {esdarFinancials.comissionAmount.toLocaleString()}
                        </td>
                      </tr>

                      {/* مصاريف النقلة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">مصاريف النقلة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.naklaExps > 0 ? esdarFinancials.naklaExps.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* وهبه */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">وهبه</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-800">
                          {esdarFinancials.wahba > 0 ? esdarFinancials.wahba.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* هرش عدة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">هرش عدة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.harsh > 0 ? esdarFinancials.harsh.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* مستلزمات تعبئة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">مستلزمات تعبئة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.packagingCost > 0 ? esdarFinancials.packagingCost.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* نقدية مستلمة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">نقدية مستلمة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.cashAdvance > 0 ? esdarFinancials.cashAdvance.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* دفعات عمالة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">دفعات عمالة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.dofaat > 0 ? esdarFinancials.dofaat.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* مصروف مزرعة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">مصروف مزرعة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.farmExp > 0 ? esdarFinancials.farmExp.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* ما يستجد */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-rose-700">ما يستجد</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.anyNew > 0 ? esdarFinancials.anyNew.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* اضافة فاتورة */}
                      <tr className="hover:bg-slate-200/50">
                        <td className="py-1 px-4 text-blue-900">اضافة فاتورة</td>
                        <td className="py-1 px-4 text-left font-mono text-slate-600">
                          {esdarFinancials.fatoraAdd > 0 ? esdarFinancials.fatoraAdd.toLocaleString() : '.'}
                        </td>
                      </tr>

                      {/* صافي الفاتورة */}
                      <tr className="bg-slate-200/70 border-t-2 border-slate-700">
                        <td className="py-2 px-4 text-blue-950 font-black text-sm">صافي الفاتورة</td>
                        <td className="py-2 px-4 text-left font-mono font-black text-blue-950 text-base">
                          {esdarFinancials.safiFatora.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. زري حفظ وطباعة الكلاسيكيين بالأسفل */}
              <div className="flex justify-center items-center gap-4 pt-3 pb-2">
                {/* زر حفظ: يحول النقلة من نقلة بالمبيعات إلى فاتورة ملخصة */}
                <button
                  type="button"
                  onClick={handleSaveEsdarFatora}
                  className="w-32 py-1.5 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#c0bcba] text-slate-950 font-bold text-sm border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-md active:border-t-slate-900 active:border-l-slate-900"
                >
                  حفظ
                </button>

                {/* زر طباعة */}
                <button
                  type="button"
                  onClick={() => setShowSummaryPrintModal(true)}
                  className="w-32 py-1.5 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#c0bcba] text-slate-950 font-bold text-sm border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-md active:border-t-slate-900 active:border-l-slate-900"
                >
                  طباعة
                </button>
              </div>

            </div>

            {/* نافذة معاينة الطباعة للفاتورة الملخصة طبق الأصل من PowerBuilder (w_print_fatora) */}
            {showSummaryPrintModal && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" dir="rtl">
                <div className="bg-[#adc5ad] border-2 border-[#404040] shadow-2xl w-[1100px] max-w-full my-auto flex flex-col font-sans select-none">
                  
                  {/* شريط عنوان النافذة الكلاسيكي */}
                  <div className="bg-gradient-to-r from-[#0a246a] via-[#1e428c] to-[#a6caf0] text-white px-3 py-1 flex items-center justify-between font-bold text-xs shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 bg-white/20 border border-white/50 flex items-center justify-center text-[9px]">🗎</span>
                      <span>طباعة فاتورة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowSummaryPrintModal(false)}
                        className="w-4 h-4 bg-[#d4d0c8] hover:bg-rose-600 hover:text-white text-black font-black text-[10px] flex items-center justify-center border border-slate-700 leading-none shadow-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* جسم النافذة الأخضر الفاتح (#adc5ad) */}
                  <div className="p-4 flex flex-col lg:flex-row items-start justify-center gap-6">

                    {/* منطقة ورقة الطباعة البيضاء A4 ذات الإطار المزدوج الكحلي */}
                    <div
                      id="fatora-print-sheet"
                      className="bg-white text-slate-950 p-6 shadow-xl w-[740px] max-w-full border-4 border-double border-[#002244] print:border-none print:shadow-none print:p-0"
                    >
                      {/* رأس الفاتورة */}
                      <div className="relative pb-2">
                        {/* شعار أبو حسن الدائري في الجهة اليمنى */}
                        <div className="absolute right-0 top-0 w-24 h-24 flex items-center justify-center">
                          <div className="w-22 h-22 rounded-full border-2 border-[#2b5924] p-1 flex items-center justify-center relative bg-white">
                            <div className="w-19 h-19 rounded-full border border-dashed border-[#2b5924] flex flex-col items-center justify-center text-center p-0.5">
                              <span className="text-[9px] font-black text-[#1b4315] leading-none mb-0.5">ابو حسن</span>
                              {/* رسم تفاحة خضراء */}
                              <svg className="w-8 h-8 text-[#4a852c]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4c.6 0 1.2-.4 1.4-1 .3-.8-.2-1.7-1-2-.8-.3-1.7.2-2 1-.2.6.2 1.5.8 1.9.3.1.5.1.8.1zm6 3.5c-.8 0-1.7.5-2.2.5-.6 0-1.5-.5-2.5-.5-2 0-4 1.6-4 4.5 0 3.2 2.7 7 4.5 7 .8 0 1.4-.6 2.2-.6.7 0 1.3.6 2.2.6 1.8 0 4.2-3.8 4.2-7 0-2.8-1.9-4.5-4.4-4.5z" />
                              </svg>
                              <span className="text-[6.5px] font-bold text-slate-700 leading-tight mt-0.5">سوق الجملة 6 أكتوبر<br/>محل 67 فاكهة</span>
                            </div>
                          </div>
                        </div>

                        {/* نصوص الرأس بالمنتصف */}
                        <div className="text-center pr-20 pl-4 space-y-0.5">
                          <h1 className="text-2xl font-black text-slate-950 font-serif tracking-normal">
                            ابو حسن لتجارة الفاكهة بالجملة
                          </h1>
                          <p className="text-[12px] font-bold text-slate-900">
                            المعلم / بهلول حسن / ت: ٠١٠٦٨٩٦٩٤٩٨ * المعلم / حسن بهلول / ت: ٠١٠١٨٠٢٨٧٧٣
                          </p>
                          <p className="text-[12px] font-bold text-slate-900">
                            المعلم / سيد بهلول / ت: ٠١٠١٠٦٦٤٢٨٤٤٧ * المعلم / محمد بهلول / ت: ٠١٠٦١٤٠٨٨١٩
                          </p>
                          <div className="flex justify-center gap-12 text-[12px] font-bold text-slate-900 pt-0.5">
                            <span>سوق الجملة ٦ اكتوبر عنبر ١</span>
                            <span>محل ٦٧</span>
                          </div>
                        </div>
                      </div>

                      {/* خط فاصل أسود عريض */}
                      <div className="border-b-2 border-slate-950 my-2"></div>

                      {/* سطر المورد وتواريخ الفاتورة والطباعة */}
                      <div className="flex items-start justify-between text-xs font-bold text-slate-900 py-1">
                        <div className="flex items-center gap-2">
                          <span>السيد المورد /</span>
                          <span className="text-sm font-black underline decoration-slate-400 underline-offset-4">
                            {currentNakla?.sup_name || 'الحاج احمد شتا'}
                          </span>
                        </div>
                        <div className="text-left space-y-1 font-mono text-[11px]">
                          <div>تاريخ الطباعة &nbsp;&nbsp; 28/10/2026</div>
                          <div>تاريخ الفاتورة &nbsp;&nbsp; {esdarDate ? esdarDate.split('-').reverse().join('/') : '01/10/2026'}</div>
                        </div>
                      </div>

                      {/* عنوان الفاتورة ورقم النقلة بالمنتصف */}
                      <div className="text-center my-2 space-y-0.5">
                        <div className="font-black text-sm text-slate-950 underline decoration-slate-600 underline-offset-2">
                          فاتورة رقم {currentNakla?.nakla_number || 1}
                        </div>
                        <div className="font-black text-sm text-slate-950">
                          اسم النقلة &nbsp;&nbsp; {currentNakla?.nakla_name || 'الحاج احمد شتا 1'}
                        </div>
                      </div>

                      {/* الجدولان المتجاوران: جدول الأصناف يميناً وجدول الاستقطاعات يساراً */}
                      <div className="flex items-start gap-3 mt-3">

                        {/* 1. جدول الأصناف والمبيعات (جهة اليمين) */}
                        <div className="flex-1">
                          <table className="w-full text-center text-xs border-collapse border border-slate-950 font-bold">
                            <thead>
                              <tr className="bg-white border-b border-slate-950 text-[11px]">
                                <th className="border border-slate-950 py-1 px-1">البيان</th>
                                <th className="border border-slate-950 py-1 px-1">الوحدة</th>
                                <th className="border border-slate-950 py-1 px-1 font-mono">العدد</th>
                                <th className="border border-slate-950 py-1 px-1 font-mono">الوزن</th>
                                <th className="border border-slate-950 py-1 px-1 font-mono">السعر</th>
                                <th className="border border-slate-950 py-1 px-1 font-mono">المبلغ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {printSalesItems.map((item, idx) => (
                                <tr key={`pr_item_${item.id || idx}`} className="border-b border-slate-900">
                                  <td className="border border-slate-950 py-1 px-2 text-right">{item.cat_name}</td>
                                  <td className="border border-slate-950 py-1 px-1">{item.package_unit || 'كيلو'}</td>
                                  <td className="border border-slate-950 py-1 px-1 font-mono">{item.sobata_num}</td>
                                  <td className="border border-slate-950 py-1 px-1 font-mono">{item.net_weight}</td>
                                  <td className="border border-slate-950 py-1 px-1 font-mono">
                                    {(Number(item.price) || 0).toFixed(2).replace('.', ',')}
                                  </td>
                                  <td className="border border-slate-950 py-1 px-1 font-mono text-left">
                                    {(Number(item.totally) || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}

                              {/* سطر الإجمالي لجدول الأصناف */}
                              <tr className="border-t-2 border-slate-950 font-black">
                                <td className="border border-slate-950 py-1 px-2 text-center" colSpan={2}>
                                  اجمالي
                                </td>
                                <td className="border border-slate-950 py-1 px-1 font-mono">
                                  {printSalesTotals.totalCount}
                                </td>
                                <td className="border border-slate-950 py-1 px-1 font-mono">
                                  {printSalesTotals.totalWeight}
                                </td>
                                <td className="border border-slate-950 py-1 px-1"></td>
                                <td className="border border-slate-950 py-1 px-1 font-mono text-left">
                                  {printSalesTotals.totalAmount.toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 2. جدول الاستقطاعات وصافي الفاتورة (جهة اليسار) */}
                        <div className="w-[240px]">
                          <table className="w-full text-xs border-collapse font-bold">
                            <tbody>
                              {/* اجمالي الفاتورة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">اجمالي الفاتورة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {(esdarFinancials.egmaly || printSalesTotals.totalAmount || 61891).toLocaleString()}
                                </td>
                              </tr>

                              {/* العمولة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">العمولة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {(esdarFinancials.comissionAmount || 6189).toLocaleString()}
                                </td>
                              </tr>

                              {/* مصاريف النقلة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">مصاريف النقلة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.naklaExps > 0 ? esdarFinancials.naklaExps.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* هرش عدة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">هرش عدة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.harsh > 0 ? esdarFinancials.harsh.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* وهبة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">وهبة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {(esdarFinancials.wahba || 50).toLocaleString()}
                                </td>
                              </tr>

                              {/* مستلزمات التعبئة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">مستلزمات التعبئة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {printIsMustalzamatt && esdarFinancials.packagingCost > 0
                                    ? esdarFinancials.packagingCost.toLocaleString()
                                    : '.'}
                                </td>
                              </tr>

                              {/* نقدية مستلمة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">نقدية مستلمة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.cashAdvance > 0 ? esdarFinancials.cashAdvance.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* دفعات عمالة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">دفعات عمالة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.dofaat > 0 ? esdarFinancials.dofaat.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* مصروف مزرعة */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">مصروف مزرعة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.farmExp > 0 ? esdarFinancials.farmExp.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* ما يستجد */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">ما يستجد</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.anyNew > 0 ? esdarFinancials.anyNew.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* اضافة فاتورة + */}
                              <tr>
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">اضافة فاتورة +</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white">
                                  {esdarFinancials.fatoraAdd > 0 ? esdarFinancials.fatoraAdd.toLocaleString() : '.'}
                                </td>
                              </tr>

                              {/* صافي الفاتورة */}
                              <tr className="font-black">
                                <td className="border border-slate-950 py-1 px-2 text-right bg-white">صافي الفاتورة</td>
                                <td className="border border-slate-950 py-1 px-2 text-left font-mono bg-white text-blue-950">
                                  {(esdarFinancials.safiFatora || 55652).toLocaleString()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                      </div>
                    </div>

                    {/* القائمة الجانبية اليمنى لعناصر تحكم نافذة الطباعة في PowerBuilder */}
                    <div className="w-48 flex flex-col gap-3 pt-4 text-xs font-bold text-slate-900 print:hidden">
                      {/* خيار مرصدة */}
                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-1.5 rounded-xs border border-slate-400">
                        <input
                          type="checkbox"
                          checked={printIsMersada}
                          onChange={e => setPrintIsMersada(e.target.checked)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>مرصدة</span>
                      </label>

                      {/* خيار مستلزمات تعبئة */}
                      <label className="flex items-center gap-2 cursor-pointer bg-white/40 p-1.5 rounded-xs border border-slate-400">
                        <input
                          type="checkbox"
                          checked={printIsMustalzamatt}
                          onChange={e => setPrintIsMustalzamatt(e.target.checked)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>مستلزمات تعبئة</span>
                      </label>

                      {/* قائمة اختيار إضافية Dropdown */}
                      <select
                        value={printSelectVal}
                        onChange={e => setPrintSelectVal(e.target.value)}
                        className="w-full bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-1 text-xs outline-none"
                      >
                        <option value="افتراضي">افتراضي</option>
                        <option value="نسخة المورد">نسخة المورد</option>
                        <option value="نسخة الإدارة">نسخة الإدارة</option>
                      </select>

                      {/* مربع إدخال ملاحظات Text Input */}
                      <input
                        type="text"
                        value={printInputVal}
                        onChange={e => setPrintInputVal(e.target.value)}
                        placeholder=""
                        className="w-full bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white p-1 text-xs outline-none font-mono"
                      >
                      </input>

                      {/* زر الطابعة الكلاسيكي PowerBuilder */}
                      <button
                        type="button"
                        onClick={() => window.print()}
                        title="طباعة الفاتورة"
                        className="w-20 h-16 bg-[#d4d0c8] hover:bg-[#e4e0d8] active:bg-[#c0bcba] border-2 border-t-white border-l-white border-b-black border-r-black flex flex-col items-center justify-center gap-1 shadow-md active:border-t-black active:border-l-black mt-2 cursor-pointer"
                      >
                        {/* أيقونة الطابعة الكلاسيكية */}
                        <svg className="w-10 h-10 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                        </svg>
                      </button>

                      {/* زر إغلاق */}
                      <button
                        type="button"
                        onClick={() => setShowSummaryPrintModal(false)}
                        className="w-20 py-1 bg-[#d4d0c8] hover:bg-[#e4e0d8] border-2 border-t-white border-l-white border-b-black border-r-black text-xs font-bold text-slate-900 shadow-sm"
                      >
                        إغلاق
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: w_print_fwateer (9-2): طباعة فواتير */}
        {/* ========================================================= */}
        {activeTab === 'w_print_fwateer' && (
          <div className="space-y-3">
            {/* شريط الفلاتر */}
            <div className="bg-[#ece9d8] border border-slate-400 p-2.5 rounded-xs flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">من:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">إلى:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">المورد:</span>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="bg-white border border-slate-400 px-2 py-0.5"
                >
                  <option value="الكل">جميع الموردين</option>
                  {db.suppliers.map((s, idx) => (
                    <option key={`inv_sup_${s.sup_id}_${idx}`} value={s.sup_name}>
                      {s.sup_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">الدفع:</span>
                <select
                  value={paymentTypeFilter}
                  onChange={e => setPaymentTypeFilter(e.target.value as any)}
                  className="bg-white border border-slate-400 px-2 py-0.5"
                >
                  <option value="all">الكل</option>
                  <option value="cash">نقدي فقط</option>
                  <option value="credit">آجل فقط</option>
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <input
                  type="text"
                  placeholder="بحث برقم الفاتورة أو العميل..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-400 px-2 py-0.5 text-xs"
                />
              </div>

              <button
                onClick={() => {
                  setDateFrom('2026-01-01');
                  setDateTo(todayStr);
                  setSelectedSupplier('الكل');
                  setSearchQuery('');
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-400 rounded-xs flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3 text-slate-600" />
                <span>إعادة ضبط</span>
              </button>
            </div>

            {/* جدول الفواتير dw_print_fwateer */}
            <div className="border border-slate-400 max-h-80 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">اسم المورد</th>
                    <th className="p-1.5 border-l border-slate-400">اسم العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">النوع</th>
                    <th className="p-1.5 text-center">معاينة وطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((inv, idx) => (
                    <tr
                      key={`inv_filt_${inv.id}_${idx}`}
                      onClick={() => setPreviewFatora(inv)}
                      className={`cursor-pointer transition-colors ${
                        previewFatora?.id === inv.id
                          ? 'bg-blue-100 font-bold'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                        {inv.id}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                        {inv.trans_date}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-medium">{inv.sup_name}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold text-slate-800">
                        {inv.customer_name}
                      </td>
                      <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {inv.sobata_num}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-black text-slate-900">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center">
                        <span
                          className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                            inv.cash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.cash ? 'نقدي' : 'آجل'}
                        </span>
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setPreviewFatora(inv);
                            if (onPrintFatora) onPrintFatora(inv);
                            else window.print();
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>طباعة</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* معاينة الفاتورة المحددة في الجزء السفلي */}
            {previewFatora && (
              <div className="bg-[#fdfcf7] border-2 border-slate-400 p-3 rounded shadow-sm text-xs">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      معاينة فاتورة رقم #{previewFatora.id} — [{previewFatora.cat_name}]
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                      {previewFatora.cash ? 'سداد نقدي' : 'مسحوب آجل'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (onPrintFatora) onPrintFatora(previewFatora);
                      else window.print();
                    }}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة الفاتورة الفورية</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">المورد: </span>
                    <span className="font-bold text-slate-900">{previewFatora.sup_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">العميل: </span>
                    <span className="font-bold text-slate-900">{previewFatora.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">التاريخ: </span>
                    <span className="font-mono font-bold">{previewFatora.trans_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">النقلة: </span>
                    <span className="font-bold">{previewFatora.nakla_name}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t flex items-center justify-between bg-slate-100 p-2 rounded">
                  <div className="flex items-center gap-4">
                    <span>
                      الوزن الصافي: <b>{Number(previewFatora.net_weight || 0).toLocaleString()} كجم</b>
                    </span>
                    <span>
                      سعر الكيلو: <b>{(Number(previewFatora.price) || 0).toFixed(2)} ج</b>
                    </span>
                    <span>
                      الرهن: <b>{(Number(previewFatora.t_rahn) || 0).toLocaleString()} ج</b>
                    </span>
                  </div>
                  <div className="font-bold text-blue-950 text-sm">
                    الإجمالي النهائي: {(Number(previewFatora.tota) || 0).toLocaleString()} ج.م
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: w_fwateer_print_sum (9-3): طباعة مجموعة فواتير */}
        {/* ========================================================= */}
        {activeTab === 'w_fwateer_print_sum' && (
          <div className="space-y-3">
            {/* Header Cards with aggregates of selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[#ece9d8] border border-slate-400 p-2 text-center rounded-xs">
                <span className="text-slate-600 block text-[11px]">الفواتير المحددة:</span>
                <span className="font-mono font-black text-blue-900 text-lg">
                  {selectedIds.length} <span className="text-xs font-normal">من {filteredInvoices.length}</span>
                </span>
              </div>

              <div className="bg-[#ece9d8] border border-slate-400 p-2 text-center rounded-xs">
                <span className="text-slate-600 block text-[11px]">إجمالي الأوزان المحددة:</span>
                <span className="font-mono font-black text-emerald-800 text-lg">
                  {filteredInvoices
                    .filter(i => selectedIds.includes(i.id))
                    .reduce((sum, i) => sum + (Number(i.net_weight) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal">كجم</span>
                </span>
              </div>

              <div className="bg-[#ece9d8] border border-slate-400 p-2 text-center rounded-xs">
                <span className="text-slate-600 block text-[11px]">إجمالي قيمة البضاعة:</span>
                <span className="font-mono font-black text-slate-900 text-lg">
                  {filteredInvoices
                    .filter(i => selectedIds.includes(i.id))
                    .reduce((sum, i) => sum + (Number(i.totally) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal">ج</span>
                </span>
              </div>

              <div className="bg-blue-900 text-white border border-blue-950 p-2 text-center rounded-xs">
                <span className="text-blue-200 block text-[11px]">الإجمالي الشامل (مع الرهن):</span>
                <span className="font-mono font-black text-amber-300 text-lg">
                  {filteredInvoices
                    .filter(i => selectedIds.includes(i.id))
                    .reduce((sum, i) => sum + (Number(i.tota) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal text-white">ج.م</span>
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-slate-100 border border-slate-300 p-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectAll(filteredInvoices)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 font-bold rounded flex items-center gap-1"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>اختيار الجميع</span>
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 font-bold rounded flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 text-slate-600" />
                  <span>إلغاء الجميع</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={selectedIds.length === 0}
                  onClick={() => {
                    const sel = filteredInvoices.filter(i => selectedIds.includes(i.id));
                    setBatchPrintModal({
                      title: 'طباعة كشف مجمع للفواتير المحددة (dw_fwateer_print_sum)',
                      invoices: sel
                    });
                  }}
                  className={`px-3 py-1 font-bold rounded flex items-center gap-1 shadow-xs ${
                    selectedIds.length > 0
                      ? 'bg-blue-800 hover:bg-blue-900 text-white cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة كشف مجمع ({selectedIds.length})</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center w-10">تحديد</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">قيمة البضاعة</th>
                    <th className="p-1.5 text-center font-mono">الإجمالي الشامل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((inv, idx) => {
                    const isSelected = selectedIds.includes(inv.id);
                    return (
                      <tr
                        key={`inv_sel_${inv.id}_${idx}`}
                        onClick={() => handleToggleSelect(inv.id)}
                        className={`cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-1.5 border-l border-slate-300 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(inv.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                          {inv.id}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                          {inv.trans_date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                        <td className="p-1.5 border-l border-slate-300 font-bold">{inv.customer_name}</td>
                        <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {inv.sobata_num}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                          {Number(inv.net_weight || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {(Number(inv.price) || 0).toFixed(2)}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                          {(Number(inv.totally) || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 text-center font-mono font-black text-slate-900">
                          {(Number(inv.tota) || 0).toLocaleString()} ج
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: w_fwateer_print_sum_for_sup (9-4): طباعة فواتير لمورد */}
        {/* ========================================================= */}
        {activeTab === 'w_fwateer_print_sum_for_sup' && (
          <div className="space-y-3">
            {/* اختيار المورد وبياناته */}
            <div className="bg-[#ece9d8] border border-slate-400 p-3 rounded-xs text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">المورد المطلوب:</span>
                  <select
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                    className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white px-3 py-1 font-bold text-slate-900 text-xs min-w-[220px]"
                  >
                    <option value="الكل">-- اختر مورداً من القائمة --</option>
                    {db.suppliers.map((s, idx) => (
                      <option key={`inv_sup_opt_${s.sup_id}_${idx}`} value={s.sup_name}>
                        {s.sup_name} — (عمولة: {(s.comission * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={selectedSupplier === 'الكل' || supplierInvoices.length === 0}
                    onClick={() => {
                      setBatchPrintModal({
                        title: `كشف فواتير ومبيعات المورد: ${selectedSupplier} (dw_fwateer_print_sum_for_sup)`,
                        invoices: supplierInvoices,
                        supplierName: selectedSupplier
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة كشف فواتير المورد ({supplierInvoices.length})</span>
                  </button>
                </div>
              </div>

              {/* ملخص المورد المختار */}
              {selectedSupplier !== 'الكل' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300">
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">اسم المورد:</span>
                    <span className="font-bold text-slate-900">{selectedSupplier}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">عدد الفواتير المسجلة:</span>
                    <span className="font-mono font-bold text-blue-900">{supplierInvoices.length} فاتورة</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">إجمالي أوزان المورد:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {supplierInvoices.reduce((s, i) => s + (Number(i.net_weight) || 0), 0).toLocaleString()} كجم
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">إجمالي مبيعات فواتيره:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {supplierInvoices.reduce((s, i) => s + (Number(i.tota) || 0), 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* جدول فواتير المورد */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">النقلة</th>
                    <th className="p-1.5 border-l border-slate-400">المزرعة</th>
                    <th className="p-1.5 border-l border-slate-400">العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الصافي (كجم)</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">قيمة البضاعة</th>
                    <th className="p-1.5 text-center font-mono">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {supplierInvoices.map((inv, idx) => (
                    <tr key={`inv_sup_row_${inv.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                        {inv.id}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                        {inv.trans_date}
                      </td>
                      <td className="p-1.5 border-l border-slate-300">{inv.nakla_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.farm_name}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{inv.customer_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {inv.sobata_num}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.totally) || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 text-center font-mono font-black text-slate-900">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: w_fwateer_print_sum_for_farm (9-5): طباعة فواتير لمزرعة */}
        {/* ========================================================= */}
        {activeTab === 'w_fwateer_print_sum_for_farm' && (
          <div className="space-y-3">
            <div className="bg-[#ece9d8] border border-slate-400 p-3 rounded-xs text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">المزرعة المطلوبة:</span>
                  <select
                    value={selectedFarm}
                    onChange={e => setSelectedFarm(e.target.value)}
                    className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white px-3 py-1 font-bold text-slate-900 text-xs min-w-[220px]"
                  >
                    <option value="الكل">-- اختر مزرعة من القائمة --</option>
                    {db.farms.map((f, idx) => (
                      <option key={`inv_farm_opt_${f.farm_id}_${idx}`} value={f.farm_name}>
                        {f.farm_name} — ({f.sup_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={selectedFarm === 'الكل' || farmInvoices.length === 0}
                    onClick={() => {
                      setBatchPrintModal({
                        title: `كشف مبيعات وفواتير المزرعة: ${selectedFarm} (dw_fwateer_print_sum_for_farm)`,
                        invoices: farmInvoices,
                        farmName: selectedFarm
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1.5 disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة كشف فواتير المزرعة ({farmInvoices.length})</span>
                  </button>
                </div>
              </div>

              {selectedFarm !== 'الكل' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300">
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">اسم المزرعة:</span>
                    <span className="font-bold text-slate-900">{selectedFarm}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">عدد الفواتير:</span>
                    <span className="font-mono font-bold text-blue-900">{farmInvoices.length} فاتورة</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">إجمالي أوزان المزرعة:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {farmInvoices.reduce((s, i) => s + (Number(i.net_weight) || 0), 0).toLocaleString()} كجم
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-300">
                    <span className="text-slate-500 text-[11px] block">إجمالي قيمة المبيعات:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {farmInvoices.reduce((s, i) => s + (Number(i.tota) || 0), 0).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* جدول فواتير المزرعة */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد التابع</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الصافي (كجم)</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 text-center">العميل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {farmInvoices.map((inv, idx) => (
                    <tr key={`inv_farm_row_${inv.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                        {inv.id}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                        {inv.trans_date}
                      </td>
                      <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{inv.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {inv.sobata_num}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-black text-slate-900">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                      <td className="p-1.5 text-slate-700">{inv.customer_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: w_sarf_fatora_group (9-6): صرف مجموعة فواتير */}
        {/* ========================================================= */}
        {activeTab === 'w_sarf_fatora_group' && (
          <div className="space-y-3">
            {/* بطاقة صرف من الخزينة التفاعلية */}
            <div className="bg-[#f2efe9] border-2 border-slate-400 p-3 rounded-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-800">حالة الصرف:</span>
                  <select
                    value={sarfFilter}
                    onChange={e => setSarfFilter(e.target.value as any)}
                    className="bg-white border border-slate-400 px-2 py-1 font-bold text-slate-800 text-xs"
                  >
                    <option value="unsarfed">فواتير لم تصرف بعد (جاهزة للصرف)</option>
                    <option value="sarfed">فواتير تم صرفها سابقاً</option>
                    <option value="all">كافة الفواتير</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(groupSarfInvoices)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>اختيار الجميع</span>
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-600" />
                    <span>إلغاء الجميع</span>
                  </button>
                </div>
              </div>

              {/* ملخص الحسبة المالية للصرف الجماعي */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-slate-300 text-center">
                  <span className="text-slate-500 text-[11px] block">الفواتير المحددة:</span>
                  <span className="font-mono font-black text-blue-900 text-base">
                    {selectedIds.length} فاتورة
                  </span>
                </div>

                <div className="bg-white p-2 rounded border border-slate-300 text-center">
                  <span className="text-slate-500 text-[11px] block">إجمالي المبيعات:</span>
                  <span className="font-mono font-black text-slate-900 text-base">
                    {groupSarfInvoices
                      .filter(i => selectedIds.includes(i.id))
                      .reduce((sum, i) => sum + (Number(i.totally) || 0), 0)
                      .toLocaleString()}{' '}
                    ج
                  </span>
                </div>

                <div className="bg-white p-2 rounded border border-slate-300 text-center">
                  <span className="text-slate-500 text-[11px] block">العمولة المستقطعة (6%):</span>
                  <span className="font-mono font-bold text-amber-900 text-base">
                    {Math.round(
                      groupSarfInvoices
                        .filter(i => selectedIds.includes(i.id))
                        .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.06
                    ).toLocaleString()}{' '}
                    ج
                  </span>
                </div>

                <div className="bg-emerald-900 text-white p-2 rounded border border-emerald-950 text-center">
                  <span className="text-emerald-200 text-[11px] block">صافي الصرف المطلوب:</span>
                  <span className="font-mono font-black text-amber-300 text-lg">
                    {Math.round(
                      groupSarfInvoices
                        .filter(i => selectedIds.includes(i.id))
                        .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.94
                    ).toLocaleString()}{' '}
                    ج.م
                  </span>
                </div>
              </div>

              {/* زر تنفيذ الصرف */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  disabled={selectedIds.length === 0}
                  onClick={handleExecuteGroupSarf}
                  className={`px-4 py-2 text-xs font-black rounded-xs border-2 shadow flex items-center gap-2 ${
                    selectedIds.length > 0
                      ? 'bg-rose-700 hover:bg-rose-800 text-white border-t-rose-400 border-l-rose-400 border-b-rose-950 border-r-rose-950 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>صرف الفواتير المحددة من الخزينة ({selectedIds.length})</span>
                </button>
              </div>
            </div>

            {/* جدول الفواتير dw_sarf_fatora_group */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center w-10">تحديد</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">النقلة</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">العمولة</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">صافي الصرف</th>
                    <th className="p-1.5 text-center">حالة الصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {groupSarfInvoices.map((inv, idx) => {
                    const isSelected = selectedIds.includes(inv.id);
                    const isSarfed = isInvoiceSarfed(inv);
                    const totallyNum = Number(inv.totally) || 0;
                    const comm = Math.round(totallyNum * 0.06);
                    const net = totallyNum - comm;

                    return (
                      <tr
                        key={`inv_gsarf_${inv.id}_${idx}`}
                        onClick={() => handleToggleSelect(inv.id)}
                        className={`cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 font-bold'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-1.5 border-l border-slate-300 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(inv.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                          {inv.id}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                          {inv.trans_date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-bold">{inv.sup_name}</td>
                        <td className="p-1.5 border-l border-slate-300">{inv.nakla_name}</td>
                        <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {Number(inv.net_weight || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                          {totallyNum.toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono text-slate-600">
                          {comm.toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-black text-emerald-900">
                          {net.toLocaleString()} ج
                        </td>
                        <td className="p-1.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSarfed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isSarfed ? 'تم الصرف' : 'معلقة بالخزينة'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: w_fatora_today_report (9-7): تقرير فواتير اليوم */}
        {/* ========================================================= */}
        {activeTab === 'w_fatora_today_report' && (
          <div className="space-y-3">
            {/* بطاقات أرقام فواتير اليوم السريعة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white border-2 border-slate-300 p-2.5 rounded shadow-2xs">
                <span className="text-slate-500 text-[11px] block">فواتير اليوم ({todayStr}):</span>
                <span className="font-mono font-black text-2xl text-blue-900 block mt-0.5">
                  {todayInvoices.length} <span className="text-xs font-normal">فاتورة</span>
                </span>
              </div>

              <div className="bg-white border-2 border-slate-300 p-2.5 rounded shadow-2xs">
                <span className="text-slate-500 text-[11px] block">إجمالي أوزان اليوم:</span>
                <span className="font-mono font-black text-2xl text-emerald-800 block mt-0.5">
                  {todayInvoices
                    .reduce((s, i) => s + (Number(i.net_weight) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal">كجم</span>
                </span>
              </div>

              <div className="bg-white border-2 border-slate-300 p-2.5 rounded shadow-2xs">
                <span className="text-slate-500 text-[11px] block">مبيعات اليوم الكلية:</span>
                <span className="font-mono font-black text-2xl text-slate-900 block mt-0.5">
                  {todayInvoices
                    .reduce((s, i) => s + (Number(i.tota) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal">ج.م</span>
                </span>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-300 p-2.5 rounded shadow-2xs">
                <span className="text-emerald-800 text-[11px] font-bold block">النقدية الفورية (كاش):</span>
                <span className="font-mono font-black text-2xl text-emerald-900 block mt-0.5">
                  {todayInvoices
                    .filter(i => i.cash)
                    .reduce((s, i) => s + (Number(i.tota) || 0), 0)
                    .toLocaleString()}{' '}
                  <span className="text-xs font-normal">ج.م</span>
                </span>
              </div>
            </div>

            {/* شريط الإجراءات */}
            <div className="flex items-center justify-between text-xs bg-slate-100 p-2 rounded border border-slate-300">
              <span className="font-bold text-slate-800">
                تقرير شامل بكافة فواتير اليوم الصادرة بمحل 67:
              </span>
              <button
                onClick={() => {
                  setBatchPrintModal({
                    title: `تقرير فواتير اليوم - ${todayStr} (dw_fatora_today_report)`,
                    invoices: todayInvoices
                  });
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة تقرير فواتير اليوم</span>
              </button>
            </div>

            {/* جدول فواتير اليوم */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم</th>
                    <th className="p-1.5 border-l border-slate-400">النقلة</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 text-center">نوع الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {todayInvoices.map((inv, idx) => (
                    <tr key={`inv_today_${inv.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                        {inv.id}
                      </td>
                      <td className="p-1.5 border-l border-slate-300">{inv.nakla_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{inv.customer_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {inv.sobata_num}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-black text-slate-900">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                      <td className="p-1.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            inv.cash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.cash ? 'نقدي' : 'آجل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: w_fatora_period_report (9-8): تقرير فواتير عن فترة */}
        {/* ========================================================= */}
        {activeTab === 'w_fatora_period_report' && (
          <div className="space-y-3">
            {/* شريط محددات تقرير الفترة */}
            <div className="bg-[#ece9d8] border border-slate-400 p-2.5 rounded-xs flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">من تاريخ:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">إلى تاريخ:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">المورد:</span>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="bg-white border border-slate-400 px-2 py-0.5 text-xs"
                >
                  <option value="الكل">كافة الموردين</option>
                  {db.suppliers.map((s, idx) => (
                    <option key={`inv_per_sup_${s.sup_id}_${idx}`} value={s.sup_name}>
                      {s.sup_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700">المزرعة:</span>
                <select
                  value={selectedFarm}
                  onChange={e => setSelectedFarm(e.target.value)}
                  className="bg-white border border-slate-400 px-2 py-0.5 text-xs"
                >
                  <option value="الكل">كافة المزارع</option>
                  {db.farms.map((f, idx) => (
                    <option key={`inv_per_farm_${f.farm_id}_${idx}`} value={f.farm_name}>
                      {f.farm_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setBatchPrintModal({
                    title: `تقرير فواتير عن فترة (${dateFrom} إلى ${dateTo}) [dw_fatora_period_report]`,
                    invoices: filteredInvoices
                  });
                }}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة تقرير الفترة ({filteredInvoices.length})</span>
              </button>
            </div>

            {/* إحصائيات تقرير الفترة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-200">
              <div>
                <span className="text-slate-500">عدد الفواتير بالفترة:</span>
                <span className="font-mono font-bold text-slate-900 block text-base">
                  {filteredInvoices.length}
                </span>
              </div>
              <div>
                <span className="text-slate-500">إجمالي الأوزان المباعة:</span>
                <span className="font-mono font-bold text-emerald-800 block text-base">
                  {filteredInvoices
                    .reduce((s, i) => s + (Number(i.net_weight) || 0), 0)
                    .toLocaleString()}{' '}
                  كجم
                </span>
              </div>
              <div>
                <span className="text-slate-500">إجمالي قيمة الفواتير:</span>
                <span className="font-mono font-bold text-blue-900 block text-base">
                  {filteredInvoices
                    .reduce((s, i) => s + (Number(i.tota) || 0), 0)
                    .toLocaleString()}{' '}
                  ج.م
                </span>
              </div>
              <div>
                <span className="text-slate-500">متوسط سعر الكيلو بالفترة:</span>
                <span className="font-mono font-bold text-amber-900 block text-base">
                  {filteredInvoices.reduce((s, i) => s + (Number(i.net_weight) || 0), 0) > 0
                    ? (
                        filteredInvoices.reduce((s, i) => s + (Number(i.totally) || 0), 0) /
                        filteredInvoices.reduce((s, i) => s + (Number(i.net_weight) || 0), 0)
                      ).toFixed(2)
                    : '0.00'}{' '}
                  ج/كجم
                </span>
              </div>
            </div>

            {/* جدول الفترة */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">م</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">المزرعة</th>
                    <th className="p-1.5 border-l border-slate-400">العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center">العبوات</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 text-center">الدفع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((inv, idx) => (
                    <tr key={`inv_period_${inv.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                        {inv.id}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                        {inv.trans_date}
                      </td>
                      <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.farm_name}</td>
                      <td className="p-1.5 border-l border-slate-300 font-bold">{inv.customer_name}</td>
                      <td className="p-1.5 border-l border-slate-300">{inv.cat_name}</td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {inv.sobata_num}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-emerald-800">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border-l border-slate-300 text-center font-mono font-black text-slate-900">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                      <td className="p-1.5 text-center">
                        <span
                          className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                            inv.cash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.cash ? 'نقدي' : 'آجل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: w_sarf_fatora_group_for_sup (9-9): صرف فواتير لمورد */}
        {/* ========================================================= */}
        {activeTab === 'w_sarf_fatora_group_for_sup' && (
          <div className="space-y-3">
            {/* بطاقة صرف مستحقات المورد */}
            <div className="bg-[#ece9d8] border border-slate-400 p-3 rounded-xs text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">اختر المورد للصرف:</span>
                  <select
                    value={selectedSupplier}
                    onChange={e => {
                      setSelectedSupplier(e.target.value);
                      setSelectedIds([]);
                    }}
                    className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white px-3 py-1 font-bold text-slate-900 text-xs min-w-[220px]"
                  >
                    <option value="الكل">-- اختر مورداً --</option>
                    {db.suppliers.map((s, idx) => (
                      <option key={`inv_sarf_sup_${s.sup_id}_${idx}`} value={s.sup_name}>
                        {s.sup_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(supplierInvoices)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>تحديد فواتير المورد كلها</span>
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-600" />
                    <span>إلغاء التحديد</span>
                  </button>
                </div>
              </div>

              {/* ملخص حساب المورد المالي */}
              {selectedSupplier !== 'الكل' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300">
                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">الفواتير المختارة:</span>
                    <span className="font-mono font-black text-blue-900 text-base">
                      {selectedIds.length} فاتورة
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">مجموع المبيعات:</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      {supplierInvoices
                        .filter(i => selectedIds.includes(i.id))
                        .reduce((sum, i) => sum + (Number(i.totally) || 0), 0)
                        .toLocaleString()}{' '}
                      ج
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">عمولة الوكالة المستقطعة:</span>
                    <span className="font-mono font-bold text-amber-900 text-base">
                      {Math.round(
                        supplierInvoices
                          .filter(i => selectedIds.includes(i.id))
                          .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.06
                      ).toLocaleString()}{' '}
                      ج
                    </span>
                  </div>

                  <div className="bg-emerald-900 text-white p-2 rounded border border-emerald-950 text-center">
                    <span className="text-emerald-200 text-[11px] block">صافي مستحق المورد:</span>
                    <span className="font-mono font-black text-amber-300 text-lg">
                      {Math.round(
                        supplierInvoices
                          .filter(i => selectedIds.includes(i.id))
                          .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.94
                      ).toLocaleString()}{' '}
                      ج.م
                    </span>
                  </div>
                </div>
              )}

              {/* زر الصرف */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  disabled={selectedIds.length === 0 || selectedSupplier === 'الكل'}
                  onClick={handleExecuteGroupSarf}
                  className={`px-4 py-2 text-xs font-black rounded-xs border-2 shadow flex items-center gap-2 ${
                    selectedIds.length > 0 && selectedSupplier !== 'الكل'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white border-t-rose-400 border-l-rose-400 border-b-rose-950 border-r-rose-950 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>صرف مستحقات المورد ({selectedSupplier}) من الخزينة</span>
                </button>
              </div>
            </div>

            {/* جدول فواتير المورد المتاحة للصرف */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center w-10">تحديد</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">النقلة</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">إجمالي الفاتورة</th>
                    <th className="p-1.5 text-center font-mono">الصافي للمورد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {supplierInvoices.map((inv, idx) => {
                    const isSelected = selectedIds.includes(inv.id);
                    const totallyNum = Number(inv.totally) || 0;
                    const comm = Math.round(totallyNum * 0.06);
                    const net = totallyNum - comm;

                    return (
                      <tr
                        key={`inv_sup_sarf_${inv.id}_${idx}`}
                        onClick={() => handleToggleSelect(inv.id)}
                        className={`cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 font-bold'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-1.5 border-l border-slate-300 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(inv.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                          {inv.id}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                          {inv.trans_date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300">{inv.nakla_name}</td>
                        <td className="p-1.5 border-l border-slate-300 font-bold">{inv.cat_name}</td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {Number(inv.net_weight || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {(Number(inv.price) || 0).toFixed(2)}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                          {totallyNum.toLocaleString()} ج
                        </td>
                        <td className="p-1.5 text-center font-mono font-black text-emerald-900">
                          {net.toLocaleString()} ج
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: w_sarf_fatora_group_for_farm (9-10): صرف فواتير لمزرعة */}
        {/* ========================================================= */}
        {activeTab === 'w_sarf_fatora_group_for_farm' && (
          <div className="space-y-3">
            <div className="bg-[#ece9d8] border border-slate-400 p-3 rounded-xs text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">اختر المزرعة للصرف:</span>
                  <select
                    value={selectedFarm}
                    onChange={e => {
                      setSelectedFarm(e.target.value);
                      setSelectedIds([]);
                    }}
                    className="bg-white border-2 border-t-slate-600 border-l-slate-600 border-b-white border-r-white px-3 py-1 font-bold text-slate-900 text-xs min-w-[220px]"
                  >
                    <option value="الكل">-- اختر مزرعة --</option>
                    {db.farms.map((f, idx) => (
                      <option key={`inv_sarf_farm_${f.farm_id}_${idx}`} value={f.farm_name}>
                        {f.farm_name} — ({f.sup_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(farmInvoices)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>تحديد فواتير المزرعة كلها</span>
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-400 text-xs font-bold rounded flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5 text-slate-600" />
                    <span>إلغاء التحديد</span>
                  </button>
                </div>
              </div>

              {selectedFarm !== 'الكل' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300">
                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">فواتير مختارة:</span>
                    <span className="font-mono font-black text-blue-900 text-base">
                      {selectedIds.length} فاتورة
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">إجمالي مبيعاتها:</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      {farmInvoices
                        .filter(i => selectedIds.includes(i.id))
                        .reduce((sum, i) => sum + (Number(i.totally) || 0), 0)
                        .toLocaleString()}{' '}
                      ج
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded border border-slate-300 text-center">
                    <span className="text-slate-500 text-[11px] block">عمولة الوكالة:</span>
                    <span className="font-mono font-bold text-amber-900 text-base">
                      {Math.round(
                        farmInvoices
                          .filter(i => selectedIds.includes(i.id))
                          .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.06
                      ).toLocaleString()}{' '}
                      ج
                    </span>
                  </div>

                  <div className="bg-emerald-900 text-white p-2 rounded border border-emerald-950 text-center">
                    <span className="text-emerald-200 text-[11px] block">صافي مستحق المزرعة:</span>
                    <span className="font-mono font-black text-amber-300 text-lg">
                      {Math.round(
                        farmInvoices
                          .filter(i => selectedIds.includes(i.id))
                          .reduce((sum, i) => sum + (Number(i.totally) || 0), 0) * 0.94
                      ).toLocaleString()}{' '}
                      ج.م
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end">
                <button
                  disabled={selectedIds.length === 0 || selectedFarm === 'الكل'}
                  onClick={handleExecuteGroupSarf}
                  className={`px-4 py-2 text-xs font-black rounded-xs border-2 shadow flex items-center gap-2 ${
                    selectedIds.length > 0 && selectedFarm !== 'الكل'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white border-t-rose-400 border-l-rose-400 border-b-rose-950 border-r-rose-950 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>صرف مستحقات المزرعة ({selectedFarm}) من الخزينة</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center w-10">تحديد</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الإجمالي</th>
                    <th className="p-1.5 text-center font-mono">صافي المزرعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {farmInvoices.map((inv, idx) => {
                    const isSelected = selectedIds.includes(inv.id);
                    const totallyNum = Number(inv.totally) || 0;
                    const comm = Math.round(totallyNum * 0.06);
                    const net = totallyNum - comm;

                    return (
                      <tr
                        key={`inv_farm_sarf_${inv.id}_${idx}`}
                        onClick={() => handleToggleSelect(inv.id)}
                        className={`cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 font-bold'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50'
                        }`}
                      >
                        <td className="p-1.5 border-l border-slate-300 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(inv.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                          {inv.id}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                          {inv.trans_date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                        <td className="p-1.5 border-l border-slate-300 font-bold">{inv.cat_name}</td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {Number(inv.net_weight || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {(Number(inv.price) || 0).toFixed(2)}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                          {totallyNum.toLocaleString()} ج
                        </td>
                        <td className="p-1.5 text-center font-mono font-black text-emerald-900">
                          {net.toLocaleString()} ج
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: w_print_fwateer_diff_avg_price (9-11): فروق متوسط اسعار */}
        {/* ========================================================= */}
        {activeTab === 'w_print_fwateer_diff_avg_price' && (
          <div className="space-y-3">
            {/* بطاقة الشرح والمعلومات */}
            <div className="bg-[#f5f3ec] border-2 border-slate-300 p-2.5 rounded text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>تحليل فروق أسعار البيع مقارنة بمتوسط سعر الصنف بسوق الجملة:</span>
                </span>
                <p className="text-slate-600 text-[11px]">
                  يتم احتساب متوسط السعر المرجح (إجمالي قيمة مبيعات الصنف ÷ إجمالي أوزانه)، وحساب فرق كل فاتورة (فائض أو عجز مالي).
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة تقرير الفروق</span>
              </button>
            </div>

            {/* إحصائيات الفروق العامة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-300 p-2 rounded text-center">
                <span className="text-emerald-800 text-[11px] block font-bold">مبيعات بأعلى من المتوسط (فائض):</span>
                <span className="font-mono font-black text-emerald-900 text-base">
                  +{priceDiffReport
                    .filter(i => i.totalDiffFinancial > 0)
                    .reduce((s, i) => s + i.totalDiffFinancial, 0)
                    .toLocaleString()}{' '}
                  ج.م
                </span>
              </div>

              <div className="bg-rose-50 border border-rose-300 p-2 rounded text-center">
                <span className="text-rose-800 text-[11px] block font-bold">مبيعات بأقل من المتوسط (عجز):</span>
                <span className="font-mono font-black text-rose-900 text-base">
                  {priceDiffReport
                    .filter(i => i.totalDiffFinancial < 0)
                    .reduce((s, i) => s + i.totalDiffFinancial, 0)
                    .toLocaleString()}{' '}
                  ج.م
                </span>
              </div>

              <div className="bg-white border border-slate-300 p-2 rounded text-center">
                <span className="text-slate-600 text-[11px] block font-bold">صافي أثر الفروق المالية:</span>
                <span className="font-mono font-black text-blue-950 text-base">
                  {priceDiffReport
                    .reduce((s, i) => s + i.totalDiffFinancial, 0)
                    .toLocaleString()}{' '}
                  ج.م
                </span>
              </div>

              <div className="bg-white border border-slate-300 p-2 rounded text-center">
                <span className="text-slate-600 text-[11px] block font-bold">إجمالي الفواتير المحللة:</span>
                <span className="font-mono font-black text-slate-800 text-base">
                  {priceDiffReport.length} فاتورة
                </span>
              </div>
            </div>

            {/* جدول فروق متوسط الأسعار dw_print_fwateer_diff_avg_price */}
            <div className="border border-slate-400 max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-[#ece9d8] text-slate-800 sticky top-0 border-b border-slate-400 text-[11px]">
                  <tr>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">رقم الفاتورة</th>
                    <th className="p-1.5 border-l border-slate-400">التاريخ</th>
                    <th className="p-1.5 border-l border-slate-400">المورد</th>
                    <th className="p-1.5 border-l border-slate-400">العميل</th>
                    <th className="p-1.5 border-l border-slate-400">الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">السعر الفعلي</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">متوسط الصنف</th>
                    <th className="p-1.5 border-l border-slate-400 text-center font-mono">فرق الكيلو</th>
                    <th className="p-1.5 text-center font-mono">إجمالي الفرق المالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priceDiffReport.map((inv, idx) => {
                    const isPositive = inv.diffPerKg > 0;
                    const isNegative = inv.diffPerKg < 0;

                    return (
                      <tr key={`inv_diff_${inv.id}_${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold text-blue-900">
                          {inv.id}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 font-mono text-[11px]">
                          {inv.trans_date}
                        </td>
                        <td className="p-1.5 border-l border-slate-300">{inv.sup_name}</td>
                        <td className="p-1.5 border-l border-slate-300 font-bold">{inv.customer_name}</td>
                        <td className="p-1.5 border-l border-slate-300 font-semibold">{inv.cat_name}</td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono">
                          {Number(inv.net_weight || 0).toLocaleString()}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                          {(Number(inv.price) || 0).toFixed(2)}
                        </td>
                        <td className="p-1.5 border-l border-slate-300 text-center font-mono text-slate-600">
                          {inv.avgPrice.toFixed(2)}
                        </td>
                        <td
                          className={`p-1.5 border-l border-slate-300 text-center font-mono font-bold ${
                            isPositive
                              ? 'text-emerald-700 bg-emerald-50'
                              : isNegative
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-slate-500'
                          }`}
                        >
                          {isPositive ? `+${inv.diffPerKg.toFixed(2)}` : inv.diffPerKg.toFixed(2)}
                        </td>
                        <td
                          className={`p-1.5 text-center font-mono font-black ${
                            isPositive
                              ? 'text-emerald-800'
                              : isNegative
                              ? 'text-rose-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {isPositive ? `+${inv.totalDiffFinancial.toLocaleString()}` : inv.totalDiffFinancial.toLocaleString()} ج
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. Bottom Statusbar (PowerBuilder Classic) */}
      <div className="bg-[#ece9d8] border-t border-slate-400 px-3 py-1 text-xs text-slate-700 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">
            الحالة: متصل بقاعدة بيانات سوق الجملة (fruit67)
          </span>
          <span className="border-r border-slate-400 h-3"></span>
          <span>إجمالي فواتير النظام: {allInvoices.length}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>التاريخ: {todayStr}</span>
          <span className="border-r border-slate-400 h-3"></span>
          <span className="bg-emerald-700 text-white px-2 py-0.2 rounded font-sans font-bold text-[10px]">
            PB MDI Ready
          </span>
        </div>
      </div>

      {/* 6. Batch Print Preview Modal */}
      {batchPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border-4 border-slate-700">
            {/* Modal Titlebar */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white px-4 py-2 flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{batchPrintModal.title}</span>
              </span>
              <button
                onClick={() => setBatchPrintModal(null)}
                className="text-white hover:bg-rose-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Printable Sheet */}
            <div className="p-6 overflow-y-auto space-y-4 print:p-0">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h2 className="text-xl font-black text-slate-900">
                  وكالة أبو حسن لتجارة الفاكهة والخضار بالجملة
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  سوق الجملة للخضار والفاكهة - 6 أكتوبر | عنبر 1 - محل 67 فاكهة
                </p>
                <div className="mt-2 inline-block bg-slate-100 border border-slate-400 px-4 py-1 rounded font-bold text-xs">
                  {batchPrintModal.title}
                </div>
              </div>

              {/* Sub-info */}
              <div className="flex items-center justify-between text-xs text-slate-700 border-b pb-2">
                <span>تاريخ الطباعة: {todayStr}</span>
                <span>عدد الفواتير: {batchPrintModal.invoices.length}</span>
                {batchPrintModal.supplierName && (
                  <span className="font-bold text-slate-900">المورد: {batchPrintModal.supplierName}</span>
                )}
                {batchPrintModal.farmName && (
                  <span className="font-bold text-slate-900">المزرعة: {batchPrintModal.farmName}</span>
                )}
              </div>

              {/* Table */}
              <table className="w-full text-right text-xs border border-slate-800 border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-1.5 border border-slate-600 text-center font-mono">رقم</th>
                    <th className="p-1.5 border border-slate-600">التاريخ</th>
                    <th className="p-1.5 border border-slate-600">العميل</th>
                    <th className="p-1.5 border border-slate-600">الصنف</th>
                    <th className="p-1.5 border border-slate-600 text-center">العبوات</th>
                    <th className="p-1.5 border border-slate-600 text-center font-mono">الوزن الصافي</th>
                    <th className="p-1.5 border border-slate-600 text-center font-mono">السعر</th>
                    <th className="p-1.5 border border-slate-600 text-center font-mono">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {batchPrintModal.invoices.map((inv, idx) => (
                    <tr key={`inv_bp_${inv.id}_${idx}`} className="border-b border-slate-300">
                      <td className="p-1.5 border border-slate-400 text-center font-mono">{inv.id}</td>
                      <td className="p-1.5 border border-slate-400 font-mono">{inv.trans_date}</td>
                      <td className="p-1.5 border border-slate-400 font-bold">{inv.customer_name}</td>
                      <td className="p-1.5 border border-slate-400">{inv.cat_name}</td>
                      <td className="p-1.5 border border-slate-400 text-center font-mono">{inv.sobata_num}</td>
                      <td className="p-1.5 border border-slate-400 text-center font-mono">
                        {Number(inv.net_weight || 0).toLocaleString()}
                      </td>
                      <td className="p-1.5 border border-slate-400 text-center font-mono">
                        {(Number(inv.price) || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border border-slate-400 text-center font-mono font-bold">
                        {(Number(inv.tota) || 0).toLocaleString()} ج
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-800">
                  <tr>
                    <td colSpan={4} className="p-2 text-center">
                      الإجماليات الكلية للكشف
                    </td>
                    <td className="p-2 text-center font-mono">
                      {batchPrintModal.invoices.reduce((s, i) => s + (Number(i.sobata_num) || 0), 0)}
                    </td>
                    <td className="p-2 text-center font-mono">
                      {batchPrintModal.invoices
                        .reduce((s, i) => s + (Number(i.net_weight) || 0), 0)
                        .toLocaleString()}{' '}
                      كجم
                    </td>
                    <td className="p-2 text-center font-mono">-</td>
                    <td className="p-2 text-center font-mono font-black text-slate-900">
                      {batchPrintModal.invoices
                        .reduce((s, i) => s + (Number(i.tota) || 0), 0)
                        .toLocaleString()}{' '}
                      ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-100 border-t px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => setBatchPrintModal(null)}
                className="px-4 py-1.5 bg-white border border-slate-400 text-xs font-bold rounded"
              >
                إغلاق المعاينة
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-1.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>إرسال إلى الطابعة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
