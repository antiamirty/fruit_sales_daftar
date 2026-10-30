import React, { useState, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import {
  Nakla,
  FatoraF,
  TahseelRecord,
  BranchExp
} from '../types/schema';
import {
  X,
  Square,
  Minus,
  Printer,
  Search,
  CheckCircle,
  Truck,
  FileText,
  DollarSign,
  Receipt,
  AlertCircle,
  Users
} from 'lucide-react';
import { normalizeArabic } from '../utils/arabic';

export type EditsWindowMode =
  | 'w_editing'
  | 'w_nakla_editing'
  | 'w_fatora_editing'
  | 'w_tahseel_editing'
  | 'w_branch_exps_editing'
  | 'w_names_editing'
  | 'w_customer_name_edit'
  | 'w_sup_name_edit'
  | 'w_farm_name_edit'
  | 'w_category_name_edit';

interface EditsWindowProps {
  initialMode?: EditsWindowMode;
  onClose?: () => void;
}

export const EditsWindow: React.FC<EditsWindowProps> = ({
  initialMode = 'w_nakla_editing',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<EditsWindowMode>(
    initialMode === 'w_editing' ? 'w_nakla_editing' : initialMode
  );

  // حالة تعديل المسميات الشامل وقاعدة البيانات (13-5)
  const [nameEditType, setNameEditType] = useState<'customer' | 'supplier' | 'farm' | 'category'>('customer');
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [newEntityName, setNewEntityName] = useState<string>('');

  // Sync if initialMode changes
  useEffect(() => {
    if (initialMode === 'w_editing') {
      setActiveTab('w_nakla_editing');
    } else if (initialMode === 'w_customer_name_edit') {
      setActiveTab('w_names_editing');
      setNameEditType('customer');
    } else if (initialMode === 'w_sup_name_edit') {
      setActiveTab('w_names_editing');
      setNameEditType('supplier');
    } else if (initialMode === 'w_farm_name_edit') {
      setActiveTab('w_names_editing');
      setNameEditType('farm');
    } else if (initialMode === 'w_category_name_edit') {
      setActiveTab('w_names_editing');
      setNameEditType('category');
    } else if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  // Global DB state
  const [dbState, setDbState] = useState(wholesaleStore.getState());
  useEffect(() => {
    return wholesaleStore.subscribe(() => setDbState(wholesaleStore.getState()));
  }, []);

  // UI status message
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Search queries per tab
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // In-app delete confirmation (replaces window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // ==========================================
  // TAB 1: تعديل النقلة (13-1 - dw_nakla_editing)
  // ==========================================
  const [selectedNaklaIdx, setSelectedNaklaIdx] = useState<number>(0);
  const [naklaRows, setNaklaRows] = useState<Nakla[]>([]);

  useEffect(() => {
    setNaklaRows([...dbState.naklat]);
  }, [dbState.naklat]);

  const filteredNaklat = naklaRows.filter(n => {
    const matchQuery =
      !searchQuery ||
      n.nakla_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.sup_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.farm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(n.nakla_number).includes(searchQuery) ||
      (n.driver_name && n.driver_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDate = !dateFilter || n.nakla_date === dateFilter;
    return matchQuery && matchDate;
  });

  const selectedNakla = filteredNaklat[selectedNaklaIdx] || null;

  const handleUpdateCurrentNakla = (field: keyof Nakla, value: any) => {
    if (!selectedNakla) return;
    const updated = { ...selectedNakla, [field]: value };
    setNaklaRows(prev => prev.map(n => n.nakla_id === selectedNakla.nakla_id ? updated : n));
  };

  const handleSaveNakla = () => {
    if (!selectedNakla) return;
    wholesaleStore.updateNakla(selectedNakla.nakla_id, selectedNakla);
    showFeedback(`تم حفظ تعديلات النقلة رقم ${selectedNakla.nakla_number} (${selectedNakla.nakla_name}) بنجاح`);
  };

  const handleAddNakla = () => {
    const nextNum = Math.max(0, ...dbState.naklat.map(n => n.nakla_number)) + 1;
    const today = new Date().toISOString().split('T')[0];
    const newN: Omit<Nakla, 'nakla_id'> = {
      nakla_number: nextNum,
      nakla_name: `نقلة جديدة رقم ${nextNum}`,
      sup_name: dbState.suppliers[0]?.sup_name || 'مورد عام',
      farm_name: dbState.farms[0]?.farm_name || 'مزرعة 1',
      nakla_weight: 1000,
      sobata_number: 50,
      nakla_date: today,
      comission: 0.07,
      byaaa: 10,
      tanzil: 20,
      wahba: 15,
      driver_name: '',
      truck_plate: '',
      nakla_finish: false,
      nakla_sarf: false,
      printed: false
    };
    wholesaleStore.addNakla(newN, [], [], 0);
    setSelectedNaklaIdx(0);
    showFeedback(`تمت إضافة نقلة جديدة رقم ${nextNum}`);
  };

  const handleDeleteNakla = () => {
    if (!selectedNakla) return;
    setDeleteConfirm({
      message: `هل أنت متأكد من حذف النقلة رقم ${selectedNakla.nakla_number} (${selectedNakla.nakla_name})؟`,
      onConfirm: () => {
        wholesaleStore.deleteNakla(selectedNakla.nakla_id);
        setSelectedNaklaIdx(Math.max(0, selectedNaklaIdx - 1));
        showFeedback(`تم حذف النقلة رقم ${selectedNakla.nakla_number}`, 'info');
        setDeleteConfirm(null);
      }
    });
  };

  // ==========================================
  // TAB 2: تعديل الفاتورة (13-2 - dw_fatora_editing)
  // ==========================================
  const [selectedFatoraIdx, setSelectedFatoraIdx] = useState<number>(0);
  const [fatoraRows, setFatoraRows] = useState<FatoraF[]>([]);

  useEffect(() => {
    setFatoraRows([...dbState.fatora_f]);
  }, [dbState.fatora_f]);

  const filteredFwateer = fatoraRows.filter(f => {
    const matchQuery =
      !searchQuery ||
      String(f.id).includes(searchQuery) ||
      f.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.cat_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.nakla_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDate = !dateFilter || f.trans_date === dateFilter;
    return matchQuery && matchDate;
  });

  const selectedFatora = filteredFwateer[selectedFatoraIdx] || null;

  const handleUpdateCurrentFatora = (field: keyof FatoraF, rawValue: any) => {
    if (!selectedFatora) return;
    let updated: FatoraF = { ...selectedFatora, [field]: rawValue };

    // Auto calculate net weight and totals when modifying weight or price
    if (field === 't_weight' || field === 'samah_weight' || field === 'price' || field === 'byaaa' || field === 'rahn' || field === 'sobata_num') {
      const net_weight = Math.max(0, (Number(updated.t_weight) || 0) - (Number(updated.samah_weight) || 0));
      const totally = Math.round(net_weight * (Number(updated.price) || 0) * 100) / 100;
      const t_rahn = updated.rahn_case ? (Number(updated.sobata_num) || 0) * (Number(updated.rahn) || 0) : 0;
      const tota = Math.round((totally + (Number(updated.byaaa) || 0) + t_rahn) * 100) / 100;
      updated = {
        ...updated,
        net_weight,
        totally,
        t_rahn,
        tota
      };
    }

    setFatoraRows(prev => prev.map(f => f.id === selectedFatora.id ? updated : f));
  };

  const handleSaveFatora = () => {
    if (!selectedFatora) return;
    wholesaleStore.updateFatoraF(selectedFatora.id, selectedFatora);
    showFeedback(`تم حفظ تعديل الفاتورة رقم ${selectedFatora.id} بنجاح`);
  };

  const handleAddFatora = () => {
    const nextId = Math.max(0, ...dbState.fatora_f.map(f => f.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    const firstNakla = dbState.naklat[0];
    const firstCust = dbState.customers[0];
    const newF: FatoraF = {
      id: nextId,
      nakla_id: firstNakla ? firstNakla.nakla_id : 1,
      nakla_name: firstNakla ? firstNakla.nakla_name : 'نقلة عامة',
      sup_name: firstNakla ? firstNakla.sup_name : 'مورد عام',
      farm_name: firstNakla ? firstNakla.farm_name : 'مزرعة 1',
      cat_id: 1,
      cat_name: 'طماطم نمرة 1',
      package_unit: 'قفص',
      sobata_num: 10,
      t_weight: 250,
      samah_weight: 20,
      net_weight: 230,
      price: 15,
      totally: 3450,
      byaaa: 10,
      rahn_case: false,
      rahn: 0,
      t_rahn: 0,
      tota: 3460,
      cash: true,
      customer_name: firstCust ? firstCust.customer_name : 'عميل نقدي',
      customer_code: firstCust ? firstCust.customer_code : 1,
      trans_date: today
    };
    wholesaleStore.addFatoraF(newF);
    setSelectedFatoraIdx(0);
    showFeedback(`تمت إضافة فاتورة جديدة رقم ${nextId}`);
  };

  const handleDeleteFatora = () => {
    if (!selectedFatora) return;
    setDeleteConfirm({
      message: `هل أنت متأكد من حذف الفاتورة رقم ${selectedFatora.id} الخاصة بالعميل (${selectedFatora.customer_name})؟`,
      onConfirm: () => {
        wholesaleStore.deleteFatoraF(selectedFatora.id);
        setSelectedFatoraIdx(Math.max(0, selectedFatoraIdx - 1));
        showFeedback(`تم حذف الفاتورة رقم ${selectedFatora.id}`, 'info');
        setDeleteConfirm(null);
      }
    });
  };

  // ==========================================
  // TAB 3: تعديل التحصيل (13-3 - dw_tahseel_editing)
  // ==========================================
  const [selectedTahseelIdx, setSelectedTahseelIdx] = useState<number>(0);
  const [tahseelRows, setTahseelRows] = useState<TahseelRecord[]>([]);

  useEffect(() => {
    setTahseelRows([...dbState.tahseelat]);
  }, [dbState.tahseelat]);

  const filteredTahseel = tahseelRows.filter(t => {
    const matchQuery =
      !searchQuery ||
      String(t.id).includes(searchQuery) ||
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDate = !dateFilter || t.trans_date === dateFilter;
    return matchQuery && matchDate;
  });

  const selectedTahseel = filteredTahseel[selectedTahseelIdx] || null;

  const handleUpdateCurrentTahseel = (field: keyof TahseelRecord, value: any) => {
    if (!selectedTahseel) return;
    const updated = { ...selectedTahseel, [field]: value };
    setTahseelRows(prev => prev.map(t => t.id === selectedTahseel.id ? updated : t));
  };

  const handleSaveTahseel = () => {
    if (!selectedTahseel) return;
    wholesaleStore.updateTahseel(selectedTahseel.id, selectedTahseel);
    showFeedback(`تم حفظ تعديل سند التحصيل رقم ${selectedTahseel.id} للعميل ${selectedTahseel.customer_name} بنجاح`);
  };

  const handleAddTahseel = () => {
    const nextId = Math.max(0, ...dbState.tahseelat.map(t => t.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    const firstCust = dbState.customers[0];
    const newT: TahseelRecord = {
      id: nextId,
      customer_name: firstCust ? firstCust.customer_name : 'عميل عام',
      customer_code: firstCust ? firstCust.customer_code : 1,
      amount: 1000,
      samah: 0,
      payment_type: 'cash',
      trans_date: today,
      notes: 'سند تحصيل نقدية'
    };
    wholesaleStore.addTahseel(newT);
    setSelectedTahseelIdx(0);
    showFeedback(`تمت إضافة سند تحصيل جديد رقم ${nextId}`);
  };

  const handleDeleteTahseel = () => {
    if (!selectedTahseel) return;
    setDeleteConfirm({
      message: `هل أنت متأكد من حذف سند التحصيل رقم ${selectedTahseel.id} للعميل (${selectedTahseel.customer_name})؟`,
      onConfirm: () => {
        wholesaleStore.deleteTahseel(selectedTahseel.id);
        setSelectedTahseelIdx(Math.max(0, selectedTahseelIdx - 1));
        showFeedback(`تم حذف سند التحصيل رقم ${selectedTahseel.id}`, 'info');
        setDeleteConfirm(null);
      }
    });
  };

  // ==========================================
  // TAB 4: تعديل المصروفات (13-4 - dw_branch_exps_editing)
  // ==========================================
  const [selectedExpIdx, setSelectedExpIdx] = useState<number>(0);
  const [expRows, setExpRows] = useState<BranchExp[]>([]);

  useEffect(() => {
    setExpRows([...dbState.branch_exps]);
  }, [dbState.branch_exps]);

  const filteredExps = expRows.filter(e => {
    const matchQuery =
      !searchQuery ||
      String(e.id).includes(searchQuery) ||
      e.exp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDate = !dateFilter || e.date === dateFilter;
    return matchQuery && matchDate;
  });

  const selectedExp = filteredExps[selectedExpIdx] || null;

  const handleUpdateCurrentExp = (field: keyof BranchExp, value: any) => {
    if (!selectedExp) return;
    const updated = { ...selectedExp, [field]: value };
    setExpRows(prev => prev.map(e => e.id === selectedExp.id ? updated : e));
  };

  const handleSaveExp = () => {
    if (!selectedExp) return;
    wholesaleStore.updateBranchExp(selectedExp.id, selectedExp);
    showFeedback(`تم حفظ تعديل المصروف رقم ${selectedExp.id} (${selectedExp.exp_name}) بنجاح`);
  };

  const handleAddExp = () => {
    const nextId = Math.max(0, ...dbState.branch_exps.map(e => e.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    const newE: BranchExp = {
      id: nextId,
      exp_name: 'بوفيه وضيافة',
      exp_amount: 150,
      date: today,
      notes: 'مصروف يومي'
    };
    wholesaleStore.addBranchExp(newE);
    setSelectedExpIdx(0);
    showFeedback(`تمت إضافة مصروف فرع جديد رقم ${nextId}`);
  };

  const handleDeleteExp = () => {
    if (!selectedExp) return;
    setDeleteConfirm({
      message: `هل أنت متأكد من حذف المصروف رقم ${selectedExp.id} (${selectedExp.exp_name})؟`,
      onConfirm: () => {
        wholesaleStore.deleteBranchExp(selectedExp.id);
        setSelectedExpIdx(Math.max(0, selectedExpIdx - 1));
        showFeedback(`تم حذف المصروف رقم ${selectedExp.id}`, 'info');
        setDeleteConfirm(null);
      }
    });
  };

  // ==========================================
  // Router for Current Tab Actions
  // ==========================================
  const handleCurrentAdd = () => {
    if (activeTab === 'w_nakla_editing') handleAddNakla();
    else if (activeTab === 'w_fatora_editing') handleAddFatora();
    else if (activeTab === 'w_tahseel_editing') handleAddTahseel();
    else if (activeTab === 'w_branch_exps_editing') handleAddExp();
  };

  const handleCurrentDelete = () => {
    if (activeTab === 'w_nakla_editing') handleDeleteNakla();
    else if (activeTab === 'w_fatora_editing') handleDeleteFatora();
    else if (activeTab === 'w_tahseel_editing') handleDeleteTahseel();
    else if (activeTab === 'w_branch_exps_editing') handleDeleteExp();
  };

  const handleSaveNameCascade = () => {
    if (!selectedEntityName) {
      showFeedback('⚠️ يرجى اختيار السجل المراد تعديل اسمه أولاً', 'error');
      return;
    }
    const cleanNew = newEntityName.trim();
    if (!cleanNew) {
      showFeedback('⚠️ يرجى كتابة الاسم الجديد', 'error');
      return;
    }
    if (normalizeArabic(cleanNew) === normalizeArabic(selectedEntityName)) {
      showFeedback('⚠️ الاسم الجديد مطابق للاسم الحالي!', 'error');
      return;
    }

    if (nameEditType === 'customer') {
      const exists = dbState.customers.some(c => normalizeArabic(c.customer_name) === normalizeArabic(cleanNew));
      if (exists) {
        showFeedback(`⚠️ خطأ: اسم الزبون [${cleanNew}] مسجل بالفعل! يمنع تكرار الأسماء منعاً للتهرب.`, 'error');
        return;
      }
      wholesaleStore.cascadeRenameCustomer(selectedEntityName, cleanNew);
      showFeedback(`✓ تم تعديل اسم الزبون إلى [${cleanNew}] وتحديث جميع الفواتير والذمم والتحصيلات والخزينة بنجاح!`, 'success');
    } else if (nameEditType === 'supplier') {
      const exists = dbState.suppliers.some(s => normalizeArabic(s.sup_name) === normalizeArabic(cleanNew));
      if (exists) {
        showFeedback(`⚠️ خطأ: اسم المورد [${cleanNew}] مسجل بالفعل! يمنع تكرار الأسماء.`, 'error');
        return;
      }
      wholesaleStore.cascadeRenameSupplier(selectedEntityName, cleanNew);
      showFeedback(`✓ تم تعديل اسم المورد إلى [${cleanNew}] وتحديث جميع النقلات والمزارع والمصروفات والفواتير بنجاح!`, 'success');
    } else if (nameEditType === 'farm') {
      const exists = dbState.farms.some(f => normalizeArabic(f.farm_name) === normalizeArabic(cleanNew));
      if (exists) {
        showFeedback(`⚠️ خطأ: اسم المزرعة [${cleanNew}] مسجل بالفعل! يمنع تكرار الأسماء.`, 'error');
        return;
      }
      wholesaleStore.cascadeRenameFarm(selectedEntityName, cleanNew);
      showFeedback(`✓ تم تعديل اسم المزرعة إلى [${cleanNew}] وتحديث كافة النقلات والفواتير بنجاح!`, 'success');
    } else if (nameEditType === 'category') {
      const exists = dbState.categories.some(c => normalizeArabic(c.cat_name) === normalizeArabic(cleanNew));
      if (exists) {
        showFeedback(`⚠️ خطأ: اسم الصنف [${cleanNew}] مسجل بالفعل! يمنع تكرار الأسماء.`, 'error');
        return;
      }
      wholesaleStore.cascadeRenameCategory(selectedEntityName, cleanNew);
      showFeedback(`✓ تم تعديل اسم الصنف إلى [${cleanNew}] وتحديث كافة النقلات والفواتير بنجاح!`, 'success');
    }
    setSelectedEntityName(cleanNew);
    setNewEntityName('');
  };

  const handleCurrentSave = () => {
    if (activeTab === 'w_nakla_editing') handleSaveNakla();
    else if (activeTab === 'w_fatora_editing') handleSaveFatora();
    else if (activeTab === 'w_tahseel_editing') handleSaveTahseel();
    else if (activeTab === 'w_branch_exps_editing') handleSaveExp();
    else handleSaveNameCascade();
  };

  const handleCurrentPrint = () => {
    setShowPrintModal(true);
  };

  // Header Details info
  const getTabBadge = () => {
    switch (activeTab) {
      case 'w_nakla_editing':
        return '13-1';
      case 'w_fatora_editing':
        return '13-2';
      case 'w_tahseel_editing':
        return '13-3';
      case 'w_branch_exps_editing':
        return '13-4';
      case 'w_names_editing':
      case 'w_customer_name_edit':
      case 'w_sup_name_edit':
      case 'w_farm_name_edit':
      case 'w_category_name_edit':
        return '13-5';
      default:
        return '13';
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'w_nakla_editing':
        return 'تعديل النقلة (dw_nakla_editing)';
      case 'w_fatora_editing':
        return 'تعديل الفاتورة (dw_fatora_editing)';
      case 'w_tahseel_editing':
        return 'تعديل التحصيل (dw_tahseel_editing)';
      case 'w_branch_exps_editing':
        return 'تعديل المصروفات (dw_branch_exps_editing)';
      case 'w_names_editing':
      case 'w_customer_name_edit':
      case 'w_sup_name_edit':
      case 'w_farm_name_edit':
      case 'w_category_name_edit':
        return 'تعديل المسميات الشامل وقاعدة البيانات (dw_names_editing)';
      default:
        return 'التعديلات';
    }
  };

  const getCurrentActiveDWCode = () => {
    switch (activeTab) {
      case 'w_nakla_editing':
        return 'dw_nakla_editing';
      case 'w_fatora_editing':
        return 'dw_fatora_editing';
      case 'w_tahseel_editing':
        return 'dw_tahseel_editing';
      case 'w_branch_exps_editing':
        return 'dw_branch_exps_editing';
      case 'w_names_editing':
      case 'w_customer_name_edit':
      case 'w_sup_name_edit':
      case 'w_farm_name_edit':
      case 'w_category_name_edit':
        return 'dw_names_cascade_editing';
      default:
        return 'dw_editing';
    }
  };

  const getCurrentRecordsCount = () => {
    switch (activeTab) {
      case 'w_nakla_editing':
        return filteredNaklat.length;
      case 'w_fatora_editing':
        return filteredFwateer.length;
      case 'w_tahseel_editing':
        return filteredTahseel.length;
      case 'w_branch_exps_editing':
        return filteredExps.length;
      default:
        return 0;
    }
  };

  const getCurrentSelectedRowIdx = () => {
    switch (activeTab) {
      case 'w_nakla_editing':
        return selectedNaklaIdx + 1;
      case 'w_fatora_editing':
        return selectedFatoraIdx + 1;
      case 'w_tahseel_editing':
        return selectedTahseelIdx + 1;
      case 'w_branch_exps_editing':
        return selectedExpIdx + 1;
      default:
        return 0;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-3 select-none" dir="rtl">
      {/* إطار نافذة الباور بيلدر MDI Child Window المطابق تماماً لشاشة الزبائن ومستلزمات التعبئة */}
      <div className="w-[1060px] max-w-full bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-2xl flex flex-col font-sans text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar): أزرار التحكم على اليمين والعنوان على اليسار */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* أزرار التحكم في النافذة على اليمين (إغلاق، تكبير، تصغير) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onClose}
              title="إغلاق"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-rose-500 hover:text-white active:border-t-[#808080] active:border-l-[#808080]"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </button>
            <button
              title="تكبير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              title="تصغير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8] active:border-t-[#808080] active:border-l-[#808080]"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          {/* أيقونة باور بيلدر الدائرية واسم النافذة على اليسار */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">{getTabTitle()}</span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1 py-0.2 rounded text-[10px] border border-amber-500">
              {getTabBadge()}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* 2. جسم النافذة: أزرار التحكم العمودية على اليمين وجروب بوكس البيانات على اليسار */}
        <div className="p-3 bg-[#d4d0c8] flex items-start gap-3">
          
          {/* الأزرار العمودية الخارجية على اليمين المطابقة تماماً لشاشة الزبائن ومستلزمات التعبئة */}
          <div className="flex flex-col gap-2 pt-1 shrink-0 select-none">
            {/* زر إضافة (+) */}
            <button
              onClick={handleCurrentAdd}
              title="إضافة سطر / حركة جديدة (+)"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              +
            </button>

            {/* زر حذف (-) */}
            <button
              onClick={handleCurrentDelete}
              title="حذف السجل المحدد (-)"
              className="w-14 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] active:bg-[#f4a8a8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              -
            </button>

            {/* زر حفظ الأخضر الفاتح */}
            <button
              onClick={handleCurrentSave}
              title="حفظ التعديلات في قاعدة البيانات"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-[13px] font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              حفظ
            </button>

            {/* زر الطباعة المخصص بأيقونة الطابعة */}
            <button
              onClick={handleCurrentPrint}
              title="طباعة تقرير أو مستند السجل المحدد"
              className="w-14 h-11 bg-white hover:bg-slate-50 active:bg-slate-200 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 mt-1 active:border-t-[#404040] active:border-l-[#404040]"
            >
              <Printer className="w-6 h-6 text-slate-800" />
              <span className="text-[7.5px] font-bold text-slate-700 mt-0.5">طباعة</span>
            </button>

            {/* زر خروج */}
            {onClose && (
              <button
                onClick={onClose}
                title="إغلاق النافذة"
                className="w-14 h-8 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#b8b4ac] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow mt-2 active:border-t-[#404040] active:border-l-[#404040]"
              >
                خروج
              </button>
            )}

            {/* مؤشر حالة الحفظ السريع */}
            {feedbackMsg && (
              <div
                className={`mt-2 p-1 text-[10px] text-center rounded border font-bold ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                    : feedbackMsg.type === 'error'
                    ? 'bg-rose-100 text-rose-800 border-rose-400'
                    : 'bg-blue-100 text-blue-800 border-blue-400'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}
          </div>

          {/* Groupbox: شاشة التعديلات المحيطة بجدول DataWindow على يسار الأزرار */}
          <div className="flex-1 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 relative pt-4 bg-[#d4d0c8] flex flex-col gap-2">
            <span className="absolute -top-2.5 right-4 bg-[#d4d0c8] px-2 text-[12px] font-bold text-slate-800">
              {getTabTitle()}
            </span>

            {/* أزرار التبديل الكلاسيكية بين نماذج التعديل الأربعة (13-1 إلى 13-4) */}
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-300 flex-wrap">
              <button
                onClick={() => { setActiveTab('w_nakla_editing'); setSelectedNaklaIdx(0); }}
                className={`px-3 py-1 font-bold text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                  activeTab === 'w_nakla_editing'
                    ? 'bg-[#0a246a] text-white border-[#0a246a]'
                    : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>13-1: تعديل النقلة</span>
              </button>

              <button
                onClick={() => { setActiveTab('w_fatora_editing'); setSelectedFatoraIdx(0); }}
                className={`px-3 py-1 font-bold text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                  activeTab === 'w_fatora_editing'
                    ? 'bg-[#0a246a] text-white border-[#0a246a]'
                    : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>13-2: تعديل الفاتورة</span>
              </button>

              <button
                onClick={() => { setActiveTab('w_tahseel_editing'); setSelectedTahseelIdx(0); }}
                className={`px-3 py-1 font-bold text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                  activeTab === 'w_tahseel_editing'
                    ? 'bg-[#0a246a] text-white border-[#0a246a]'
                    : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>13-3: تعديل التحصيل</span>
              </button>

              <button
                onClick={() => { setActiveTab('w_branch_exps_editing'); setSelectedExpIdx(0); }}
                className={`px-3 py-1 font-bold text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                  activeTab === 'w_branch_exps_editing'
                    ? 'bg-[#0a246a] text-white border-[#0a246a]'
                    : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>13-4: تعديل المصروفات</span>
              </button>

              <button
                onClick={() => { setActiveTab('w_names_editing'); }}
                className={`px-3 py-1 font-bold text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                  activeTab === 'w_names_editing' || activeTab === 'w_customer_name_edit' || activeTab === 'w_sup_name_edit' || activeTab === 'w_farm_name_edit' || activeTab === 'w_category_name_edit'
                    ? 'bg-[#0a246a] text-white border-[#0a246a]'
                    : 'bg-slate-200 text-slate-800 border-t-white border-l-white border-b-slate-700 border-r-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>13-5: تعديل المسميات وقاعدة البيانات</span>
              </button>

              {/* شريط البحث والتصفية السريع */}
              <div className="mr-auto flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white border border-slate-400 px-1.5 py-0.5 rounded-xs">
                  <Search className="w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="بحث سريع..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="outline-hidden text-[11px] w-28 bg-transparent"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-[10px]">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-700 font-bold">التاريخ:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="border border-slate-400 px-1 py-0.5 bg-white text-[11px]"
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter('')} className="text-slate-500 text-[10px]">إلغاء</button>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 13-1: جدول تعديل النقلة (dw_nakla_editing)                */}
            {/* ========================================================= */}
            {activeTab === 'w_nakla_editing' && (
              <div className="flex flex-col gap-2">
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                      <thead>
                        <tr className="bg-[#bfd0e0] text-slate-900 border-b border-[#8090a0] font-bold sticky top-0 z-10">
                          <th className="border-l border-[#8090a0] px-1 py-1 text-center w-10">م</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">رقم النقلة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">التاريخ</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-44">اسم النقلة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-32">المورد</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-28">المزرعة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-28">السائق</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">اللوحة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">العمولة %</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">الوزن</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-14">العدد</th>
                          <th className="px-2 py-1 text-center w-16">حالة الصرف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNaklat.map((n, idx) => {
                          const isSelected = selectedNaklaIdx === idx;
                          return (
                            <tr
                              key={n.nakla_id}
                              onClick={() => setSelectedNaklaIdx(idx)}
                              className={`cursor-pointer transition-colors border-b border-slate-200 ${
                                isSelected
                                  ? 'bg-[#0a246a] text-white font-bold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-800 hover:bg-slate-100'
                                  : 'bg-[#f4f7f9] text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-1 py-1 text-center">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{n.nakla_number}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{n.nakla_date}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{n.nakla_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{n.sup_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{n.farm_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{n.driver_name || '-'}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center">{n.truck_plate || '-'}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{((n.comission || 0.07) * 100).toFixed(0)}%</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{n.nakla_weight || 0}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{n.sobata_number || 0}</td>
                              <td className="px-2 py-1 text-center">
                                {n.nakla_sarf ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">مصروفة</span>
                                ) : (
                                  <span className="text-amber-700 bg-amber-50 px-1 rounded">غير مصروفة</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredNaklat.length === 0 && (
                          <tr>
                            <td colSpan={12} className="py-8 text-center text-slate-500 font-bold">
                              لا توجد نقلات مطابقة لشروط البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* لوحة تعديل الحقول السريعة للنقلة المحددة (DataWindow Detail Section) */}
                {selectedNakla && (
                  <div className="bg-[#e4e3df] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-2.5 rounded-xs grid grid-cols-4 gap-2 text-slate-800">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">اسم النقلة:</label>
                      <input
                        type="text"
                        value={selectedNakla.nakla_name}
                        onChange={e => handleUpdateCurrentNakla('nakla_name', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-bold"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">المورد:</label>
                      <select
                        value={selectedNakla.sup_name}
                        onChange={e => handleUpdateCurrentNakla('sup_name', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-bold"
                      >
                        {dbState.suppliers.map(s => (
                          <option key={s.sup_id} value={s.sup_name}>{s.sup_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">المزرعة:</label>
                      <input
                        type="text"
                        value={selectedNakla.farm_name}
                        onChange={e => handleUpdateCurrentNakla('farm_name', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">التاريخ:</label>
                      <input
                        type="date"
                        value={selectedNakla.nakla_date}
                        onChange={e => handleUpdateCurrentNakla('nakla_date', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">اسم السائق:</label>
                      <input
                        type="text"
                        value={selectedNakla.driver_name || ''}
                        onChange={e => handleUpdateCurrentNakla('driver_name', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">رقم اللوحة:</label>
                      <input
                        type="text"
                        value={selectedNakla.truck_plate || ''}
                        onChange={e => handleUpdateCurrentNakla('truck_plate', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs text-center"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">نسبة العمولة (0.07 = 7%):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedNakla.comission || 0.07}
                        onChange={e => handleUpdateCurrentNakla('comission', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono text-center font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                        <input
                          type="checkbox"
                          checked={selectedNakla.nakla_sarf}
                          onChange={e => handleUpdateCurrentNakla('nakla_sarf', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span>تمت التصفية والصرف</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 13-2: جدول تعديل الفاتورة (dw_fatora_editing)              */}
            {/* ========================================================= */}
            {activeTab === 'w_fatora_editing' && (
              <div className="flex flex-col gap-2">
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                      <thead>
                        <tr className="bg-[#bfd0e0] text-slate-900 border-b border-[#8090a0] font-bold sticky top-0 z-10">
                          <th className="border-l border-[#8090a0] px-1 py-1 text-center w-12">رقم الفاتورة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">التاريخ</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-36">الزبون</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">الدفع</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-32">النقلة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-28">الصنف</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-14">العبوات</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">قائم كجم</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-14">سماح</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">صافي كجم</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-14">السعر</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">البضاعة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-12">بياعة</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-12">الرهن</th>
                          <th className="px-2 py-1 text-center w-20 font-bold bg-[#afc4d8]">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFwateer.map((f, idx) => {
                          const isSelected = selectedFatoraIdx === idx;
                          return (
                            <tr
                              key={`fatora_${f.id}_${idx}`}
                              onClick={() => setSelectedFatoraIdx(idx)}
                              className={`cursor-pointer transition-colors border-b border-slate-200 ${
                                isSelected
                                  ? 'bg-[#0a246a] text-white font-bold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-800 hover:bg-slate-100'
                                  : 'bg-[#f4f7f9] text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{f.id}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.trans_date}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{f.customer_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center">
                                {f.cash ? (
                                  <span className="text-emerald-700 font-bold">نقدي</span>
                                ) : (
                                  <span className="text-amber-800 font-bold">آجل (شكك)</span>
                                )}
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1">{f.nakla_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1">{f.cat_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.sobata_num}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.t_weight}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.samah_weight}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold">{f.net_weight}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.price}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.totally?.toLocaleString()}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.byaaa}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{f.t_rahn || 0}</td>
                              <td className="px-2 py-1 text-center font-mono font-bold text-emerald-800 bg-[#e4eef6]">
                                {f.tota?.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredFwateer.length === 0 && (
                          <tr>
                            <td colSpan={15} className="py-8 text-center text-slate-500 font-bold">
                              لا توجد فواتير مطابقة لشروط البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* لوحة التعديل التفاعلية للفاتورة المحددة */}
                {selectedFatora && (
                  <div className="bg-[#e4e3df] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-2.5 rounded-xs grid grid-cols-6 gap-2 text-slate-800">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">اسم الزبون:</label>
                      <select
                        value={selectedFatora.customer_name}
                        onChange={e => {
                          const cust = dbState.customers.find(c => c.customer_name === e.target.value);
                          handleUpdateCurrentFatora('customer_name', e.target.value);
                          if (cust) handleUpdateCurrentFatora('customer_code', cust.customer_code);
                        }}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs font-bold"
                      >
                        {dbState.customers.map(c => (
                          <option key={c.customer_id} value={c.customer_name}>{c.customer_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">طريقة الدفع:</label>
                      <select
                        value={selectedFatora.cash ? 'cash' : 'credit'}
                        onChange={e => handleUpdateCurrentFatora('cash', e.target.value === 'cash')}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs font-bold"
                      >
                        <option value="cash">نقدي (كاش)</option>
                        <option value="credit">آجل (شكك)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">الصنف:</label>
                      <input
                        type="text"
                        value={selectedFatora.cat_name}
                        onChange={e => handleUpdateCurrentFatora('cat_name', e.target.value)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">العبوات / الأقفاص:</label>
                      <input
                        type="number"
                        value={selectedFatora.sobata_num}
                        onChange={e => handleUpdateCurrentFatora('sobata_num', parseInt(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">الوزن القائم (كجم):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedFatora.t_weight}
                        onChange={e => handleUpdateCurrentFatora('t_weight', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">وزن السماح (كجم):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedFatora.samah_weight}
                        onChange={e => handleUpdateCurrentFatora('samah_weight', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">السعر للكيلو:</label>
                      <input
                        type="number"
                        step="0.25"
                        value={selectedFatora.price}
                        onChange={e => handleUpdateCurrentFatora('price', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-mono font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">البياعة:</label>
                      <input
                        type="number"
                        value={selectedFatora.byaaa}
                        onChange={e => handleUpdateCurrentFatora('byaaa', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">الرهن للعبوة:</label>
                      <input
                        type="number"
                        value={selectedFatora.rahn}
                        onChange={e => handleUpdateCurrentFatora('rahn', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-1 py-1 text-xs text-center font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-3 bg-[#d5e0e8] p-1.5 border border-slate-400 rounded-xs flex-row items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-700 block">صافي الوزن: <b className="font-mono text-xs">{selectedFatora.net_weight} كجم</b></span>
                        <span className="text-[10px] text-slate-700 block">قيمة البضاعة: <b className="font-mono text-xs">{selectedFatora.totally?.toLocaleString()} ج</b></span>
                      </div>
                      <div className="text-left pl-2">
                        <span className="text-[10px] text-slate-700 block">إجمالي الفاتورة النهائي:</span>
                        <span className="text-sm font-bold font-mono text-emerald-800">{selectedFatora.tota?.toLocaleString()} جنيه</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 13-3: جدول تعديل التحصيل (dw_tahseel_editing)              */}
            {/* ========================================================= */}
            {activeTab === 'w_tahseel_editing' && (
              <div className="flex flex-col gap-2">
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                      <thead>
                        <tr className="bg-[#bfd0e0] text-slate-900 border-b border-[#8090a0] font-bold sticky top-0 z-10">
                          <th className="border-l border-[#8090a0] px-1 py-1 text-center w-12">رقم السند</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">التاريخ</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-44">اسم الزبون</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">كود العميل</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-24">المبلغ المحصل</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">سماح / خصم</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">طريقة السداد</th>
                          <th className="px-2 py-1 text-right w-48">البيان / ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTahseel.map((t, idx) => {
                          const isSelected = selectedTahseelIdx === idx;
                          return (
                            <tr
                              key={`tahseel_${t.id}_${idx}`}
                              onClick={() => setSelectedTahseelIdx(idx)}
                              className={`cursor-pointer transition-colors border-b border-slate-200 ${
                                isSelected
                                  ? 'bg-[#0a246a] text-white font-bold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-800 hover:bg-slate-100'
                                  : 'bg-[#f4f7f9] text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{t.id}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{t.trans_date}</td>
                              <td className="border-l border-slate-300 px-2 py-1 font-bold">{t.customer_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{t.customer_code}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-emerald-700">
                                {t.amount?.toLocaleString()} ج
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{t.samah || 0}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center">
                                {t.payment_type === 'cash' ? 'نقدي' : t.payment_type === 'cheque' ? 'شيك' : 'تحويل'}
                              </td>
                              <td className="px-2 py-1 text-slate-600">{t.notes || '-'}</td>
                            </tr>
                          );
                        })}
                        {filteredTahseel.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500 font-bold">
                              لا توجد سندات تحصيل مطابقة لشروط البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* لوحة تعديل سند التحصيل المحدد */}
                {selectedTahseel && (
                  <div className="bg-[#e4e3df] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-2.5 rounded-xs grid grid-cols-4 gap-2 text-slate-800">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">اسم العميل:</label>
                      <select
                        value={selectedTahseel.customer_name}
                        onChange={e => {
                          const cust = dbState.customers.find(c => c.customer_name === e.target.value);
                          handleUpdateCurrentTahseel('customer_name', e.target.value);
                          if (cust) handleUpdateCurrentTahseel('customer_code', cust.customer_code);
                        }}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-bold"
                      >
                        {dbState.customers.map(c => (
                          <option key={c.customer_id} value={c.customer_name}>{c.customer_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">المبلغ المحصل (جنيه):</label>
                      <input
                        type="number"
                        value={selectedTahseel.amount}
                        onChange={e => handleUpdateCurrentTahseel('amount', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono font-bold text-emerald-800"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">خصم سماح (جنيه):</label>
                      <input
                        type="number"
                        value={selectedTahseel.samah || 0}
                        onChange={e => handleUpdateCurrentTahseel('samah', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono text-amber-800"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">تاريخ السند:</label>
                      <input
                        type="date"
                        value={selectedTahseel.trans_date}
                        onChange={e => handleUpdateCurrentTahseel('trans_date', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">طريقة السداد:</label>
                      <select
                        value={selectedTahseel.payment_type}
                        onChange={e => handleUpdateCurrentTahseel('payment_type', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-bold"
                      >
                        <option value="cash">نقدي (خزينة)</option>
                        <option value="cheque">شيك بنكي</option>
                        <option value="transfer">تحويل حساب</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-3">
                      <label className="text-[10px] font-bold text-slate-700">ملاحظات وبيان السند:</label>
                      <input
                        type="text"
                        value={selectedTahseel.notes || ''}
                        onChange={e => handleUpdateCurrentTahseel('notes', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 13-4: جدول تعديل المصروفات (dw_branch_exps_editing)        */}
            {/* ========================================================= */}
            {activeTab === 'w_branch_exps_editing' && (
              <div className="flex flex-col gap-2">
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                      <thead>
                        <tr className="bg-[#bfd0e0] text-slate-900 border-b border-[#8090a0] font-bold sticky top-0 z-10">
                          <th className="border-l border-[#8090a0] px-1 py-1 text-center w-12">م</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-20">التاريخ</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-right w-48">بند المصروف</th>
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-24">المبلغ (جنيه)</th>
                          <th className="px-2 py-1 text-right w-64">البيان والملاحظات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExps.map((e, idx) => {
                          const isSelected = selectedExpIdx === idx;
                          return (
                            <tr
                              key={`exp_${e.id}_${idx}`}
                              onClick={() => setSelectedExpIdx(idx)}
                              className={`cursor-pointer transition-colors border-b border-slate-200 ${
                                isSelected
                                  ? 'bg-[#0a246a] text-white font-bold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-800 hover:bg-slate-100'
                                  : 'bg-[#f4f7f9] text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{e.date}</td>
                              <td className="border-l border-slate-300 px-2 py-1 font-bold">{e.exp_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-rose-700">
                                {e.exp_amount?.toLocaleString()} ج
                              </td>
                              <td className="px-2 py-1 text-slate-600">{e.notes || '-'}</td>
                            </tr>
                          );
                        })}
                        {filteredExps.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500 font-bold">
                              لا توجد مصروفات مطابقة لشروط البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* لوحة تعديل المصروف المحدد */}
                {selectedExp && (
                  <div className="bg-[#e4e3df] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-2.5 rounded-xs grid grid-cols-4 gap-2 text-slate-800">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">بند المصروف:</label>
                      <select
                        value={selectedExp.exp_name}
                        onChange={e => handleUpdateCurrentExp('exp_name', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-bold"
                      >
                        {dbState.expenses.map(exp => (
                          <option key={exp.exp_id} value={exp.exp_name}>{exp.exp_name}</option>
                        ))}
                        <option value="أخرى">بند آخر مخصص</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">المبلغ المنصرف (جنيه):</label>
                      <input
                        type="number"
                        value={selectedExp.exp_amount}
                        onChange={e => handleUpdateCurrentExp('exp_amount', parseFloat(e.target.value) || 0)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono font-bold text-rose-800"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">تاريخ الصرف:</label>
                      <input
                        type="date"
                        value={selectedExp.date}
                        onChange={e => handleUpdateCurrentExp('date', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-bold text-slate-700">البيان والملاحظات:</label>
                      <input
                        type="text"
                        value={selectedExp.notes || ''}
                        onChange={e => handleUpdateCurrentExp('notes', e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 13-5: تعديل المسميات الشامل وقاعدة البيانات (dw_names_editing) */}
            {/* ========================================================= */}
            {(activeTab === 'w_names_editing' ||
              activeTab === 'w_customer_name_edit' ||
              activeTab === 'w_sup_name_edit' ||
              activeTab === 'w_farm_name_edit' ||
              activeTab === 'w_category_name_edit') && (
              <div className="flex flex-col gap-3">
                {/* 1. أزرار اختيار نوع السجل المراد تعديله */}
                <div className="flex items-center gap-2 bg-[#cfd3db] p-1.5 border border-[#808080] shadow-inner">
                  <span className="text-xs font-bold text-slate-800 ml-1">نوع السجل المراد تعديل اسمه:</span>
                  <button
                    type="button"
                    onClick={() => { setNameEditType('customer'); setSelectedEntityName(''); setNewEntityName(''); }}
                    className={`px-3 py-1 text-xs font-bold border ${
                      nameEditType === 'customer'
                        ? 'bg-[#0a246a] text-white border-[#0a246a]'
                        : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    الزبائن ({dbState.customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNameEditType('supplier'); setSelectedEntityName(''); setNewEntityName(''); }}
                    className={`px-3 py-1 text-xs font-bold border ${
                      nameEditType === 'supplier'
                        ? 'bg-[#0a246a] text-white border-[#0a246a]'
                        : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    الموردون ({dbState.suppliers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNameEditType('farm'); setSelectedEntityName(''); setNewEntityName(''); }}
                    className={`px-3 py-1 text-xs font-bold border ${
                      nameEditType === 'farm'
                        ? 'bg-[#0a246a] text-white border-[#0a246a]'
                        : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    المزارع ({dbState.farms.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNameEditType('category'); setSelectedEntityName(''); setNewEntityName(''); }}
                    className={`px-3 py-1 text-xs font-bold border ${
                      nameEditType === 'category'
                        ? 'bg-[#0a246a] text-white border-[#0a246a]'
                        : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    الأصناف ({dbState.categories.length})
                  </button>
                </div>

                {/* 2. جدول اختيار السجل الحالي */}
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[180px] overflow-y-auto">
                    <table className="w-full border-collapse text-[11px] font-sans text-right select-text">
                      <thead>
                        <tr className="bg-[#bfd0e0] text-slate-900 border-b border-[#8090a0] font-bold sticky top-0 z-10">
                          <th className="border-l border-[#8090a0] px-2 py-1 text-center w-16">الكود</th>
                          <th className="border-l border-[#8090a0] px-3 py-1 text-right">الاسم الحالي</th>
                          {nameEditType === 'farm' && (
                            <th className="border-l border-[#8090a0] px-3 py-1 text-right">المورد التابع له</th>
                          )}
                          <th className="border-l border-[#8090a0] px-3 py-1 text-center w-28">الحركات المرتبطة</th>
                          <th className="px-3 py-1 text-center w-24">اختيار للتعديل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nameEditType === 'customer' && dbState.customers.map((c, idx) => {
                          const isSel = selectedEntityName === c.customer_name;
                          const fCount = dbState.fatora_f.filter(f => f.customer_name === c.customer_name).length;
                          const zCount = dbState.zemam.filter(z => z.customer_name === c.customer_name).length;
                          const tCount = dbState.tahseelat.filter(t => t.customer_name === c.customer_name).length;
                          return (
                            <tr
                              key={`cust_${c.customer_id}_${idx}`}
                              onClick={() => { setSelectedEntityName(c.customer_name); setNewEntityName(''); }}
                              className={`border-b border-slate-200 cursor-pointer h-6 ${
                                isSel ? 'bg-amber-100 font-bold' : idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                              } hover:bg-blue-50`}
                            >
                              <td className="border-l border-slate-200 px-2 py-0.5 text-center font-mono">{c.customer_code}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-right font-bold text-slate-900">{c.customer_name}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-center text-[10px] text-slate-600">
                                {fCount} فواتير | {zCount} ذمم | {tCount} تحصيل
                              </td>
                              <td className="px-3 py-0.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSel ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  {isSel ? '✓ محدد' : 'تحديد'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {nameEditType === 'supplier' && dbState.suppliers.map((s, idx) => {
                          const isSel = selectedEntityName === s.sup_name;
                          const nCount = dbState.naklat.filter(n => n.sup_name === s.sup_name).length;
                          const fCount = dbState.farms.filter(f => f.sup_name === s.sup_name).length;
                          return (
                            <tr
                              key={`sup_${s.sup_id}_${idx}`}
                              onClick={() => { setSelectedEntityName(s.sup_name); setNewEntityName(''); }}
                              className={`border-b border-slate-200 cursor-pointer h-6 ${
                                isSel ? 'bg-amber-100 font-bold' : idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                              } hover:bg-blue-50`}
                            >
                              <td className="border-l border-slate-200 px-2 py-0.5 text-center font-mono">{s.sup_id}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-right font-bold text-slate-900">{s.sup_name}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-center text-[10px] text-slate-600">
                                {nCount} نقلات | {fCount} مزارع
                              </td>
                              <td className="px-3 py-0.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSel ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  {isSel ? '✓ محدد' : 'تحديد'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {nameEditType === 'farm' && dbState.farms.map((f, idx) => {
                          const isSel = selectedEntityName === f.farm_name;
                          const nCount = dbState.naklat.filter(n => n.farm_name === f.farm_name).length;
                          return (
                            <tr
                              key={`farm_${f.farm_id}_${idx}`}
                              onClick={() => { setSelectedEntityName(f.farm_name); setNewEntityName(''); }}
                              className={`border-b border-slate-200 cursor-pointer h-6 ${
                                isSel ? 'bg-amber-100 font-bold' : idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                              } hover:bg-blue-50`}
                            >
                              <td className="border-l border-slate-200 px-2 py-0.5 text-center font-mono">{f.farm_id}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-right font-bold text-slate-900">{f.farm_name}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-right font-bold text-blue-900">{f.sup_name}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-center text-[10px] text-slate-600">
                                {nCount} نقلات مسجلة
                              </td>
                              <td className="px-3 py-0.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSel ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  {isSel ? '✓ محدد' : 'تحديد'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {nameEditType === 'category' && dbState.categories.map((c, idx) => {
                          const isSel = selectedEntityName === c.cat_name;
                          const fCount = dbState.fatora_f.filter(f => f.cat_name === c.cat_name).length;
                          return (
                            <tr
                              key={`cat_${c.id}_${idx}`}
                              onClick={() => { setSelectedEntityName(c.cat_name); setNewEntityName(''); }}
                              className={`border-b border-slate-200 cursor-pointer h-6 ${
                                isSel ? 'bg-amber-100 font-bold' : idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                              } hover:bg-blue-50`}
                            >
                              <td className="border-l border-slate-200 px-2 py-0.5 text-center font-mono">{c.cat_code}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-right font-bold text-slate-900">{c.cat_name}</td>
                              <td className="border-l border-slate-200 px-3 py-0.5 text-center text-[10px] text-slate-600">
                                {fCount} فواتير بيع
                              </td>
                              <td className="px-3 py-0.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSel ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  {isSel ? '✓ محدد' : 'تحديد'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. صندوق تعديل وتطبيق الاسم الجديد مع التحديث الشامل لقاعدة البيانات */}
                <div className="bg-[#f0ece4] border border-[#808080] p-3 shadow-inner flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-800">الاسم القديم الحالي المسجل:</label>
                      <input
                        type="text"
                        readOnly
                        value={selectedEntityName || '<< يرجى تحديد سجل من الجدول أعلاه >>'}
                        className="bg-slate-200 border border-slate-400 px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-default"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-blue-900">الاسم الجديد المراد اعتماده وتحديثه في كامل الجداول:</label>
                      <input
                        type="text"
                        value={newEntityName}
                        onChange={e => setNewEntityName(e.target.value)}
                        placeholder="اكتب الاسم الجديد بدقة..."
                        className="bg-white border-2 border-blue-500 px-2.5 py-1.5 text-xs font-bold text-blue-950 focus:bg-yellow-50 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-300">
                    <div className="text-[11px] text-amber-900 bg-amber-100 border border-amber-300 px-2 py-1 rounded">
                      ⚠️ <b>رقابة محاسبية صارمة:</b> التعديل هنا يُحدّث الاسم آلياً في جميع الفواتير، النقلات، الذمم، وسندات التحصيل في قاعدة البيانات فوراً لمنع التهرب وتغيير الأسماء.
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveNameCascade}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow flex items-center gap-1.5 active:bg-emerald-900"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>تطبيق التعديل وتحديث كامل قاعدة البيانات</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. شريط الحالة السفلي (Status Bar) الكلاسيكي للباور بيلدر */}
        <div className="bg-[#d4d0c8] border-t border-[#808080] px-2 py-1 flex items-center justify-between text-[11px] text-slate-700 select-none">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-slate-900 bg-slate-300 px-1.5 py-0.5 rounded border border-slate-400">
              {getCurrentActiveDWCode()}
            </span>
            <span>
              إجمالي السجلات: <b>{getCurrentRecordsCount()}</b>
            </span>
            <span>
              السجل النشط: <b>{getCurrentSelectedRowIdx()}</b>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
            <span className="text-slate-600">قاعدة البيانات: متصل (Read / Write)</span>
          </div>
        </div>
      </div>

      {/* مودال معاينة الطباعة (PowerBuilder DataWindow Print Preview Modal) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="w-[650px] max-w-full bg-white border-2 border-slate-700 shadow-2xl p-6 text-right flex flex-col gap-4">
            {/* ترويسة التقرير */}
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{dbState.company.branch}</h2>
                <p className="text-xs text-slate-600">محل 67 - سوق الجملة للخضار والفاكهة</p>
                <p className="text-xs text-slate-500 font-mono">هاتف: {dbState.company.tel}</p>
              </div>
              <div className="text-left font-mono text-xs text-slate-600">
                <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                <p>النافذة: {getCurrentActiveDWCode()}</p>
              </div>
            </div>

            <div className="text-center py-1 bg-slate-100 border border-slate-300">
              <h3 className="font-bold text-slate-800 text-sm">
                مستند بيان تعديل: {getTabTitle()}
              </h3>
            </div>

            {/* محتوى المعاينة حسب التبويب */}
            <div className="border border-slate-300 p-3 bg-slate-50 text-xs">
              {activeTab === 'w_nakla_editing' && selectedNakla && (
                <div className="grid grid-cols-2 gap-2">
                  <p><b>رقم النقلة:</b> {selectedNakla.nakla_number}</p>
                  <p><b>اسم النقلة:</b> {selectedNakla.nakla_name}</p>
                  <p><b>المورد:</b> {selectedNakla.sup_name}</p>
                  <p><b>المزرعة:</b> {selectedNakla.farm_name}</p>
                  <p><b>السائق:</b> {selectedNakla.driver_name || 'غير محدد'}</p>
                  <p><b>رقم السيارة:</b> {selectedNakla.truck_plate || 'غير محدد'}</p>
                  <p><b>العمولة:</b> {((selectedNakla.comission || 0.07) * 100).toFixed(0)}%</p>
                  <p><b>حالة الصرف:</b> {selectedNakla.nakla_sarf ? 'تم الصرف' : 'معلقة'}</p>
                </div>
              )}

              {activeTab === 'w_fatora_editing' && selectedFatora && (
                <div className="grid grid-cols-2 gap-2">
                  <p><b>رقم الفاتورة:</b> {selectedFatora.id}</p>
                  <p><b>الزبون:</b> {selectedFatora.customer_name}</p>
                  <p><b>النقلة:</b> {selectedFatora.nakla_name}</p>
                  <p><b>الصنف:</b> {selectedFatora.cat_name}</p>
                  <p><b>العدد:</b> {selectedFatora.sobata_num}</p>
                  <p><b>صافي الوزن:</b> {selectedFatora.net_weight} كجم</p>
                  <p><b>السعر:</b> {selectedFatora.price} ج</p>
                  <p className="font-bold text-emerald-800 text-sm"><b>الإجمالي:</b> {selectedFatora.tota?.toLocaleString()} ج</p>
                </div>
              )}

              {activeTab === 'w_tahseel_editing' && selectedTahseel && (
                <div className="grid grid-cols-2 gap-2">
                  <p><b>رقم السند:</b> {selectedTahseel.id}</p>
                  <p><b>اسم العميل:</b> {selectedTahseel.customer_name}</p>
                  <p><b>المبلغ المحصل:</b> {selectedTahseel.amount?.toLocaleString()} ج</p>
                  <p><b>السماح / الخصم:</b> {selectedTahseel.samah || 0} ج</p>
                  <p><b>طريقة السداد:</b> {selectedTahseel.payment_type}</p>
                  <p><b>التاريخ:</b> {selectedTahseel.trans_date}</p>
                  <p className="col-span-2"><b>ملاحظات:</b> {selectedTahseel.notes || '-'}</p>
                </div>
              )}

              {activeTab === 'w_branch_exps_editing' && selectedExp && (
                <div className="grid grid-cols-2 gap-2">
                  <p><b>رقم المصروف:</b> {selectedExp.id}</p>
                  <p><b>بند المصروف:</b> {selectedExp.exp_name}</p>
                  <p><b>المبلغ المنصرف:</b> {selectedExp.exp_amount?.toLocaleString()} ج</p>
                  <p><b>التاريخ:</b> {selectedExp.date}</p>
                  <p className="col-span-2"><b>البيان والملاحظات:</b> {selectedExp.notes || '-'}</p>
                </div>
              )}
            </div>

            {/* أزرار الإجراء بالمودال */}
            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1.5 text-xs shadow"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال للطابعة</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold rounded text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تأكيد الحذف بدون window.confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#cfd3db] border-2 border-t-white border-l-white border-b-black border-r-black p-4 w-full max-w-md shadow-2xl space-y-4 text-right">
            <div className="font-bold text-sm text-slate-900 border-b border-slate-400 pb-2 flex items-center gap-2">
              <span className="text-rose-600 text-lg">⚠️</span>
              <span>تأكيد الحذف</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 leading-relaxed">
              {deleteConfirm.message}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-400">
              <button
                type="button"
                onClick={deleteConfirm.onConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border border-rose-800 rounded shadow"
              >
                نعم، تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold text-xs border border-slate-500 rounded"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
