import React, { useState, useEffect, useMemo } from 'react';
import { wholesaleStore } from '../services/storage';
import {
  PackageShop,
  PackageExpenseItem,
  PackageShopWithdrawal,
  PackageDisbursement,
  PackageDisbursementItem,
  Supplier,
  Farm
} from '../types/schema';
import { normalizeArabic } from '../utils/arabic';
import { Printer, Minus, Square, X, Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

export type PackagingWindowMode =
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
  | 'w_rep_all_sups_packaging_not_deducted';

interface PackagingManagementWindowProps {
  mode?: PackagingWindowMode;
  onClose?: () => void;
}

export const PackagingManagementWindow: React.FC<PackagingManagementWindowProps> = ({
  mode = 'w_package_sups',
  onClose
}) => {
  const db = wholesaleStore.getState();
  const [activeMode, setActiveMode] = useState<PackagingWindowMode>(mode);

  // تحديث النمط إذا تغير من الـ props
  useEffect(() => {
    if (mode) setActiveMode(mode);
  }, [mode]);

  const today = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------
  // 1. شاشة تسجيل محلات الكراتين (6-1: w_package_sups)
  // حقولها حصراً: الكود، الاسم، العنوان، رقم الهاتف
  // شاشة استعراض (الاسم للقراءة فقط) وزر (+) يفتح داتا ويندو الإضافة
  // -------------------------------------------------------------
  const [shops, setShops] = useState<PackageShop[]>(
    db.package_shops && db.package_shops.length > 0 ? db.package_shops : []
  );
  const [isAddingShops, setIsAddingShops] = useState<boolean>(false);
  const [newShopsRows, setNewShopsRows] = useState<PackageShop[]>([]);
  const [selectedShopIdx, setSelectedShopIdx] = useState<number>(0);

  // -------------------------------------------------------------
  // 2. شاشة تسجيل مستلزمات التعبئة (6-2: w_package_exp_name)
  // حقولها حصراً: كود الصنف، اسم مستلزم التعبئة فقط
  // شاشة استعراض (الاسم للقراءة فقط) وزر (+) يفتح داتا ويندو الإضافة
  // -------------------------------------------------------------
  const [expItems, setExpItems] = useState<PackageExpenseItem[]>(
    db.package_exp_items && db.package_exp_items.length > 0 ? db.package_exp_items : []
  );
  const [isAddingExpItems, setIsAddingExpItems] = useState<boolean>(false);
  const [newExpItemRows, setNewExpItemRows] = useState<PackageExpenseItem[]>([]);
  const [selectedExpItemIdx, setSelectedExpItemIdx] = useState<number>(0);

  // -------------------------------------------------------------
  // 3. شاشة مسحوبات محلات الكراتين (6-3: w_package_sup_sahb)
  // حقولها: المبالغ التي يتم سحبها، اسم محل الكراتين، التاريخ
  // -------------------------------------------------------------
  const [withdrawals, setWithdrawals] = useState<PackageShopWithdrawal[]>(
    db.package_withdrawals && db.package_withdrawals.length > 0 ? db.package_withdrawals : []
  );
  const [selectedWithdrawalIdx, setSelectedWithdrawalIdx] = useState<number>(0);

  // -------------------------------------------------------------
  // 4. شاشة صرف كراتين لمورد (6-4: w_kratin_sup_sahb2)
  // تشمل: المورد، المزرعة، النقلة المراد الخصم عليها أو على الحساب،
  // وجدول صغير يوضح المستلزمات، عددها، سعرها، وربطها بالفاتورة
  // -------------------------------------------------------------
  const [disbursements, setDisbursements] = useState<PackageDisbursement[]>(
    db.package_disbursements && db.package_disbursements.length > 0 ? db.package_disbursements : []
  );
  const [selectedDisbIdx, setSelectedDisbIdx] = useState<number>(0);

  // نموذج إضافة إذن صرف كراتين جديد لمورد
  const [newDisbForm, setNewDisbForm] = useState<{
    trans_date: string;
    sup_name: string;
    farm_name: string;
    shop_name: string;
    link_type: 'nakla' | 'account';
    nakla_name: string;
    notes: string;
    items: PackageDisbursementItem[];
  }>({
    trans_date: today,
    sup_name: db.suppliers[0]?.sup_name || 'الحاج فتحي الشبراوي',
    farm_name: db.farms[0]?.farm_name || 'مزرعة وادي النطرون ك 84',
    shop_name: db.package_shops[0]?.shop_name || 'مصنع الأهرام للبلاستيك والكرتون',
    link_type: 'nakla',
    nakla_name: db.naklat[0]?.nakla_name || '',
    notes: 'إذن صرف مستلزمات تعبئة وكراتين للنقلة',
    items: [
      {
        id: 1,
        item_name: db.package_exp_items[0]?.item_name || 'برنيكة بلاستيك مقوى',
        shop_name: db.package_shops[0]?.shop_name || 'مصنع الأهرام للبلاستيك والكرتون',
        qty: 100,
        unit_price: 35.0,
        total_amount: 3500
      }
    ]
  });

  // -------------------------------------------------------------
  // 5. فلاتر التقارير (6-5 إلى 6-11)
  // -------------------------------------------------------------
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [selectedReportShop, setSelectedReportShop] = useState<string>('all');
  const [selectedReportSup, setSelectedReportSup] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string>('جاهز (Ready)');

  // عنوان وكود الشاشة النشطة
  const getWindowInfo = () => {
    switch (activeMode) {
      case 'w_package_sups':
        return {
          title: isAddingShops ? 'تسجيل محلات الكراتين (إضافة جديدة)' : 'تسجيل محلات الكراتين (استعراض)',
          code: '6-1',
          dw: isAddingShops ? 'dw_package_sups_add' : 'dw_package_sups'
        };
      case 'w_package_exp_name':
        return {
          title: isAddingExpItems ? 'تسجيل مستلزمات التعبئة (إضافة جديدة)' : 'تسجيل مستلزمات التعبئة (استعراض)',
          code: '6-2',
          dw: isAddingExpItems ? 'dw_package_exp_name_add' : 'dw_package_exp_name'
        };
      case 'w_package_sup_sahb':
        return { title: 'مسحوبات محلات الكراتين', code: '6-3', dw: 'dw_package_sup_sahb' };
      case 'w_kratin_sup_sahb2':
        return { title: 'صرف كراتين لمورد وربطها بالفاتورة', code: '6-4', dw: 'dw_kratin_sup_sahb2' };
      case 'w_rep_kratin_account':
        return { title: 'كشف حساب محلات كراتين', code: '6-5', dw: 'd_rep_kratin_account' };
      case 'w_rep_all_kratin_accounts':
        return { title: 'كشف حساب جميع محلات الكراتين', code: '6-6', dw: 'd_rep_all_kratin_accounts' };
      case 'w_rep_sup_packaging_total':
        return { title: 'تقرير مستلزمات التعبئة لمورد ----- اجمالي', code: '6-7', dw: 'd_rep_sup_packaging_total' };
      case 'w_rep_sup_packaging_detail':
        return { title: 'تقرير مستلزمات التعبئة لمورد ----- تفصيلي', code: '6-8', dw: 'd_rep_sup_packaging_detail' };
      case 'w_rep_company_packaging_status':
        return { title: 'وضع الشركة بالنسبة للموردين و محلات الكراتين', code: '6-9', dw: 'd_rep_company_packaging_status' };
      case 'w_rep_sup_packaging_not_deducted':
        return { title: 'تقرير مستلزمات التعبئة لمورد غير مخصوم على نقلة', code: '6-10', dw: 'd_rep_sup_pack_not_deducted' };
      case 'w_rep_all_sups_packaging_not_deducted':
        return { title: 'تقرير جميع الموردين مع جميع محلات الكراتين', code: '6-11', dw: 'd_rep_all_sups_all_shops' };
      default:
        return { title: 'مستلزمات التعبئة', code: '6-1', dw: 'dw_package_sups' };
    }
  };

  const windowInfo = getWindowInfo();

  // --- زر إضافة (+) المنفذ تماماً وفق تعليمات كود الباور بيلدر المرسل ---
  const handleAddButton = () => {
    if (activeMode === 'w_package_sups') {
      const maxCode = shops.reduce((max, s) => Math.max(max, s.shop_code || 0), 100);
      const nextId = (shops.reduce((max, s) => Math.max(max, s.shop_id || 0), 0) || 0) + 1;
      
      if (!isAddingShops) {
        // التحويل من داتا ويندو الاستعراض إلى داتا ويندو الإضافة dw_package_sups_add مع سطر أول
        setIsAddingShops(true);
        const firstRow: PackageShop = {
          shop_id: nextId,
          shop_code: maxCode + 1,
          shop_name: '',
          address: '',
          mobile: '',
          initial_balance: 0,
          current_balance: 0,
          notes: ''
        };
        setNewShopsRows([firstRow]);
        setSelectedShopIdx(0);
        setStatusMessage('تم فتح داتا ويندو إضافة محلات كراتين جديدة (dw_package_sups_add)');
      } else {
        // في داتا ويندو الإضافة: الضغط مرة أخرى يعني إضافة سطر ثانٍ أو ثالث
        const rowNum = newShopsRows.length + 1;
        const anotherRow: PackageShop = {
          shop_id: nextId + newShopsRows.length,
          shop_code: maxCode + rowNum,
          shop_name: '',
          address: '',
          mobile: '',
          initial_balance: 0,
          current_balance: 0,
          notes: ''
        };
        setNewShopsRows(prev => [...prev, anotherRow]);
        setSelectedShopIdx(newShopsRows.length);
        setStatusMessage(`تمت إضافة سطر جديد رقم ${rowNum} في داتا ويندو الإضافة`);
      }
    } else if (activeMode === 'w_package_exp_name') {
      const maxCode = expItems.reduce((max, i) => Math.max(max, i.item_code || 0), 0);
      const nextId = (expItems.reduce((max, i) => Math.max(max, i.item_id || 0), 0) || 0) + 1;

      if (!isAddingExpItems) {
        // التحويل إلى داتا ويندو الإضافة dw_package_exp_name_add
        setIsAddingExpItems(true);
        const firstRow: PackageExpenseItem = {
          item_id: nextId,
          item_code: maxCode + 1,
          item_name: ''
        };
        setNewExpItemRows([firstRow]);
        setSelectedExpItemIdx(0);
        setStatusMessage('تم فتح داتا ويندو إضافة مستلزمات تعبئة جديدة (dw_package_exp_name_add)');
      } else {
        const rowNum = newExpItemRows.length + 1;
        const anotherRow: PackageExpenseItem = {
          item_id: nextId + newExpItemRows.length,
          item_code: maxCode + rowNum,
          item_name: ''
        };
        setNewExpItemRows(prev => [...prev, anotherRow]);
        setSelectedExpItemIdx(newExpItemRows.length);
        setStatusMessage(`تمت إضافة سطر جديد رقم ${rowNum} في داتا ويندو الإضافة`);
      }
    } else if (activeMode === 'w_package_sup_sahb') {
      const nextId = (withdrawals.reduce((max, w) => Math.max(max, w.trans_id || 0), 0) || 0) + 1;
      const nextCode = (withdrawals.reduce((max, w) => Math.max(max, w.trans_code || 0), 0) || 500) + 1;
      const newWithdrawal: PackageShopWithdrawal = {
        trans_id: nextId,
        trans_code: nextCode,
        trans_date: today,
        shop_name: shops[0]?.shop_name || 'مصنع الأهرام للبلاستيك والكرتون',
        amount: 0,
        pay_type: 'نقدي',
        doc_no: `سند ${nextCode}`,
        notes: ''
      };
      setWithdrawals(prev => [newWithdrawal, ...prev]);
      setSelectedWithdrawalIdx(0);
      setStatusMessage('تمت إضافة سند مسحوبات محل كراتين جديد (+)');
    } else if (activeMode === 'w_kratin_sup_sahb2') {
      // التمرير إلى نموذج تسجيل إذن صرف جديد
      setStatusMessage('قم بتعبئة بيانات إذن صرف الكراتين بالأسفل والضغط على حفظ السند');
    }
  };

  // --- زر حذف السطر (-) المنفذ تماماً وفق تعليمات المستخدم ---
  // في داتا ويندو الاستعراض لا يفعل شيء، وفي داتا ويندو الإضافة يحذف السطر
  const handleRemoveButton = () => {
    if (activeMode === 'w_package_sups') {
      if (!isAddingShops) {
        // في داتا ويندو الاستعراض لا يفعل شيء!
        setStatusMessage('في داتا ويندو الاستعراض لا يمكن الحذف، الحذف فقط من التعديلات أو داتا ويندو الإضافة');
        return;
      }
      if (newShopsRows.length <= 1) {
        // إذا كان آخر سطر نلغي الإضافة ونعود للاستعراض
        setIsAddingShops(false);
        setNewShopsRows([]);
        setStatusMessage('تم إلغاء داتا ويندو الإضافة والعودة للاستعراض');
      } else {
        setNewShopsRows(prev => prev.filter((_, idx) => idx !== selectedShopIdx));
        setSelectedShopIdx(Math.max(0, selectedShopIdx - 1));
        setStatusMessage('تم حذف سطر الإضافة (-) بنجاح');
      }
    } else if (activeMode === 'w_package_exp_name') {
      if (!isAddingExpItems) {
        // في داتا ويندو الاستعراض لا يفعل شيء!
        setStatusMessage('في داتا ويندو الاستعراض لا يمكن الحذف، الحذف فقط من داتا ويندو الإضافة');
        return;
      }
      if (newExpItemRows.length <= 1) {
        setIsAddingExpItems(false);
        setNewExpItemRows([]);
        setStatusMessage('تم إلغاء داتا ويندو الإضافة والعودة للاستعراض');
      } else {
        setNewExpItemRows(prev => prev.filter((_, idx) => idx !== selectedExpItemIdx));
        setSelectedExpItemIdx(Math.max(0, selectedExpItemIdx - 1));
        setStatusMessage('تم حذف سطر الإضافة (-) بنجاح');
      }
    } else if (activeMode === 'w_package_sup_sahb') {
      if (withdrawals.length > 0 && selectedWithdrawalIdx >= 0 && selectedWithdrawalIdx < withdrawals.length) {
        setWithdrawals(prev => prev.filter((_, idx) => idx !== selectedWithdrawalIdx));
        setSelectedWithdrawalIdx(Math.max(0, selectedWithdrawalIdx - 1));
        setStatusMessage('تم حذف حركة المسحوبات (-)');
      }
    } else if (activeMode === 'w_kratin_sup_sahb2') {
      if (disbursements.length > 0 && selectedDisbIdx >= 0 && selectedDisbIdx < disbursements.length) {
        setDisbursements(prev => prev.filter((_, idx) => idx !== selectedDisbIdx));
        setSelectedDisbIdx(Math.max(0, selectedDisbIdx - 1));
        setStatusMessage('تم حذف إذن صرف الكراتين (-)');
      }
    }
  };

  // --- زر حفظ مع التحقق الصارم من منع تكرار الأسماء والأكواد باستخدام normalizeArabic ---
  const handleSave = () => {
    if (activeMode === 'w_package_sups') {
      if (isAddingShops) {
        // التحقق من أسطر الإضافة
        for (let i = 0; i < newShopsRows.length; i++) {
          const row = newShopsRows[i];
          const nameTrimmed = row.shop_name.trim();
          if (!nameTrimmed) {
            alert(`خطأ: اسم محل الكراتين في السطر رقم (${i + 1}) فارغ. يرجى كتابة الاسم.`);
            return;
          }

          // فحص التكرار الإملائي للأسم مع المحلات الموجودة
          const normNew = normalizeArabic(nameTrimmed);
          const duplicate = shops.find(s => normalizeArabic(s.shop_name) === normNew);
          if (duplicate) {
            alert(`خطأ: اسم محل الكراتين (${nameTrimmed}) مسجل بالفعل مسبقاً بكود [${duplicate.shop_code}]! يُمنع تكرار الأسماء منعاً للتهرب أو التلاعب.`);
            return;
          }

          // فحص التكرار الداخلي بين أسطر الإضافة المتعددة
          const internalDup = newShopsRows.findIndex((r, idx) => idx !== i && normalizeArabic(r.shop_name) === normNew);
          if (internalDup !== -1) {
            alert(`خطأ: الاسم (${nameTrimmed}) مكرر في السطرين (${i + 1}) و (${internalDup + 1}) داخل شاشة الإضافة!`);
            return;
          }
        }

        // إضافة الأسطر الجديدة وحفظها
        const updated = [...shops, ...newShopsRows];
        setShops(updated);
        wholesaleStore.setPackageShops(updated);
        setIsAddingShops(false);
        setNewShopsRows([]);
        setStatusMessage(`✓ تم حفظ عدد (${newShopsRows.length}) محل كراتين جديد بنجاح في قاعدة البيانات.`);
      } else {
        // حفظ تعديلات العناوين وأرقام الهواتف فقط في شاشة الاستعراض
        wholesaleStore.setPackageShops(shops);
        setStatusMessage('✓ تم حفظ التعديلات على محلات الكراتين بنجاح.');
      }
    } else if (activeMode === 'w_package_exp_name') {
      if (isAddingExpItems) {
        for (let i = 0; i < newExpItemRows.length; i++) {
          const row = newExpItemRows[i];
          const nameTrimmed = row.item_name.trim();
          if (!nameTrimmed) {
            alert(`خطأ: اسم مستلزم التعبئة في السطر (${i + 1}) فارغ.`);
            return;
          }

          const normNew = normalizeArabic(nameTrimmed);
          const duplicate = expItems.find(item => normalizeArabic(item.item_name) === normNew);
          if (duplicate) {
            alert(`خطأ: مستلزم التعبئة (${nameTrimmed}) مسجل بالفعل بكود [${duplicate.item_code}]! لا يمكن تكرار الأصناف.`);
            return;
          }

          const internalDup = newExpItemRows.findIndex((r, idx) => idx !== i && normalizeArabic(r.item_name) === normNew);
          if (internalDup !== -1) {
            alert(`خطأ: الصنف (${nameTrimmed}) مكرر داخل شاشة الإضافة!`);
            return;
          }
        }

        const updated = [...expItems, ...newExpItemRows];
        setExpItems(updated);
        wholesaleStore.setPackageExpItems(updated);
        setIsAddingExpItems(false);
        setNewExpItemRows([]);
        setStatusMessage(`✓ تم حفظ عدد (${newExpItemRows.length}) مستلزم تعبئة جديد بنجاح.`);
      } else {
        wholesaleStore.setPackageExpItems(expItems);
        setStatusMessage('✓ تم حفظ بيانات مستلزمات التعبئة بنجاح.');
      }
    } else if (activeMode === 'w_package_sup_sahb') {
      wholesaleStore.setPackageWithdrawals(withdrawals);
      setStatusMessage('✓ تم حفظ مسحوبات محلات الكراتين بنجاح.');
    } else if (activeMode === 'w_kratin_sup_sahb2') {
      wholesaleStore.setPackageDisbursements(disbursements);
      setStatusMessage('✓ تم حفظ أذونات صرف الكراتين للموردين بنجاح.');
    } else {
      setStatusMessage('✓ تم تثبيت بيانات التقرير.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- دوال تعديل نموذج صرف كراتين لمورد (6-4) ---
  const handleDisbFormChange = (field: string, value: any) => {
    setNewDisbForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'sup_name') {
        const supFarms = db.farms.filter(f => f.sup_name === value);
        updated.farm_name = supFarms[0]?.farm_name || '';
        const supNaklat = db.naklat.filter(n => n.sup_name === value);
        updated.nakla_name = supNaklat[0]?.nakla_name || '';
      }
      return updated;
    });
  };

  const handleAddDisbItemRow = () => {
    const nextId = (newDisbForm.items.reduce((max, i) => Math.max(max, i.id || 0), 0) || 0) + 1;
    const newItem: PackageDisbursementItem = {
      id: nextId,
      item_name: expItems[0]?.item_name || 'برنيكة بلاستيك مقوى',
      shop_name: newDisbForm.shop_name,
      qty: 50,
      unit_price: 25.0,
      total_amount: 1250
    };
    setNewDisbForm(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveDisbItemRow = (itemIdx: number) => {
    setNewDisbForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== itemIdx)
    }));
  };

  const handleDisbItemChange = (itemIdx: number, field: keyof PackageDisbursementItem, value: any) => {
    setNewDisbForm(prev => {
      const nextItems = [...prev.items];
      const item = { ...nextItems[itemIdx], [field]: value };
      if (field === 'qty' || field === 'unit_price') {
        item.total_amount = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
      }
      nextItems[itemIdx] = item;
      return { ...prev, items: nextItems };
    });
  };

  // حفظ إذن صرف الكراتين الصادر لمورد
  const handleSaveDisbursement = () => {
    if (!newDisbForm.sup_name) {
      alert('يرجى اختيار اسم المورد.');
      return;
    }
    if (newDisbForm.items.length === 0) {
      alert('يرجى إضافة مستلزم تعبئة واحد على الأقل في الجدول الصغير.');
      return;
    }

    const nextId = (disbursements.reduce((max, d) => Math.max(max, d.disb_id || 0), 0) || 0) + 1;
    const nextCode = (disbursements.reduce((max, d) => Math.max(max, d.disb_code || 0), 0) || 700) + 1;

    const totalQty = newDisbForm.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const totalAmount = newDisbForm.items.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
    const mainPackName = newDisbForm.items.map(i => `${i.item_name} (${i.qty})`).join(' + ');

    const newDisb: PackageDisbursement = {
      disb_id: nextId,
      disb_code: nextCode,
      trans_date: newDisbForm.trans_date,
      sup_name: newDisbForm.sup_name,
      farm_name: newDisbForm.farm_name,
      shop_name: newDisbForm.shop_name,
      pack_name: mainPackName,
      qty: totalQty,
      unit_price: totalQty > 0 ? Math.round((totalAmount / totalQty) * 10) / 10 : 0,
      total_amount: totalAmount,
      nakla_name: newDisbForm.link_type === 'nakla' ? newDisbForm.nakla_name : '',
      deducted_from_nakla: newDisbForm.link_type === 'nakla',
      items: newDisbForm.items,
      notes: newDisbForm.notes
    };

    const updated = [newDisb, ...disbursements];
    setDisbursements(updated);
    wholesaleStore.setPackageDisbursements(updated);
    setStatusMessage(`✓ تم حفظ إذن صرف الكراتين رقم [${nextCode}] للمورد (${newDisbForm.sup_name}) بنجاح.`);

    // إعادة ضبط النموذج
    setNewDisbForm(prev => ({
      ...prev,
      items: [
        {
          id: 1,
          item_name: expItems[0]?.item_name || 'برنيكة بلاستيك مقوى',
          shop_name: prev.shop_name,
          qty: 100,
          unit_price: 35.0,
          total_amount: 3500
        }
      ]
    }));
  };

  // -------------------------------------------------------------
  // حسابات وبيانات التقارير (6-5 إلى 6-11)
  // -------------------------------------------------------------

  // فلترة السندات حسب التاريخ والمورد ومحل الكراتين
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter(d => {
      if (selectedReportSup !== 'all' && d.sup_name !== selectedReportSup) return false;
      if (selectedReportShop !== 'all' && d.shop_name !== selectedReportShop) return false;
      return true;
    });
  }, [disbursements, selectedReportSup, selectedReportShop]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (selectedReportShop !== 'all' && w.shop_name !== selectedReportShop) return false;
      return true;
    });
  }, [withdrawals, selectedReportShop]);

  // تقرير 6-6: كشف حساب جميع محلات الكراتين (تجميع لكل محل)
  const allShopsSummary = useMemo(() => {
    return shops.map(shop => {
      const shopWithdrawals = withdrawals.filter(w => w.shop_name === shop.shop_name);
      const totalWithdrawn = shopWithdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

      const shopDisbs = disbursements.filter(d => d.shop_name === shop.shop_name);
      const totalSupplied = shopDisbs.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);

      // الصافي المتبقي لمحل الكراتين = قيمة ما ورده - المسحوبات المسددة له
      const netBalance = totalSupplied - totalWithdrawn;

      return {
        shop_code: shop.shop_code,
        shop_name: shop.shop_name,
        address: shop.address || 'سوق الجملة',
        mobile: shop.mobile || '-',
        totalWithdrawn,
        totalSupplied,
        netBalance
      };
    });
  }, [shops, withdrawals, disbursements]);

  // تقرير 6-9: وضع الشركة بالنسبة للموردين ومحلات الكراتين
  const companyPackagingStatus = useMemo(() => {
    const totalWithdrawnToBoxShops = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const totalDisbursedToFruitSups = disbursements.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
    const netDifference = totalDisbursedToFruitSups - totalWithdrawnToBoxShops;

    return {
      totalWithdrawnToBoxShops,
      totalDisbursedToFruitSups,
      netDifference
    };
  }, [withdrawals, disbursements]);

  // تقرير 6-10: مستلزمات التعبئة لمورد غير مخصوم على نقلة (معلق على الحساب العام)
  const unlinkedPackagingReport = useMemo(() => {
    return disbursements.filter(d => {
      if (d.deducted_from_nakla) return false;
      if (selectedReportSup !== 'all' && d.sup_name !== selectedReportSup) return false;
      return true;
    });
  }, [disbursements, selectedReportSup]);

  // تقرير 6-11: جميع الموردين مع جميع محلات الكراتين
  const allSupsAllShopsMatrix = useMemo(() => {
    const rows: {
      sup_name: string;
      shop_name: string;
      totalQty: number;
      totalAmount: number;
      deductedAmount: number;
      pendingAmount: number;
    }[] = [];

    const supList = db.suppliers.map(s => s.sup_name);
    const shopList = shops.map(s => s.shop_name);

    supList.forEach(sup => {
      shopList.forEach(shop => {
        const matchingDisbs = disbursements.filter(d => d.sup_name === sup && d.shop_name === shop);
        if (matchingDisbs.length > 0) {
          const totalQty = matchingDisbs.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
          const totalAmount = matchingDisbs.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
          const deductedAmount = matchingDisbs
            .filter(d => d.deducted_from_nakla)
            .reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
          const pendingAmount = totalAmount - deductedAmount;

          rows.push({
            sup_name: sup,
            shop_name: shop,
            totalQty,
            totalAmount,
            deductedAmount,
            pendingAmount
          });
        }
      });
    });

    return rows;
  }, [disbursements, db.suppliers, shops]);

  const isDataEntryMode =
    activeMode === 'w_package_sups' ||
    activeMode === 'w_package_exp_name' ||
    activeMode === 'w_package_sup_sahb' ||
    activeMode === 'w_kratin_sup_sahb2';

  return (
    <div className="w-full flex items-center justify-center min-h-[calc(100vh-120px)] p-2 select-none overflow-x-auto overflow-y-auto" dir="rtl">
      {/* إطار نافذة الباور بيلدر الأصلي المتقن (#d4d0c8 مع حدود 3D مشطوفة) */}
      <div className="w-[1080px] max-w-full bg-[#d4d0c8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-2xl flex flex-col font-sans text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar): تحكم على اليمين وعنوان النافذة على اليسار */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onClose}
              title="إغلاق"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-rose-500 hover:text-white"
            >
              <X className="w-3 h-3 stroke-[3]" />
            </button>
            <button
              type="button"
              title="تكبير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8]"
            >
              <Square className="w-2.5 h-2.5 stroke-[2]" />
            </button>
            <button
              type="button"
              title="تصغير"
              className="w-4 h-4 bg-[#d4d0c8] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] flex items-center justify-center text-[10px] text-slate-700 hover:bg-[#e0ded8]"
            >
              <Minus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">
              {windowInfo.title}
            </span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-500">
              {windowInfo.code}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* شريط اختيار نوافذ مستلزمات التعبئة (6-1 إلى 6-11) */}
        <div className="bg-[#b9c3cc] px-2 py-1 border-b border-[#7b838c] flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
          <button
            type="button"
            onClick={() => { setActiveMode('w_package_sups'); setIsAddingShops(false); }}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_package_sups'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-1 تسجيل محلات الكراتين
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('w_package_exp_name'); setIsAddingExpItems(false); }}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_package_exp_name'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-2 تسجيل مستلزمات التعبئة
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_package_sup_sahb')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_package_sup_sahb'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-3 مسحوبات محلات الكراتين
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_kratin_sup_sahb2')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_kratin_sup_sahb2'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-4 صرف كراتين لمورد
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_kratin_account')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_kratin_account'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-5 كشف حساب محل كراتين
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_all_kratin_accounts')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_all_kratin_accounts'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-6 كشف حساب جميع المحلات
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_sup_packaging_total')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_sup_packaging_total'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-7 تقرير مورد (إجمالي)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_sup_packaging_detail')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_sup_packaging_detail'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-8 تقرير مورد (تفصيلي)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_company_packaging_status')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_company_packaging_status'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-9 وضع الشركة
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_sup_packaging_not_deducted')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_sup_packaging_not_deducted'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-10 غير مخصوم على نقلة
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('w_rep_all_sups_packaging_not_deducted')}
            className={`px-2.5 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors whitespace-nowrap ${
              activeMode === 'w_rep_all_sups_packaging_not_deducted'
                ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
            }`}
          >
            6-11 جميع الموردين والمحلات
          </button>
        </div>

        {/* 2. جسم النافذة الرئيسي: الأزرار الكلاسيكية على اليمين ومحتوى الـ DataWindow على اليسار */}
        <div className="p-3 bg-[#d4d0c8] flex items-start gap-3">
          
          {/* الأزرار العمودية الخارجية على اليمين المطابقة تماماً لشاشة الزبائن ومزارع وموردي الباور بيلدر */}
          <div className="flex flex-col gap-2 pt-1 shrink-0">
            {/* زر إضافة (+) */}
            <button
              type="button"
              onClick={handleAddButton}
              title="إضافة (+)"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              +
            </button>

            {/* زر حذف (-) */}
            <button
              type="button"
              onClick={handleRemoveButton}
              title="حذف (-)"
              className="w-14 h-8 bg-[#fcdada] hover:bg-[#f8c4c4] active:bg-[#f4a8a8] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-800 text-lg font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              -
            </button>

            {/* زر حفظ الأخضر الفاتح */}
            <button
              type="button"
              onClick={handleSave}
              title="حفظ البيانات في قاعدة البيانات"
              className="w-14 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-[13px] font-bold shadow active:border-t-[#404040] active:border-l-[#404040]"
            >
              حفظ
            </button>

            {/* زر الطباعة المخصص مع أيقونة الطابعة الكبيرة */}
            <button
              type="button"
              onClick={handlePrint}
              title="طباعة"
              className="w-14 h-11 bg-white hover:bg-slate-50 active:bg-slate-200 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex flex-col items-center justify-center shadow p-1 mt-1"
            >
              <Printer className="w-6 h-6 text-slate-800" />
              <span className="text-[7.5px] font-bold text-slate-700 mt-0.5">طباعة</span>
            </button>

            {/* زر إلغاء الإضافة / رجوع للاستعراض إذا كنا في وضع الإضافة */}
            {(isAddingShops || isAddingExpItems) && (
              <button
                type="button"
                onClick={() => {
                  setIsAddingShops(false);
                  setIsAddingExpItems(false);
                  setNewShopsRows([]);
                  setNewExpItemRows([]);
                  setStatusMessage('تم العودة لشاشة الاستعراض للقراءة فقط');
                }}
                title="إلغاء الإضافة والعودة للاستعراض"
                className="w-14 h-8 bg-amber-100 hover:bg-amber-200 border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-amber-900 text-[10px] font-bold shadow mt-1"
              >
                استعراض
              </button>
            )}

            {/* زر خروج */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="إغلاق النافذة"
                className="w-14 h-8 bg-[#d4d0c8] hover:bg-[#e0ded8] active:bg-[#b8b4ac] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] flex items-center justify-center text-slate-900 text-xs font-bold shadow mt-2"
              >
                خروج
              </button>
            )}
          </div>

          {/* GroupBox: محتوى الـ DataWindow على يسار الأزرار */}
          <div className="flex-1 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 relative pt-4 bg-[#d4d0c8]">
            <span className="absolute -top-2.5 right-4 bg-[#d4d0c8] px-2 text-[12px] font-bold text-slate-800">
              {windowInfo.title}
            </span>

            {/* ========================================================= */}
            {/* 1. نافذة 6-1: تسجيل محلات الكراتين (الاسم والعنوان ورقم الهاتف) */}
            {/* ========================================================= */}
            {activeMode === 'w_package_sups' && (
              <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner flex flex-col">
                <div className="overflow-x-auto max-h-[390px] overflow-y-auto">
                  <table className="w-full border-collapse text-[12px] font-sans text-right select-text">
                    <thead>
                      <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold sticky top-0 z-10">
                        <th className="border-l border-[#a0a0a0] px-2 py-1.5 text-center w-12">م</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5 text-center w-24">كود المحل</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5">اسم محل الكراتين</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5 w-72">العنوان</th>
                        <th className="px-3 py-1.5 text-center w-40">رقم الهاتف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* جدول الإضافة الجديدة: dw_package_sups_add */}
                      {isAddingShops ? (
                        newShopsRows.map((row, idx) => (
                          <tr
                            key={`new-shop-${idx}`}
                            onClick={() => setSelectedShopIdx(idx)}
                            className={selectedShopIdx === idx ? 'bg-amber-100/80 font-semibold' : 'bg-white'}
                          >
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs text-amber-900 font-bold">
                              + {idx + 1}
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-slate-700 bg-slate-50">
                              {row.shop_code}
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1">
                              <input
                                type="text"
                                autoFocus={idx === selectedShopIdx}
                                value={row.shop_name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewShopsRows(prev => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], shop_name: val };
                                    return next;
                                  });
                                }}
                                placeholder="اكتب اسم محل الكراتين أو المصنع..."
                                className="w-full bg-white text-slate-900 border border-amber-500 px-2 py-0.5 font-bold outline-none"
                              />
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1">
                              <input
                                type="text"
                                value={row.address || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewShopsRows(prev => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], address: val };
                                    return next;
                                  });
                                }}
                                placeholder="العنوان أو المنطقة الصناعية..."
                                className="w-full bg-white text-slate-900 border border-slate-300 px-2 py-0.5 text-xs outline-none"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={row.mobile || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewShopsRows(prev => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], mobile: val };
                                    return next;
                                  });
                                }}
                                placeholder="01xxxxxxxxx"
                                className="w-full bg-white text-slate-900 border border-slate-300 px-2 py-0.5 font-mono text-center text-xs outline-none"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        /* جدول الاستعراض: dw_package_sups (الاسم للقراءة فقط والعنوان ورقم الهاتف قابل للتعديل) */
                        shops.map((s, idx) => {
                          const isSelected = selectedShopIdx === idx;
                          return (
                            <tr
                              key={s.shop_id || idx}
                              onClick={() => setSelectedShopIdx(idx)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#000080] text-white font-semibold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                                  : 'bg-[#f4f6f8] text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">
                                {idx + 1}
                              </td>
                              <td className="border-l border-slate-300 px-3 py-1 text-center font-mono font-bold">
                                {s.shop_code}
                              </td>
                              {/* الاسم للقراءة فقط في شاشة الاستعراض منعاً للتعديل المباشر */}
                              <td className="border-l border-slate-300 px-3 py-1 font-bold">
                                {s.shop_name}
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1">
                                {isSelected ? (
                                  <input
                                    type="text"
                                    value={s.address || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setShops(prev => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], address: val };
                                        return next;
                                      });
                                    }}
                                    className="w-full bg-white text-slate-900 border border-slate-400 px-1 text-xs outline-none"
                                  />
                                ) : (
                                  <span className="text-xs">{s.address || '---'}</span>
                                )}
                              </td>
                              <td className="px-2 py-1 font-mono text-center">
                                {isSelected ? (
                                  <input
                                    type="text"
                                    value={s.mobile || ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setShops(prev => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], mobile: val };
                                        return next;
                                      });
                                    }}
                                    className="w-full bg-white text-slate-900 border border-slate-400 px-1 font-mono text-center text-xs outline-none"
                                  />
                                ) : (
                                  <span className="text-xs">{s.mobile || '---'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#cfd3db] p-1.5 border-t border-[#7b838c] flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>
                    {isAddingShops
                      ? `داتا ويندو الإضافة: جاري إضافة ${newShopsRows.length} محل كراتين جديد (+)`
                      : `عدد محلات الكراتين المسجلة: ${shops.length} محل`}
                  </span>
                  <span className="text-slate-600">
                    {isAddingShops
                      ? 'اكتب الأسماء واضغط حفظ للتثبيت أو (-) للإلغاء'
                      : 'الاسم للقراءة فقط في الاستعراض ويُعدّل من شاشة التعديلات'}
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. نافذة 6-2: تسجيل مستلزمات التعبئة (اسم مستلزم التعبئة فقط) */}
            {/* ========================================================= */}
            {activeMode === 'w_package_exp_name' && (
              <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner flex flex-col">
                <div className="overflow-x-auto max-h-[390px] overflow-y-auto">
                  <table className="w-full border-collapse text-[12px] font-sans text-right select-text">
                    <thead>
                      <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold sticky top-0 z-10">
                        <th className="border-l border-[#a0a0a0] px-2 py-1.5 text-center w-14">م</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5 text-center w-28">كود الصنف</th>
                        <th className="px-4 py-1.5">اسم مستلزم التعبئة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {isAddingExpItems ? (
                        newExpItemRows.map((row, idx) => (
                          <tr
                            key={`new-item-${idx}`}
                            onClick={() => setSelectedExpItemIdx(idx)}
                            className={selectedExpItemIdx === idx ? 'bg-amber-100/80 font-semibold' : 'bg-white'}
                          >
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs text-amber-900 font-bold">
                              + {idx + 1}
                            </td>
                            <td className="border-l border-slate-300 px-3 py-1 text-center font-mono font-bold text-slate-700 bg-slate-50">
                              {row.item_code}
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                autoFocus={idx === selectedExpItemIdx}
                                value={row.item_name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setNewExpItemRows(prev => {
                                    const next = [...prev];
                                    next[idx] = { ...next[idx], item_name: val };
                                    return next;
                                  });
                                }}
                                placeholder="اكتب اسم مستلزم التعبئة فقط (مثال: برنيكة بلاستيك مقوى، كرتونة موز 18 كجم)..."
                                className="w-full bg-white text-slate-900 border border-amber-500 px-2 py-0.5 font-bold outline-none"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        expItems.map((item, idx) => {
                          const isSelected = selectedExpItemIdx === idx;
                          return (
                            <tr
                              key={item.item_id || idx}
                              onClick={() => setSelectedExpItemIdx(idx)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#000080] text-white font-semibold'
                                  : idx % 2 === 0
                                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                                  : 'bg-[#f4f6f8] text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">
                                {idx + 1}
                              </td>
                              <td className="border-l border-slate-300 px-3 py-1 text-center font-mono font-bold">
                                {item.item_code}
                              </td>
                              {/* الاسم للقراءة فقط في شاشة الاستعراض */}
                              <td className="px-4 py-1.5 font-bold text-[13px]">
                                {item.item_name}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#cfd3db] p-1.5 border-t border-[#7b838c] flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>
                    {isAddingExpItems
                      ? `داتا ويندو الإضافة: جاري إضافة ${newExpItemRows.length} مستلزم تعبئة جديد (+)`
                      : `عدد مستلزمات التعبئة المسجلة: ${expItems.length} مستلزم`}
                  </span>
                  <span className="text-slate-600">
                    تشمل حصراً كود الصنف واسم مستلزم التعبئة فقط
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. نافذة 6-3: مسحوبات محلات الكراتين (المبالغ المسحوبة واسم المحل والتاريخ) */}
            {/* ========================================================= */}
            {activeMode === 'w_package_sup_sahb' && (
              <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner flex flex-col">
                <div className="overflow-x-auto max-h-[390px] overflow-y-auto">
                  <table className="w-full border-collapse text-[12px] font-sans text-right select-text">
                    <thead>
                      <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold sticky top-0 z-10">
                        <th className="border-l border-[#a0a0a0] px-2 py-1.5 text-center w-10">م</th>
                        <th className="border-l border-[#a0a0a0] px-2 py-1.5 text-center w-28">التاريخ</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5">اسم محل الكراتين</th>
                        <th className="border-l border-[#a0a0a0] px-3 py-1.5 text-center w-36">المبلغ المسحوب (ج.م)</th>
                        <th className="border-l border-[#a0a0a0] px-2 py-1.5 text-center w-28">رقم السند</th>
                        <th className="px-2 py-1.5 w-48">البيان / ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {withdrawals.map((w, idx) => {
                        const isSelected = selectedWithdrawalIdx === idx;
                        return (
                          <tr
                            key={w.trans_id || idx}
                            onClick={() => setSelectedWithdrawalIdx(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#000080] text-white font-semibold'
                                : idx % 2 === 0
                                ? 'bg-white text-slate-900 hover:bg-slate-100'
                                : 'bg-[#f4f6f8] text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">
                              {idx + 1}
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">
                              {isSelected ? (
                                <input
                                  type="date"
                                  value={w.trans_date}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setWithdrawals(prev => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], trans_date: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full bg-white text-slate-900 border border-slate-400 px-1 font-mono text-center outline-none text-xs"
                                />
                              ) : (
                                w.trans_date
                              )}
                            </td>
                            <td className="border-l border-slate-300 px-3 py-1 font-bold">
                              {isSelected ? (
                                <select
                                  value={w.shop_name}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setWithdrawals(prev => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], shop_name: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full bg-white text-slate-900 border border-slate-400 px-1 font-bold outline-none text-xs"
                                >
                                  {shops.map(s => (
                                    <option key={s.shop_id} value={s.shop_name}>
                                      {s.shop_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                w.shop_name
                              )}
                            </td>
                            <td className={`border-l border-slate-300 px-3 py-1 text-center font-mono font-bold ${
                              isSelected ? 'text-white' : 'text-rose-700'
                            }`}>
                              {isSelected ? (
                                <input
                                  type="number"
                                  value={w.amount}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    setWithdrawals(prev => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], amount: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full bg-white text-rose-800 border border-slate-400 px-1 text-center font-mono font-bold outline-none"
                                />
                              ) : (
                                `${Number(w.amount).toLocaleString()} ج.م`
                              )}
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">
                              {isSelected ? (
                                <input
                                  type="text"
                                  value={w.doc_no || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setWithdrawals(prev => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], doc_no: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full bg-white text-slate-900 border border-slate-400 px-1 font-mono text-center outline-none text-xs"
                                />
                              ) : (
                                w.doc_no || '---'
                              )}
                            </td>
                            <td className="px-2 py-1 text-xs">
                              {isSelected ? (
                                <input
                                  type="text"
                                  value={w.notes || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setWithdrawals(prev => {
                                      const next = [...prev];
                                      next[idx] = { ...next[idx], notes: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full bg-white text-slate-900 border border-slate-400 px-1 outline-none text-xs"
                                />
                              ) : (
                                w.notes || '---'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#cfd3db] p-1.5 border-t border-[#7b838c] flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>عدد سندات المسحوبات: {withdrawals.length}</span>
                  <span>
                    إجمالي المسحوبات المسددة لمحلات الكراتين:{' '}
                    <span className="font-mono text-rose-800">
                      {withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0).toLocaleString()} ج.م
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. نافذة 6-4: صرف كراتين لمورد وربطها بالفاتورة لمطالبة مورد الفاكهة */}
            {/* ========================================================= */}
            {activeMode === 'w_kratin_sup_sahb2' && (
              <div className="flex flex-col gap-3">
                {/* نموذج إذن الصرف الرئيسي */}
                <div className="bg-[#e4e8ec] p-2.5 border border-[#7b838c] rounded-xs shadow-inner flex flex-col gap-2">
                  <div className="text-xs font-bold text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
                    <span>تسجيل إذن صرف مستلزمات تعبئة وكراتين لمورد جديد</span>
                    <span className="text-[11px] font-mono text-slate-600">التاريخ: {newDisbForm.trans_date}</span>
                  </div>

                  {/* الحقول العلوية: المورد، المزرعة، محل الكراتين، وخيار الربط بالفاتورة */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5">اسم مورد الفاكهة:</label>
                      <select
                        value={newDisbForm.sup_name}
                        onChange={e => handleDisbFormChange('sup_name', e.target.value)}
                        className="w-full bg-white border border-slate-400 px-2 py-1 text-xs font-bold outline-none"
                      >
                        {db.suppliers.map(s => (
                          <option key={s.sup_id} value={s.sup_name}>
                            {s.sup_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5">المزرعة:</label>
                      <select
                        value={newDisbForm.farm_name}
                        onChange={e => handleDisbFormChange('farm_name', e.target.value)}
                        className="w-full bg-white border border-slate-400 px-2 py-1 text-xs outline-none"
                      >
                        {db.farms
                          .filter(f => f.sup_name === newDisbForm.sup_name)
                          .map(f => (
                            <option key={f.farm_id} value={f.farm_name}>
                              {f.farm_name}
                            </option>
                          ))}
                        <option value="">بدون مزرعة محددة</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5">محل الكراتين المصروف منه:</label>
                      <select
                        value={newDisbForm.shop_name}
                        onChange={e => handleDisbFormChange('shop_name', e.target.value)}
                        className="w-full bg-white border border-slate-400 px-2 py-1 text-xs font-bold text-slate-900 outline-none"
                      >
                        {shops.map(s => (
                          <option key={s.shop_id} value={s.shop_name}>
                            {s.shop_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-0.5">ربط المطالبة والخصم:</label>
                      <select
                        value={newDisbForm.link_type}
                        onChange={e => handleDisbFormChange('link_type', e.target.value)}
                        className="w-full bg-white border border-slate-400 px-2 py-1 text-xs font-bold text-blue-900 outline-none"
                      >
                        <option value="nakla">خصم على فاتورة تصفية النقلة</option>
                        <option value="account">خصم على كشف حساب المورد العام (بدون نقلة)</option>
                      </select>
                    </div>
                  </div>

                  {/* اختيار النقلة في حالة الخصم على النقلة */}
                  {newDisbForm.link_type === 'nakla' && (
                    <div className="bg-blue-50/70 p-1.5 border border-blue-200 flex items-center gap-3 text-xs">
                      <span className="font-bold text-blue-900">النقلة التي سيتم خصم المستلزمات منها:</span>
                      <select
                        value={newDisbForm.nakla_name}
                        onChange={e => handleDisbFormChange('nakla_name', e.target.value)}
                        className="flex-1 bg-white border border-blue-400 px-2 py-1 text-xs font-bold outline-none"
                      >
                        {db.naklat
                          .filter(n => n.sup_name === newDisbForm.sup_name)
                          .map(n => (
                            <option key={n.nakla_id} value={n.nakla_name}>
                              {n.nakla_name} - بتاريخ {n.nakla_date}
                            </option>
                          ))}
                        {db.naklat.filter(n => n.sup_name === newDisbForm.sup_name).length === 0 && (
                          <option value="">لا توجد نقلات مسجلة لهذا المورد حالياً (سيتم التعليق لحين ورود النقلة)</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* جدول صغير يوضح المستلزمات وعددها وسعرها (Small Embedded Items Grid) */}
                  <div className="border border-slate-400 bg-white">
                    <div className="bg-[#cfd3db] px-2 py-1 border-b border-slate-400 flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>جدول المستلزمات والكراتين المصروفة في هذا السند</span>
                      <button
                        type="button"
                        onClick={handleAddDisbItemRow}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة صنف بالجدول
                      </button>
                    </div>

                    <table className="w-full border-collapse text-xs text-right">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-8">م</th>
                          <th className="border-l border-slate-300 px-2 py-1">اسم مستلزم التعبئة</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-24">العدد / الكمية</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-28">السعر (ج.م)</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-28">الإجمالي (ج.م)</th>
                          <th className="px-2 py-1 text-center w-12">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {newDisbForm.items.map((item, itemIdx) => (
                          <tr key={item.id || itemIdx} className="hover:bg-slate-50">
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{itemIdx + 1}</td>
                            <td className="border-l border-slate-300 px-2 py-1">
                              <select
                                value={item.item_name}
                                onChange={e => handleDisbItemChange(itemIdx, 'item_name', e.target.value)}
                                className="w-full bg-white border border-slate-300 px-1 py-0.5 text-xs outline-none"
                              >
                                {expItems.map(i => (
                                  <option key={i.item_id} value={i.item_name}>
                                    {i.item_name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border-l border-slate-300 px-1 py-1">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={e => handleDisbItemChange(itemIdx, 'qty', Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 px-1 py-0.5 text-center font-mono font-bold outline-none"
                              />
                            </td>
                            <td className="border-l border-slate-300 px-1 py-1">
                              <input
                                type="number"
                                step="0.5"
                                value={item.unit_price}
                                onChange={e => handleDisbItemChange(itemIdx, 'unit_price', Number(e.target.value))}
                                className="w-full bg-white border border-slate-300 px-1 py-0.5 text-center font-mono outline-none"
                              />
                            </td>
                            <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-blue-900">
                              {Number(item.total_amount).toLocaleString()} ج.م
                            </td>
                            <td className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveDisbItemRow(itemIdx)}
                                title="حذف هذا الصنف"
                                className="text-rose-600 hover:text-rose-800 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* سطر الإجمالي وزر الحفظ */}
                    <div className="bg-slate-100 p-2 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-900">
                      <div>
                        إجمالي عدد المستلزمات:{' '}
                        <span className="font-mono text-emerald-800">
                          {newDisbForm.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)}
                        </span>
                        {' | '}
                        إجمالي القيمة:{' '}
                        <span className="font-mono text-blue-900 text-sm">
                          {newDisbForm.items.reduce((s, i) => s + (Number(i.total_amount) || 0), 0).toLocaleString()} ج.م
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveDisbursement}
                        className="px-4 py-1 bg-[#d8ecd8] hover:bg-[#c6e4c6] border border-emerald-600 text-emerald-950 font-bold rounded shadow-xs"
                      >
                        حفظ سند الصرف وتثبيته
                      </button>
                    </div>
                  </div>
                </div>

                {/* جدول استعراض كافة أذونات صرف الكراتين المسجلة */}
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner flex flex-col">
                  <div className="bg-[#cfd3db] px-2 py-1 border-b border-slate-400 font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>سجل أذونات صرف الكراتين والمستلزمات لموردي الفاكهة</span>
                    <span>عدد السندات: {disbursements.length}</span>
                  </div>

                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                    <table className="w-full border-collapse text-xs text-right">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300 text-slate-800 font-bold">
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-8">م</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-20">التاريخ</th>
                          <th className="border-l border-slate-300 px-2 py-1 w-32">المورد</th>
                          <th className="border-l border-slate-300 px-2 py-1 w-32">المزرعة</th>
                          <th className="border-l border-slate-300 px-2 py-1 w-36">محل الكراتين</th>
                          <th className="border-l border-slate-300 px-2 py-1">المستلزمات المصروفة</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-16">العدد</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-24">الإجمالي</th>
                          <th className="border-l border-slate-300 px-2 py-1 text-center w-36">النقلة / حالة الربط</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {disbursements.map((d, idx) => (
                          <tr
                            key={d.disb_id || idx}
                            onClick={() => setSelectedDisbIdx(idx)}
                            className={selectedDisbIdx === idx ? 'bg-blue-50 font-semibold' : 'hover:bg-slate-50'}
                          >
                            <td className="border-l border-slate-300 px-1 py-1 text-center font-mono text-xs">{idx + 1}</td>
                            <td className="border-l border-slate-300 px-1 py-1 text-center font-mono">{d.trans_date}</td>
                            <td className="border-l border-slate-300 px-2 py-1 font-bold">{d.sup_name}</td>
                            <td className="border-l border-slate-300 px-2 py-1 text-xs">{d.farm_name || '---'}</td>
                            <td className="border-l border-slate-300 px-2 py-1 text-xs">{d.shop_name || '---'}</td>
                            <td className="border-l border-slate-300 px-2 py-1 text-xs">{d.pack_name}</td>
                            <td className="border-l border-slate-300 px-1 py-1 text-center font-mono font-bold text-emerald-800">{d.qty}</td>
                            <td className="border-l border-slate-300 px-1 py-1 text-center font-mono font-bold text-blue-900">
                              {Number(d.total_amount).toLocaleString()} ج.م
                            </td>
                            <td className="px-2 py-1 text-center">
                              {d.deducted_from_nakla ? (
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-300">
                                  مخصوم على: {d.nakla_name}
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-300">
                                  معلق على الحساب العام
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. شاشات التقارير 6-5 إلى 6-11 (DataWindow Reports) */}
            {/* ========================================================= */}
            {!isDataEntryMode && (
              <div className="flex flex-col gap-2.5">
                {/* شريط الفلاتر الكلاسيكي */}
                <div className="bg-[#b9c3cc] p-2 border border-[#7b838c] flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span>من تاريخ:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                    />
                    <span>إلى تاريخ:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      className="bg-white border border-slate-400 px-1.5 py-0.5 font-mono text-xs"
                    />
                  </div>

                  {/* فلتر محل الكراتين */}
                  {(activeMode === 'w_rep_kratin_account' ||
                    activeMode === 'w_rep_company_packaging_status') && (
                    <div className="flex items-center gap-2">
                      <span>محل الكراتين:</span>
                      <select
                        value={selectedReportShop}
                        onChange={e => setSelectedReportShop(e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-0.5 text-xs font-bold"
                      >
                        <option value="all">جميع المحلات</option>
                        {shops.map(s => (
                          <option key={s.shop_id} value={s.shop_name}>
                            {s.shop_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* فلتر المورد */}
                  {(activeMode === 'w_rep_sup_packaging_total' ||
                    activeMode === 'w_rep_sup_packaging_detail' ||
                    activeMode === 'w_rep_sup_packaging_not_deducted') && (
                    <div className="flex items-center gap-2">
                      <span>مورد الفاكهة:</span>
                      <select
                        value={selectedReportSup}
                        onChange={e => setSelectedReportSup(e.target.value)}
                        className="bg-white border border-slate-400 px-2 py-0.5 text-xs font-bold"
                      >
                        <option value="all">جميع الموردين</option>
                        {db.suppliers.map(s => (
                          <option key={s.sup_id} value={s.sup_name}>
                            {s.sup_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setStatusMessage('تم استرجاع بيانات التقرير بنجاح (Retrieve)')}
                    className="px-3 py-1 bg-[#d4d0c8] hover:bg-white border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] font-bold text-xs"
                  >
                    استعراض التقرير
                  </button>
                </div>

                {/* لوحة عرض التقرير DataWindow Grid */}
                <div className="border border-t-[#404040] border-l-[#404040] border-b-white border-r-white bg-white overflow-hidden shadow-inner flex flex-col">
                  {/* رأس التقرير الكلاسيكي */}
                  <div className="p-3 border-b-2 border-slate-800 bg-slate-50 flex items-center justify-between">
                    <div className="text-right">
                      <h2 className="text-sm font-black text-slate-900">{windowInfo.title}</h2>
                      <p className="text-[11px] text-slate-600 font-semibold">
                        سوق الجملة 6 أكتوبر - وكالة أبو حسن لتجارة الفاكهة والخضار
                      </p>
                    </div>
                    <div className="text-left font-mono text-[11px] text-slate-700">
                      <div>التاريخ: {today}</div>
                      <div>رقم التقرير: {windowInfo.code}</div>
                    </div>
                  </div>

                  {/* ---------------- 6-5: كشف حساب محلات كراتين ---------------- */}
                  {activeMode === 'w_rep_kratin_account' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-8">م</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-24">التاريخ</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1">البيان والحركة</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-32">محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-28">مسحوبات مسددة (مدين)</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-28">قيمة كراتين موردة (دائن)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredWithdrawals.map((w, idx) => (
                            <tr key={`w-${idx}`} className="bg-rose-50/40">
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{w.trans_date}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">
                                سداد مسحوبات نقدية ({w.pay_type}) - {w.doc_no || 'سند'}
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center text-xs">{w.shop_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-rose-700">
                                {Number(w.amount).toLocaleString()} ج.م
                              </td>
                              <td className="px-2 py-1 text-center font-mono text-slate-400">---</td>
                            </tr>
                          ))}
                          {filteredDisbursements.map((d, idx) => (
                            <tr key={`d-${idx}`} className="bg-emerald-50/40">
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">
                                {filteredWithdrawals.length + idx + 1}
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{d.trans_date}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">
                                توريد كراتين لمورد: {d.sup_name} - ({d.pack_name})
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center text-xs">{d.shop_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-slate-400">---</td>
                              <td className="px-2 py-1 text-center font-mono font-bold text-emerald-800">
                                {Number(d.total_amount).toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-6: كشف حساب جميع محلات الكراتين ---------------- */}
                  {activeMode === 'w_rep_all_kratin_accounts' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-12">كود</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1">اسم محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 w-48">العنوان</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-28">الهاتف</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-36">إجمالي المسحوبات المسددة</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-36">إجمالي قيمة التوريدات</th>
                            <th className="px-2 py-1 text-center w-36">الرصيد الصافي المتبقي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {allShopsSummary.map((shop, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold">{shop.shop_code}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">{shop.shop_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-xs">{shop.address}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{shop.mobile}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-rose-700">
                                {shop.totalWithdrawn.toLocaleString()} ج.م
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-emerald-800">
                                {shop.totalSupplied.toLocaleString()} ج.م
                              </td>
                              <td className={`px-2 py-1 text-center font-mono font-bold ${
                                shop.netBalance > 0 ? 'text-blue-900' : 'text-slate-700'
                              }`}>
                                {shop.netBalance.toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-7: تقرير مستلزمات التعبئة لمورد إجمالي ---------------- */}
                  {activeMode === 'w_rep_sup_packaging_total' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-8">م</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-20">التاريخ</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-40">اسم المورد</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-40">المزرعة</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1">النقلة / وجهة الخصم</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-32">محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-24">إجمالي العبوات</th>
                            <th className="px-3 py-1 text-left w-36">إجمالي التكلفة (ج.م)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredDisbursements.map((d, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{d.trans_date}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">{d.sup_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs">{d.farm_name || '---'}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-blue-900">
                                {d.deducted_from_nakla ? `مخصوم على: ${d.nakla_name}` : 'معلق على الحساب العام'}
                              </td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center text-xs">{d.shop_name || '---'}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-emerald-800">{d.qty}</td>
                              <td className="px-3 py-1 text-left font-mono font-bold text-slate-900">
                                {Number(d.total_amount).toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-8: تقرير مستلزمات التعبئة لمورد تفصيلي ---------------- */}
                  {activeMode === 'w_rep_sup_packaging_detail' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-8">م</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-20">التاريخ</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-32">المورد</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-36">النقلة</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-32">محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1">اسم مستلزم التعبئة</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-16">العدد</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-20">سعر الوحدة</th>
                            <th className="px-3 py-1 text-left w-28">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredDisbursements.map((d, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{d.trans_date}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">{d.sup_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs text-blue-900 font-semibold">{d.nakla_name || 'حساب عام'}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center text-xs">{d.shop_name || '---'}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs font-bold text-emerald-900">{d.pack_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold">{d.qty}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{d.unit_price}</td>
                              <td className="px-3 py-1 text-left font-mono font-bold text-blue-900">
                                {Number(d.total_amount).toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-9: وضع الشركة بالنسبة للموردين ومحلات الكراتين ---------------- */}
                  {activeMode === 'w_rep_company_packaging_status' && (
                    <div className="p-4 flex flex-col gap-4">
                      {/* بطاقات المؤشرات المالية للشركة */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-rose-50 border-2 border-rose-200 p-3 text-right rounded">
                          <span className="text-xs font-bold text-rose-900 block">إجمالي مسحوبات موردي ومحلات الكراتين</span>
                          <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
                            {companyPackagingStatus.totalWithdrawnToBoxShops.toLocaleString()} ج.م
                          </span>
                          <span className="text-[10px] text-slate-500">المبالغ المدفوعة نقدياً أو بشيكات للمحلات</span>
                        </div>

                        <div className="bg-emerald-50 border-2 border-emerald-200 p-3 text-right rounded">
                          <span className="text-xs font-bold text-emerald-900 block">إجمالي ما تم صرفه لموردي الفاكهة</span>
                          <span className="text-xl font-black font-mono text-emerald-800 mt-1 block">
                            {companyPackagingStatus.totalDisbursedToFruitSups.toLocaleString()} ج.م
                          </span>
                          <span className="text-[10px] text-slate-500">تكلفة الكراتين المطالب بها موردو الفاكهة</span>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-200 p-3 text-right rounded">
                          <span className="text-xs font-bold text-blue-900 block">صافي موقف الشركة</span>
                          <span className="text-xl font-black font-mono text-blue-900 mt-1 block">
                            {companyPackagingStatus.netDifference.toLocaleString()} ج.م
                          </span>
                          <span className="text-[10px] text-slate-500">الفارق بين المصروف للموردين والمسدد للمحلات</span>
                        </div>
                      </div>

                      {/* جدول مقارنة لكل محل كراتين */}
                      <table className="w-full border-collapse text-xs font-sans text-right border border-slate-300">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 font-bold">
                            <th className="border-l border-slate-300 px-3 py-1.5">محل الكراتين</th>
                            <th className="border-l border-slate-300 px-3 py-1.5 text-center">المسدد له نقداً</th>
                            <th className="border-l border-slate-300 px-3 py-1.5 text-center">المصروف منه لموردي الفاكهة</th>
                            <th className="px-3 py-1.5 text-center">صافي الرصيد المستحق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {allShopsSummary.map((s, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border-l border-slate-300 px-3 py-1.5 font-bold">{s.shop_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1.5 text-center font-mono text-rose-700 font-bold">
                                {s.totalWithdrawn.toLocaleString()} ج.م
                              </td>
                              <td className="border-l border-slate-300 px-3 py-1.5 text-center font-mono text-emerald-800 font-bold">
                                {s.totalSupplied.toLocaleString()} ج.م
                              </td>
                              <td className="px-3 py-1.5 text-center font-mono text-blue-900 font-bold">
                                {s.netBalance.toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-10: تقرير مستلزمات التعبئة لمورد غير مخصوم على نقلة ---------------- */}
                  {activeMode === 'w_rep_sup_packaging_not_deducted' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-8">م</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-20">التاريخ</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-36">اسم المورد</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-36">المزرعة</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-40">محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1">بيان المستلزمات والعبوات</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-16">العدد</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 text-center w-28">المجموع (ج.م)</th>
                            <th className="px-2 py-1 text-center w-36">حالة التحميل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {unlinkedPackagingReport.map((d, idx) => (
                            <tr key={idx} className="bg-amber-50/50 hover:bg-amber-50">
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono">{d.trans_date}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">{d.sup_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs">{d.farm_name || '---'}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs font-semibold">{d.shop_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-xs">{d.pack_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-emerald-800">{d.qty}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-center font-mono font-bold text-rose-800">
                                {Number(d.total_amount).toLocaleString()} ج.م
                              </td>
                              <td className="px-2 py-1 text-center">
                                <span className="bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  لم تحمل على نقلة بعد
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ---------------- 6-11: تقرير جميع الموردين مع جميع محلات الكراتين ---------------- */}
                  {activeMode === 'w_rep_all_sups_packaging_not_deducted' && (
                    <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-xs font-sans text-right">
                        <thead>
                          <tr className="bg-[#cfd3db] text-slate-900 border-b border-[#7b838c] font-bold">
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-8">م</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-44">اسم مورد الفاكهة</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 w-48">محل الكراتين</th>
                            <th className="border-l border-[#a0a0a0] px-2 py-1 text-center w-24">إجمالي العبوات</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 text-center w-28">إجمالي القيمة</th>
                            <th className="border-l border-[#a0a0a0] px-3 py-1 text-center w-28">المخصوم على نقلات</th>
                            <th className="px-3 py-1 text-center w-28">غير المخصوم (معلق)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {allSupsAllShopsMatrix.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono text-xs">{idx + 1}</td>
                              <td className="border-l border-slate-300 px-3 py-1 font-bold text-slate-900">{row.sup_name}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-slate-800">{row.shop_name}</td>
                              <td className="border-l border-slate-300 px-2 py-1 text-center font-mono font-bold text-emerald-800">{row.totalQty}</td>
                              <td className="border-l border-slate-300 px-3 py-1 text-center font-mono font-bold text-blue-900">
                                {row.totalAmount.toLocaleString()} ج.م
                              </td>
                              <td className="border-l border-slate-300 px-3 py-1 text-center font-mono text-emerald-800">
                                {row.deductedAmount.toLocaleString()} ج.م
                              </td>
                              <td className="px-3 py-1 text-center font-mono font-bold text-amber-800">
                                {row.pendingAmount.toLocaleString()} ج.م
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* إجماليات التقرير العامة */}
                  <div className="bg-[#cfd3db] p-2 border-t-2 border-slate-700 flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>
                      إجمالي عدد السجلات بالتقرير:{' '}
                      <span className="font-mono text-blue-900">
                        {activeMode === 'w_rep_kratin_account'
                          ? filteredWithdrawals.length + filteredDisbursements.length
                          : activeMode === 'w_rep_all_kratin_accounts'
                          ? allShopsSummary.length
                          : activeMode === 'w_rep_sup_packaging_not_deducted'
                          ? unlinkedPackagingReport.length
                          : activeMode === 'w_rep_all_sups_packaging_not_deducted'
                          ? allSupsAllShopsMatrix.length
                          : filteredDisbursements.length}
                      </span>
                    </span>
                    <span>
                      سوق الجملة 6 أكتوبر - إدارة مستلزمات التعبئة والكراتين
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. شريط الحالة السفلي الكلاسيكي (Status Bar) */}
        <div className="h-6 bg-[#cfd3db] border-t border-[#808080] px-2 flex items-center justify-between text-[11px] text-slate-800 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            <span className="font-sans font-bold">{statusMessage}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>DataWindow: [{windowInfo.dw}]</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">NUM</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">CAPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
