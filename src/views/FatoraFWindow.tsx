import React, { useState, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import { FatoraF, Nakla, NaklaCat, Customer, Category, PackRahn } from '../types/schema';
import {
  Printer,
  Trash2,
  Minus,
  Square,
  X,
  AlertTriangle
} from 'lucide-react';

interface FatoraFWindowProps {
  mode?: 'w_fatora_f' | 'w_fatora_f_mahel' | string;
  initialNaklaId?: number;
  onClose?: () => void;
  onPrintFatora?: (fatora: FatoraF) => void;
}

export interface InvoiceGridRow {
  id?: number;
  tempId: string;
  rowNum: number;          // م
  avgWeight: number;       // م/وزن (netWeight / count)
  rahnCase: number;        // حالة الرهن (1 أو 0)
  rahn: number;            // قيمة رهن العبوة الواحدة (ldec_rahny)
  tRahn: number;           // مبلغ الرهن الكلي = count * rahn
  count: number;           // عدد (sobata_num)
  catId: number;           // كود الصنف (cat_id)
  catName: string;         // الصنف (cat_name)
  unit: string;            // وحدة البيع (package_unit)
  tWeight: number;         // ك.قائم (t_weight)
  samah: number;           // سماح (samah_weight)
  netWeight: number;       // ك.صافي (net_weight)
  price: number;           // السعر (price)
  byaaa: number;           // مبلغ البياعة (byaaa)
  tota: number;            // مبلغ الزرع الصافي = (price * (unit === 'كيلو' ? netWeight : count)) + byaaa
  totally: number;         // الإجمالي الكلي = tota + tRahn
  total: number;           // للتوافق مع شاشات أخرى
  isCash: boolean;         // نقدي (cash)
  custCode: number;        // كود الزبون (customer_code)
  custName: string;        // الزبون (customer_name)
  transDate: string;       // التاريخ (trans_date)
  isSaved?: boolean;
}

/**
 * تطبيق منطق PowerBuilder المباشر:
 * حدث EditChanged و ItemChanged في جدول المبيعات dw_3
 * الكود البرمجي الأصلي لشاشة 7-1 تسجيل المبيعات مع دعم التنبيهات
 */
export function applyPowerBuilderItemChanged(
  currentRow: InvoiceGridRow,
  colName: string,
  dw5: NaklaCat[],
  customers: Customer[],
  allCategories?: Category[],
  allPackRahns?: PackRahn[]
): { updatedRow: InvoiceGridRow; warningMessage?: string } {
  const row = { ...currentRow };
  let warningMessage: string | undefined;

  // ==========================================================
  // أولاً: معالجة التبديل (كود / اسم) للصنف والعميل
  // CHOOSE CASE ls_colname
  // ==========================================================
  switch (colName) {
    // 1. عند إدخال أو تعديل "كود الصنف" (cat_id)
    case 'cat_id': {
      const ll_cat_id = Number(row.catId) || 0;
      if (ll_cat_id > 0) {
        const found = dw5.find(c => c.cat_id === ll_cat_id);
        if (found) {
          row.catName = found.cat_name;
        } else {
          // فحص الدليل العام للأصناف
          const generalCat = allCategories?.find(c => c.cat_code === ll_cat_id || c.id === ll_cat_id);
          if (generalCat) {
            row.catName = generalCat.cat_name;
            warningMessage = `⚠️ تنبيه: الصنف [${generalCat.cat_name}] غير موجود في أصناف هذه النقلة!`;
          } else {
            // لو مش موجود في أصناف النقلة، نحط الكود كاسم صنف مؤقتاً
            row.catName = String(ll_cat_id);
            warningMessage = `⚠️ تنبيه: كود الصنف (${ll_cat_id}) غير مسجل في أصناف هذه النقلة!`;
          }
        }
      }
      break;
    }

    // 2. عند إدخال أو تعديل "اسم الصنف" (cat_name)
    case 'cat_name': {
      const ls_input_cat_name = (row.catName || '').trim();
      if (ls_input_cat_name !== '') {
        const found = dw5.find(c => c.cat_name.trim() === ls_input_cat_name);
        if (found) {
          row.catId = found.cat_id;
        } else {
          const generalCat = allCategories?.find(c => c.cat_name.trim() === ls_input_cat_name);
          if (generalCat) {
            row.catId = generalCat.cat_code || generalCat.id;
          }
          warningMessage = `⚠️ تنبيه: الصنف [${ls_input_cat_name}] غير موجود في أصناف هذه النقلة!`;
        }
      }
      break;
    }

    // 3. عند إدخال أو تعديل "كود العميل" (customer_code)
    case 'customer_code': {
      const ll_cust_code = Number(row.custCode) || 0;
      if (ll_cust_code > 0) {
        if (ll_cust_code === 1) {
          row.custName = 'نقدي';
          row.isCash = true;
        } else {
          const found = customers.find(c => c.customer_code === ll_cust_code);
          if (found) {
            row.custName = found.customer_name;
            row.isCash = false;
          } else {
            // لو كود العميل خطأ، نحطه في خانة اسم العميل مؤقتاً زي الصنف بالظبط
            row.custName = String(ll_cust_code);
            warningMessage = `⚠️ تنبيه: كود العميل (${ll_cust_code}) غير مسجل في دليل العملاء!`;
          }
        }
      }
      break;
    }

    // 4. عند إدخال أو تعديل "اسم العميل" (customer_name)
    case 'customer_name': {
      const ls_input_cust_name = (row.custName || '').trim();
      if (ls_input_cust_name === 'نقدي') {
        row.custCode = 1;
        row.isCash = true;
      } else if (ls_input_cust_name !== '') {
        const found = customers.find(c => c.customer_name.trim() === ls_input_cust_name);
        if (found) {
          row.custCode = found.customer_code;
          row.isCash = false;
        }
      }
      break;
    }
  }

  // ==========================================================
  // ثانياً: كود الحسابات والأوزان الخاص بك كاملاً
  // ==========================================================
  let ll_cat = Number(row.catId) || 0;
  if (ll_cat <= 0 && row.catName) {
    const foundByNm = dw5.find(c => c.cat_name.trim() === row.catName.trim()) ||
                      allCategories?.find(c => c.cat_name.trim() === row.catName.trim());
    if (foundByNm) {
      ll_cat = (foundByNm as any).cat_id || (foundByNm as any).cat_code || (foundByNm as any).id || 0;
      row.catId = ll_cat;
    }
  }

  // 2. إذا لم يقم المستخدم بإدخال كود الصنف أو اسمه بعد، لا تنفذ الكود
  if (!ll_cat || ll_cat <= 0) {
    return { updatedRow: row, warningMessage };
  }

  const ls_customer_name = (row.custName || '').trim();
  const ls_pack = row.unit || 'كيلو';
  const ldec_p = Number(row.price) || 0;
  const ldec_n = Number(row.count) || 0;

  // أ. التحقق من حالة الزبون (خاص/special) وبياعته الخاصة (byaaa_c_s) من جدول الزبائن
  let li_special = 0;
  let ldec_by_cust_s = 0;
  let has_cust_special_byaaa = false;

  const hasCustomer = (ls_customer_name !== '' && ls_customer_name !== 'نقدي') || (Number(row.custCode) > 1);
  if (hasCustomer) {
    const cust = customers.find(
      c => (ls_customer_name !== '' && c.customer_name.trim() === ls_customer_name) ||
           (Number(row.custCode) > 1 && Number(c.customer_code) === Number(row.custCode))
    );
    if (cust) {
      li_special = cust.special ? 1 : 0;
      // إذا كان الزبون خاصاً (خاص = true) ومحدد له بياعة، فإن بياعته الخاصة لها الأولوية المطلقة في احتساب الفاتورة
      if (cust.special && cust.byaaa_c_s !== undefined && cust.byaaa_c_s !== null && !isNaN(Number(cust.byaaa_c_s))) {
        ldec_by_cust_s = Number(cust.byaaa_c_s);
        has_cust_special_byaaa = true;
      }
    }
  }

  // 3. البحث عن الصنف والبياعة داخل dw_5 مباشرة
  const foundItem = dw5.find(c => c.cat_id === ll_cat);
  let ldec_bya = 0;
  let ls_cat_name = String(ll_cat);
  let ldec_rahny = 0;

  if (foundItem) {
    // إذا كان العميل خاصاً فله الأولوية المطلقة، وإلا يؤخذ من الصنف
    if (has_cust_special_byaaa) {
      ldec_bya = ldec_by_cust_s;
    } else if (li_special === 1) {
      ldec_bya = Number(foundItem.cat_byaaa_s) || Number(foundItem.cat_byaaa) || 0;
    } else {
      ldec_bya = Number(foundItem.cat_byaaa) || 0;
    }
    ls_cat_name = foundItem.cat_name;
    if (colName === 'cat_id' || colName === 'cat_name') {
      if (foundItem.package_unit) {
        row.unit = foundItem.package_unit;
      }
      ldec_rahny = Number(foundItem.pack_rahn) || 0;
    } else if (colName === 'package_unit') {
      // إذا قام بتغيير العبوة، جلب رهنها من تسجيل الرهن
      const pkg = (row.unit || '').trim();
      const foundPack = allPackRahns?.find(p => p.pack_name.trim() === pkg);
      if (foundPack && foundPack.pack_rahn !== undefined) {
        ldec_rahny = Number(foundPack.pack_rahn) || 0;
      } else if (pkg.includes('كبير')) {
        ldec_rahny = 100;
      } else if (pkg.includes('وسط') || pkg.includes('متوسط')) {
        ldec_rahny = 80;
      } else if (pkg.includes('صغير')) {
        ldec_rahny = 60;
      } else if (pkg.includes('شبك')) {
        ldec_rahny = 0;
      } else {
        ldec_rahny = Number(foundItem.pack_rahn) || 0;
      }
    } else {
      ldec_rahny = row.rahn !== undefined ? Number(row.rahn) : (Number(foundItem.pack_rahn) || 0);
    }
  } else {
    // الصنف مش موجود في النقلة: فحص الدليل العام للأصناف
    const genCat = allCategories?.find(c => c.cat_code === ll_cat || c.id === ll_cat);
    if (genCat) {
      ls_cat_name = genCat.cat_name;
      if (has_cust_special_byaaa) {
        ldec_bya = ldec_by_cust_s;
      } else if (li_special === 1) {
        ldec_bya = Number(genCat.byaaa_s) || Number(genCat.byaaa) || 0;
      } else {
        ldec_bya = Number(genCat.byaaa) || 0;
      }
    } else {
      ls_cat_name = row.catName || String(ll_cat);
      ldec_bya = has_cust_special_byaaa ? ldec_by_cust_s : 0;
    }
    
    // فحص رهن العبوة من تسجيل الرهن
    const pkg = (row.unit || '').trim();
    const foundPack = allPackRahns?.find(p => p.pack_name.trim() === pkg);
    if (foundPack && foundPack.pack_rahn !== undefined) {
      ldec_rahny = Number(foundPack.pack_rahn) || 0;
    } else if (pkg.includes('كبير')) {
      ldec_rahny = 100;
    } else if (pkg.includes('وسط') || pkg.includes('متوسط')) {
      ldec_rahny = 80;
    } else if (pkg.includes('صغير')) {
      ldec_rahny = 60;
    } else {
      ldec_rahny = 0;
    }

    if (!warningMessage) {
      warningMessage = `⚠️ تنبيه: الصنف [${ls_cat_name}] غير موجود في أصناف هذه النقلة!`;
    }
  }

  // تعيين قيمة رهن العبوة
  row.rahn = ldec_rahny;
  if (ldec_rahny > 0) {
    row.rahnCase = 1;
  } else {
    row.rahnCase = 0;
  }

  // ب. الأولوية المطلقة للبياعة الخاصة بالزبون في حالة اختياره
  if (has_cust_special_byaaa) {
    ldec_bya = ldec_by_cust_s;
  }

  // 4. تحديث اسم الصنف وقيمة البياعة للسطر الحالي
  if (foundItem) {
    row.catName = ls_cat_name;
  }

  // حساب مبلغ البياعة = العدد مضروباً في قيمة البياعة المحددة (مخفية وتُضاف للإجمالي)
  const ldec_byaw = Math.round(ldec_n * ldec_bya * 100) / 100;
  row.byaaa = ldec_byaw;

  // 5. حساب الوزن ومبلغ الزرع الصافي (tota) حسب وحدة التعبئة
  let ldec_nw = 0;
  let ldec_tota = 0;

  const ldec_bw = Number(row.tWeight) || 0;
  const ldec_fw = Number(row.samah) || 0;

  if (ldec_bw > 0) {
    ldec_nw = Math.max(0, ldec_bw - ldec_fw);
  } else if (Number(row.netWeight) > 0) {
    ldec_nw = Number(row.netWeight);
  }

  // دائماً يتم حساب الوزن الصافي إذا تم إدخال أوزان أو كانت الوحدة بالكيلو
  if (ldec_nw > 0 || ls_pack === 'كيلو') {
    row.netWeight = ldec_nw;
    ldec_tota = Math.round(((ldec_p * ldec_nw) + ldec_byaw) * 100) / 100;
  } else {
    row.netWeight = 0;
    ldec_tota = Math.round(((ldec_n * ldec_p) + ldec_byaw) * 100) / 100;
  }

  // 6. حساب قيمة الرهن ومبلغ الرهن الكلي (t_rahn)
  // الرهن لا يظهر في الجدول، بل يُضرب في العدد ويُضاف للإجمالي آلياً
  const ldec_t_rahn = Math.round(ldec_rahny * ldec_n * 100) / 100;
  row.tRahn = ldec_t_rahn;

  // 7. حساب الإجمالي الكلي (totally) = صافي الزرع (tota) + مبلغ الرهن (t_rahn)
  const ldec_eg = Math.round((ldec_tota + ldec_t_rahn) * 100) / 100;
  row.totally = ldec_eg;
  row.tota = ldec_tota;
  row.total = ldec_eg;

  // متوسط الوزن
  row.avgWeight = ldec_n > 0 ? Number((ldec_nw / ldec_n).toFixed(2)) : 0;

  return { updatedRow: row, warningMessage };
}

export const FatoraFWindow: React.FC<FatoraFWindowProps> = ({
  mode = 'w_fatora_f',
  initialNaklaId,
  onClose,
  onPrintFatora
}) => {
  const [db, setDb] = useState(wholesaleStore.getState());
  const [activeMode, setActiveMode] = useState<'w_fatora_f' | 'w_fatora_f_mahel'>(
    mode === 'w_fatora_f_mahel' ? 'w_fatora_f_mahel' : 'w_fatora_f'
  );

  useEffect(() => {
    if (mode === 'w_fatora_f_mahel') {
      setActiveMode('w_fatora_f_mahel');
    } else {
      setActiveMode('w_fatora_f');
    }
  }, [mode]);

  // الاشتراك في تحديثات قاعدة البيانات
  useEffect(() => {
    return wholesaleStore.subscribe(() => {
      setDb(wholesaleStore.getState());
    });
  }, []);

  // 1. تحديد النقلة الحالية المختارة
  const naklatList = db.naklat && db.naklat.length > 0 ? db.naklat : [];
  const [currentNaklaIndex, setCurrentNaklaIndex] = useState<number>(() => {
    if (initialNaklaId) {
      const idx = naklatList.findIndex(n => n.nakla_id === initialNaklaId);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const currentNakla: Nakla = naklatList[currentNaklaIndex] || {
    nakla_id: 0,
    nakla_number: 0,
    sup_name: '',
    farm_name: '',
    nakla_name: '',
    nakla_weight: 0,
    sobata_number: 0,
    nakla_date: new Date().toISOString().split('T')[0],
    comission: 0.1,
    byaaa: 0,
    tanzil: 0,
    wahba: 0,
    nakla_finish: false,
    nakla_sarf: false,
    printed: false
  };

  // أصناف النقلة الحالية المستلمة (للجدول الأيسر dw_5 في فورم 7-1)
  const currentNaklaCats: NaklaCat[] = currentNakla.nakla_id > 0
    ? db.nakla_cats.filter(c => c.nakla_id === currentNakla.nakla_id)
    : [];

  const displayCats = currentNaklaCats;
  const totalReceivedPackages = displayCats.reduce((sum, c) => sum + (c.cat_number || 0), 0);

  // الأصناف الأخرى في الدليل العام التي ليست بالنقلة
  const naklaCatIds = new Set(displayCats.map(c => c.cat_id));
  const otherCats = (db.categories || []).filter(c => !naklaCatIds.has(c.cat_code));

  // إعدادات الشاشة
  const [selectedDate, setSelectedDate] = useState<string>('2026/10/14');
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [globalCash, setGlobalCash] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // سطور جدول المبيعات (DataWindow dw_3)
  const [rows, setRows] = useState<InvoiceGridRow[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  const createNewEmptyRow = (rowNum: number): InvoiceGridRow => {
    const defaultCat = displayCats[0] || {
      cat_id: 101,
      cat_name: 'طماطم بلدي نمرة 1',
      package_unit: 'كيلو',
      pack_rahn: 60,
      cat_byaaa: 1.5,
      cat_byaaa_s: 1.0
    };

    const initialRow: InvoiceGridRow = {
      tempId: `row_${Date.now()}_${Math.random()}`,
      rowNum,
      avgWeight: 0,
      rahnCase: (defaultCat.pack_rahn || 0) > 0 ? 1 : 0,
      rahn: defaultCat.pack_rahn || 0,
      tRahn: 0,
      count: 0,
      catId: defaultCat.cat_id,
      catName: defaultCat.cat_name,
      unit: defaultCat.package_unit || 'كيلو',
      tWeight: 0,
      samah: 0,
      netWeight: 0,
      price: 0,
      byaaa: 0,
      tota: 0,
      totally: 0,
      total: 0,
      isCash: globalCash,
      custCode: globalCash ? 1 : 0,
      custName: globalCash ? 'نقدي' : '',
      transDate: selectedDate,
      isSaved: false
    };

    const { updatedRow } = applyPowerBuilderItemChanged(
      initialRow,
      'cat_id',
      displayCats,
      db.customers,
      db.categories
    );
    return updatedRow;
  };

  const loadNaklaInvoices = (naklaId: number) => {
    const existingInvoices = db.fatora_f.filter(f => f.nakla_id === naklaId);

    if (existingInvoices.length > 0) {
      const mappedRows: InvoiceGridRow[] = existingInvoices.map((inv, idx) => ({
        id: inv.id,
        tempId: `saved_${inv.id}_${idx}`,
        rowNum: idx + 1,
        avgWeight: inv.sobata_num > 0 ? Number((inv.net_weight / inv.sobata_num).toFixed(2)) : 0,
        rahnCase: inv.rahn_case ? 1 : 0,
        rahn: inv.rahn || 0,
        tRahn: inv.t_rahn || 0,
        count: inv.sobata_num,
        catId: inv.cat_id,
        catName: inv.cat_name,
        unit: inv.package_unit || 'كيلو',
        tWeight: inv.t_weight,
        samah: inv.samah_weight,
        netWeight: inv.net_weight,
        price: inv.price,
        byaaa: inv.byaaa || 0,
        tota: inv.tota || inv.totally,
        totally: inv.totally,
        total: inv.totally,
        isCash: inv.cash,
        custCode: inv.customer_code,
        custName: inv.customer_name,
        transDate: inv.trans_date || selectedDate,
        isSaved: true
      }));
      setRows(mappedRows);
      setSelectedRowIndex(mappedRows.length - 1);
    } else {
      setRows([createNewEmptyRow(1)]);
      setSelectedRowIndex(0);
    }
  };

  // تحميل سطور النقلة الحالية أو تجهيز سطور افتراضية
  useEffect(() => {
    loadNaklaInvoices(currentNakla.nakla_id);
  }, [currentNakla.nakla_id, activeMode]);

  // دالة التعامل مع أحداث EditChanged و ItemChanged لجدول dw_3
  const handleItemChanged = (rowIndex: number, colName: string, value: any) => {
    setRows(prevRows => {
      const updated = [...prevRows];
      const currentRow = { ...updated[rowIndex] };

      // تحديث الحقل المباشر أولاً
      switch (colName) {
        case 'cat_id':
          currentRow.catId = Number(value) || 0;
          break;
        case 'cat_name':
          currentRow.catName = String(value);
          break;
        case 'customer_code':
          currentRow.custCode = Number(value) || 0;
          break;
        case 'customer_name':
          currentRow.custName = String(value);
          break;
        case 'package_unit':
          currentRow.unit = String(value);
          break;
        case 'price':
          currentRow.price = Number(value) || 0;
          break;
        case 'sobata_num':
          currentRow.count = Number(value) || 0;
          break;
        case 't_weight':
          currentRow.tWeight = Number(value) || 0;
          if (currentRow.tWeight > 0 && currentRow.unit !== 'كيلو') {
            currentRow.unit = 'كيلو';
          }
          break;
        case 'samah_weight':
          currentRow.samah = Number(value) || 0;
          break;
        case 'rahn_case':
          currentRow.rahnCase = value ? 1 : 0;
          break;
        case 'cash':
          currentRow.isCash = Boolean(value);
          if (value) {
            currentRow.custCode = 1;
            currentRow.custName = 'نقدي';
          }
          break;
        case 'trans_date':
          currentRow.transDate = String(value);
          break;
      }

      // تطبيق كود الباور بيلدر الأصلي واسترجاع التحذيرات إن وجدت
      const { updatedRow, warningMessage } = applyPowerBuilderItemChanged(
        currentRow,
        colName,
        displayCats,
        db.customers,
        db.categories,
        db.pack_rahns
      );

      if (warningMessage) {
        showNotice(warningMessage, 'warning');
      }

      updated[rowIndex] = updatedRow;
      return updated;
    });
  };

  // زر الإضافة (+)
  const handleAddRow = () => {
    const newRow = createNewEmptyRow(rows.length + 1);
    setRows(prev => [...prev, newRow]);
    setSelectedRowIndex(rows.length);
    showNotice('تمت إضافة سطر مبيعات جديد (+)', 'success');
  };

  // زر الحذف (-)
  const handleRemoveRow = () => {
    if (rows.length === 0) return;
    const targetIndex =
      selectedRowIndex >= 0 && selectedRowIndex < rows.length
        ? selectedRowIndex
        : rows.length - 1;
    const targetRow = rows[targetIndex];

    if (targetRow.id) {
      wholesaleStore.deleteFatoraF(targetRow.id);
    }

    const nextRows = rows
      .filter((_, idx) => idx !== targetIndex)
      .map((r, i) => ({ ...r, rowNum: i + 1 }));
    setRows(nextRows);
    setSelectedRowIndex(Math.max(0, targetIndex - 1));
    showNotice(`تم حذف السطر رقم ${targetRow.rowNum} (-)`, 'success');
  };

  // زر حفظ الفاتورة (حفظ)
  const handleSaveInvoice = () => {
    const validRows = rows.filter(r => r.count > 0 && r.price > 0);
    if (validRows.length === 0) {
      showNotice('لا توجد صفوف مكتملة البيانات للحفظ! (تأكد من إدخال العدد والسعر)', 'warning');
      return;
    }

    // فحص الأصناف غير الموجودة بالنقلة لتنبيه المستخدم
    const missingCats = validRows.filter(r => !displayCats.some(c => c.cat_id === r.catId));
    if (missingCats.length > 0) {
      showNotice(`⚠️ تنبيه: تم حفظ الفاتورة مع وجود (${missingCats.length}) صنف غير مسجل في أصناف النقلة!`, 'warning');
    }

    validRows.forEach(r => {
      if (!r.isSaved || !r.id) {
        const saved = wholesaleStore.addFatoraF({
          nakla_id: activeMode === 'w_fatora_f_mahel' ? 999 : currentNakla.nakla_id,
          nakla_name:
            activeMode === 'w_fatora_f_mahel'
              ? 'مشتريات المحل 1'
              : currentNakla.nakla_name,
          sup_name:
            activeMode === 'w_fatora_f_mahel' ? 'المحل 1' : currentNakla.sup_name,
          farm_name:
            activeMode === 'w_fatora_f_mahel' ? 'المحل 1' : currentNakla.farm_name,
          cat_id: r.catId,
          cat_name: r.catName,
          package_unit: r.unit || 'كيلو',
          sobata_num: r.count,
          t_weight: r.tWeight,
          samah_weight: r.samah,
          net_weight: r.netWeight,
          price: r.price,
          totally: r.totally,
          byaaa: r.byaaa,
          rahn_case: r.rahnCase === 1,
          rahn: r.rahn,
          t_rahn: r.tRahn,
          tota: r.tota,
          cash: r.isCash,
          customer_name: r.custName || (r.isCash ? 'نقدي' : 'عميل عام'),
          customer_code: r.custCode || (r.isCash ? 1 : 504),
          trans_date: r.transDate || selectedDate
        });
        r.id = saved.id;
        r.isSaved = true;
      }
    });

    setRows([...rows]);
    showNotice(`تم حفظ بيانات المبيعات بنجاح في قاعدة البيانات (${validRows.length} سطر)`, 'success');
  };

  const showNotice = (text: string, type: 'success' | 'warning') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // التنقل بين النقلات (<< و >>)
  const handlePrevNakla = () => {
    if (naklatList.length === 0) return;
    const prevIdx = (currentNaklaIndex - 1 + naklatList.length) % naklatList.length;
    setCurrentNaklaIndex(prevIdx);
  };

  const handleNextNakla = () => {
    if (naklatList.length === 0) return;
    const nextIdx = (currentNaklaIndex + 1) % naklatList.length;
    setCurrentNaklaIndex(nextIdx);
  };

  // مجاميع التذييل (Footer Summary)
  const totalCountToday = rows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
  const totalTWeightToday = rows.reduce((sum, r) => sum + (Number(r.tWeight) || 0), 0);
  const totalSamahToday = rows.reduce((sum, r) => sum + (Number(r.samah) || 0), 0);
  const totalNetWeightToday = rows.reduce((sum, r) => sum + (Number(r.netWeight) || 0), 0);
  const totalAmountToday = rows.reduce((sum, r) => sum + (Number(r.totally) || 0), 0);
  const totalByaaaToday = rows.reduce((sum, r) => sum + (Number(r.byaaa) || 0), 0);
  const totalRahnToday = rows.reduce((sum, r) => sum + (Number(r.tRahn) || 0), 0);
  const weightedAvgWeight = totalCountToday > 0 ? (totalNetWeightToday / totalCountToday).toFixed(2) : '0.00';

  const prevCount = 0;
  const prevTWeight = 0;
  const prevSamah = 0;
  const prevNetWeight = 0;
  const prevAmount = 0;

  const grandCount = totalCountToday + prevCount;
  const grandTWeight = totalTWeightToday + prevTWeight;
  const grandSamah = totalSamahToday + prevSamah;
  const grandNetWeight = totalNetWeightToday + prevNetWeight;
  const grandAmount = totalAmountToday + prevAmount;

  return (
    <div
      className="w-full flex flex-col justify-start items-center p-2 bg-[#8c949d] select-none font-sans overflow-auto min-h-[calc(100vh-120px)]"
      dir="rtl"
    >
      {/* إطار نافذة الباور بيلدر MDI Child Window */}
      <div className="w-full max-w-[1440px] bg-[#9fa6ad] border-2 border-t-[#e0e0e0] border-l-[#e0e0e0] border-b-[#404040] border-r-[#404040] shadow-2xl flex flex-col my-auto text-xs">
        
        {/* 1. شريط عنوان النافذة (Title Bar) */}
        <div className="h-6 bg-[#cfd3db] flex items-center justify-between px-1.5 border-b border-[#a0a0a0]">
          {/* أزرار التحكم في النافذة على اليمين */}
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

          {/* اسم النافذة ورمزها */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-800 font-bold text-[12px] tracking-wide">
              {activeMode === 'w_fatora_f_mahel' ? 'مبيعات مشتريات المحل' : 'المبيعات'}
            </span>
            <span className="bg-amber-300 text-slate-950 font-mono font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-500 shadow-2xs">
              {activeMode === 'w_fatora_f_mahel' ? '7-2' : '7-1'}
            </span>
            <div className="w-3.5 h-3.5 rounded-full border border-slate-500 bg-gradient-to-tr from-slate-400 to-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            </div>
          </div>
        </div>

        {/* شريط التبديل السريع ومعلومات DataWindows */}
        <div className="bg-[#b9c3cc] px-2 py-0.5 border-b border-[#7b838c] flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('w_fatora_f')}
              className={`px-3 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors ${
                activeMode === 'w_fatora_f'
                  ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                  : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
              }`}
            >
              7-1 تسجيل مبيعات النقلة (dw_3)
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('w_fatora_f_mahel')}
              className={`px-3 py-0.5 border border-t-white border-l-white border-b-[#404040] border-r-[#404040] transition-colors ${
                activeMode === 'w_fatora_f_mahel'
                  ? 'bg-[#d8ecd8] text-slate-950 font-extrabold shadow-inner'
                  : 'bg-[#d4d0c8] text-slate-800 hover:bg-white'
              }`}
            >
              7-2 مبيعات مشتريات المحل
            </button>
          </div>

          <div className="text-[10px] text-slate-700 font-mono flex items-center gap-2">
            <span className="text-emerald-800 font-bold">✓ خانة الوزن القائم مفتوحة</span>
            <span>|</span>
            <span>اختيار العميل والصنف متاح بالكود والقائمة المنسدلة</span>
          </div>
        </div>

        {/* تنبيه الإشعارات والتحذيرات البارز */}
        {notification && (
          <div
            className={`px-3 py-1.5 text-xs font-bold flex items-center justify-between border-b shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                : 'bg-amber-200 text-amber-950 border-amber-500 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
              ) : (
                <span className="text-emerald-700">✓</span>
              )}
              <span className="text-sm font-extrabold">{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-700 hover:text-black font-bold px-2 py-0.5 bg-white/60 hover:bg-white rounded border border-slate-300"
            >
              ✕ إغلاق
            </button>
          </div>
        )}

        {/* 2. جسم النافذة الرئيسي */}
        <div className="p-3 bg-[#9fa6ad] flex flex-col gap-2">
          
          {/* المنطقة العلوية: تختلف بين 7-1 و 7-2 */}
          {activeMode === 'w_fatora_f' ? (
            <div className="flex items-start gap-3">
              
              {/* ب) الجزء الأوسط والأيمن: خانة النقلة واليافطة الخضراء وشريط اليومية الفيروزي */}
              <div className="flex-1 flex flex-col gap-2">
                
                {/* السطر العلوي: النقلة على اليمين، اليافطة الخضراء بالوسط، وخانات الاختيار */}
                <div className="flex items-start justify-between gap-3">
                  
                  {/* صندوق اختيار النقلة في أقصى اليمين مع أزرار التنقل << و >> */}
                  <div className="w-56 shrink-0 flex flex-col">
                    <div className="bg-[#8ca8cb] border border-slate-600 px-2 py-0.5 text-center text-xs font-bold text-slate-900">
                      النقلة
                    </div>
                    <select
                      value={currentNakla.nakla_id}
                      onChange={e => {
                        const targetId = Number(e.target.value);
                        const idx = naklatList.findIndex(n => n.nakla_id === targetId);
                        if (idx >= 0) setCurrentNaklaIndex(idx);
                      }}
                      className="w-full bg-white border border-slate-500 px-1 py-0.5 text-center font-bold text-xs outline-none"
                    >
                      {naklatList.map((n, idx) => (
                        <option key={`fatora_nakla_${n.nakla_id}_${idx}`} value={n.nakla_id}>
                          {n.nakla_name}
                        </option>
                      ))}
                    </select>

                    {/* أزرار التنقل بين النقلات << و >> */}
                    <div className="flex items-center justify-between bg-[#cfd3db] border border-slate-400 px-2 py-0.5 mt-0.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={handlePrevNakla}
                        className="px-2 bg-[#d4d0c8] hover:bg-white border border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-mono active:border-t-slate-700 active:border-l-slate-700"
                        title="النقلة السابقة"
                      >
                        {'<<'}
                      </button>
                      <span className="font-mono text-[11px] text-slate-800">
                        {currentNaklaIndex + 1} / {naklatList.length || 1}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextNakla}
                        className="px-2 bg-[#d4d0c8] hover:bg-white border border-t-white border-l-white border-b-slate-700 border-r-slate-700 font-mono active:border-t-slate-700 active:border-l-slate-700"
                        title="النقلة التالية"
                      >
                        {'>>'}
                      </button>
                    </div>
                  </div>

                  {/* اليافطة الخضراء الفاتحة الكبيرة مع الإطار الأسود في الوسط ومربعات الاختيار */}
                  <div className="flex-1 flex items-center justify-center gap-4">
                    {/* اليافطة الخضراء الكبيرة */}
                    <div className="w-[420px] max-w-full h-12 bg-[#c9e8cd] border-2 border-black flex items-center justify-center px-4 shadow-sm">
                      <span className="text-2xl font-black text-slate-900 tracking-wide font-sans">
                        {currentNakla.nakla_name || ''}
                      </span>
                    </div>

                    {/* خانات الاختيار (اسعار و نقدي) بجوار اليافطة */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-900">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showPrices}
                          onChange={e => setShowPrices(e.target.checked)}
                          className="w-3.5 h-3.5 accent-slate-800"
                        />
                        <span>اسعار</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={globalCash}
                          onChange={e => setGlobalCash(e.target.checked)}
                          className="w-3.5 h-3.5 accent-slate-800"
                        />
                        <span>نقدي</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* السطر الأوسط: شريط ملخص بيانات النقلة ذو الخلفية الفيروزية مع خانة التاريخ */}
                <div className="flex items-center gap-2 mt-1">
                  {/* شريط بيانات النقلة الفيروزي المطابق تماماً للصورة 1 */}
                  <div className="flex-1 border border-slate-700 bg-[#006060] shadow-sm overflow-hidden">
                    <div className="grid grid-cols-9 bg-[#006b6b] text-white text-center text-[10.5px] font-bold border-b border-[#004d4d] py-0.5">
                      <div className="border-l border-[#004d4d]">اليومية</div>
                      <div className="border-l border-[#004d4d]">رقم</div>
                      <div className="border-l border-[#004d4d]">المورد</div>
                      <div className="border-l border-[#004d4d]">المزرعة</div>
                      <div className="border-l border-[#004d4d]">النقلة</div>
                      <div className="border-l border-[#004d4d]">عدد مستلم</div>
                      <div className="border-l border-[#004d4d]">التاريخ</div>
                      <div className="border-l border-[#004d4d]">عمولة</div>
                      <div>وهبة</div>
                    </div>
                    <div className="grid grid-cols-9 bg-[#007b89] text-white text-center text-xs font-bold py-1">
                      <div className="border-l border-[#005f6b] font-mono">{currentNakla.nakla_number || 1}</div>
                      <div className="border-l border-[#005f6b] font-mono">1</div>
                      <div className="border-l border-[#005f6b] truncate px-1">{currentNakla.sup_name}</div>
                      <div className="border-l border-[#005f6b] truncate px-1">{currentNakla.farm_name}</div>
                      <div className="border-l border-[#005f6b] truncate px-1">{currentNakla.nakla_name}</div>
                      <div className="border-l border-[#005f6b] font-mono">{totalReceivedPackages}</div>
                      <div className="border-l border-[#005f6b] font-mono">{currentNakla.nakla_date}</div>
                      <div className="border-l border-[#005f6b] font-mono">{currentNakla.comission}</div>
                      <div className="font-mono">{currentNakla.wahba}</div>
                    </div>
                  </div>

                  {/* خانة التاريخ */}
                  <div className="flex items-center bg-white border border-black shadow-inner px-1.5 py-0.5 text-xs font-mono font-bold shrink-0">
                    <input
                      type="text"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-24 text-center outline-none bg-transparent font-bold text-slate-900"
                    />
                  </div>

                </div>

              </div>

              {/* أ) جدول أصناف النقلة المستلمة في أقصى اليسار (dw_5) */}
              <div className="w-72 shrink-0 border-2 border-slate-700 bg-[#cbd5e1] shadow-md flex flex-col h-[135px] overflow-hidden">
                <div className="bg-[#6b829e] text-white text-[11px] font-bold px-2 py-0.5 flex items-center justify-between">
                  <span>أصناف النقلة المستلمة (dw_5)</span>
                  <span className="text-[10px] font-mono bg-amber-300 text-slate-900 px-1 rounded">انقر للإدراج</span>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="bg-[#8ca8cb] text-slate-900 font-bold border-b border-slate-400 text-[10.5px]">
                        <th className="py-0.5 px-1 text-center w-10 border-l border-slate-400">كود</th>
                        <th className="py-0.5 px-2 text-right border-l border-slate-400">الصنف</th>
                        <th className="py-0.5 px-1 text-center w-14 border-l border-slate-400">مستلم</th>
                        <th className="py-0.5 px-1 text-center w-12 border-l border-slate-400">بياعة</th>
                        <th className="py-0.5 px-1 text-center w-12">رهن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 text-[11px] font-bold text-slate-900">
                      {displayCats.map((cat, catIdx) => (
                        <tr
                          key={`dw5_cat_${cat.id}_${cat.cat_id}_${catIdx}`}
                          onClick={() => {
                            if (rows.length > 0 && selectedRowIndex >= 0 && selectedRowIndex < rows.length) {
                              handleItemChanged(selectedRowIndex, 'cat_id', cat.cat_id);
                              showNotice(`تم إدراج الصنف [${cat.cat_name}] في السطر ${selectedRowIndex + 1}`, 'success');
                            }
                          }}
                          className="hover:bg-blue-200 cursor-pointer transition-colors"
                          title={`انقر لتطبيق الصنف (كود: ${cat.cat_id} - رهن: ${cat.pack_rahn} - بياعة: ${cat.cat_byaaa})`}
                        >
                          <td className="py-0.5 border-l border-slate-300 font-mono text-slate-800">{cat.cat_id}</td>
                          <td className="py-0.5 px-2 border-l border-slate-300 text-right truncate">{cat.cat_name}</td>
                          <td className="py-0.5 border-l border-slate-300 font-mono">{cat.cat_number}</td>
                          <td className="py-0.5 border-l border-slate-300 font-mono text-[10px]">{cat.cat_byaaa}</td>
                          <td className="py-0.5 font-mono text-[10px] text-teal-800">{cat.pack_rahn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* --- تصميم الصورة 2 (مبيعات مشتريات المحل) --- */
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="w-56 shrink-0 flex flex-col">
                  <div className="bg-[#8ca8cb] border border-slate-600 px-2 py-0.5 text-center text-xs font-bold text-slate-900">
                    مبيع مشتريات المحل
                  </div>
                  <div className="bg-white border border-slate-500 py-1 text-center font-bold text-xs text-slate-900">
                    المحل 1
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="w-[420px] max-w-full h-12 bg-[#c9e8cd] border-2 border-black flex items-center justify-center px-4 shadow-sm">
                    <span className="text-2xl font-black text-slate-900 tracking-wide font-sans">
                      المحل 1
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-white border border-black shadow-inner px-1.5 py-0.5 text-xs font-mono font-bold shrink-0 self-start mt-2">
                  <input
                    type="text"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-24 text-center outline-none bg-transparent font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. منطقة جدول المبيعات الرئيسي DataWindow (dw_3) والأزرار الجانبية */}
          <div className="flex items-start gap-3 mt-1">
            
            {/* أزرار العمليات على اليمين: زر (+) وزر (-) وزر (حفظ الأخضر) */}
            <div className="flex flex-col items-center gap-2 pt-14 shrink-0">
              <button
                type="button"
                onClick={handleAddRow}
                title="إضافة سطر مبيعات جديد (+)"
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center font-black text-xl text-slate-900 shadow-sm active:border-t-black active:border-l-black cursor-pointer"
              >
                +
              </button>

              <button
                type="button"
                onClick={handleRemoveRow}
                title="حذف السطر المحدد (-)"
                className="w-10 h-8 bg-[#ece9d8] hover:bg-white active:bg-[#d8d4c4] border-2 border-t-white border-l-white border-b-black border-r-black flex items-center justify-center font-black text-xl text-slate-900 shadow-sm active:border-t-black active:border-l-black cursor-pointer"
              >
                -
              </button>

              <button
                type="button"
                onClick={handleSaveInvoice}
                title="حفظ الفاتورة في قاعدة البيانات"
                className="w-16 h-8 bg-[#d8ecd8] hover:bg-[#c6e4c6] active:bg-[#b0d8b0] border-2 border-black flex items-center justify-center font-black text-xs text-slate-950 shadow-sm cursor-pointer mt-2"
              >
                حفظ
              </button>
            </div>

            {/* جدول المبيعات الرئيسي (DataWindow Grid dw_3) */}
            <div className="flex-1 border-2 border-slate-700 bg-[#3d7070] shadow-xl p-1 flex flex-col overflow-hidden min-h-[390px]">
              
              {/* شريط معلومات الجدول العلوي */}
              <div className="text-[11px] font-bold text-white px-2 py-0.5 bg-[#2c5353] border-b border-teal-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>DataWindow dw_3: {activeMode === 'w_fatora_f_mahel' ? 'مبيعات مشتريات المحل' : 'مبيعات النقلة (شاشة 7-1)'}</span>
                  <span className="text-[10px] bg-amber-300 text-slate-950 font-bold px-1.5 py-0.2 rounded border border-amber-500 shadow-2xs" title="البياعة والرهن لا تظهران في الجدول، بل يُضربان في العدد ويُضافان لمبلغ الإجمالي آلياً">
                    البياعة والرهن مخفيان ومدمجان بالإجمالي آلياً
                  </span>
                </span>
                <div className="flex items-center gap-3 text-teal-200 font-mono text-[11px]">
                  <span>السطر المحدد: {selectedRowIndex + 1} من {rows.length}</span>
                  <span>|</span>
                  <span>إجمالي البيع: {totalAmountToday.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* جدول البيانات الرئيسي dw_3 */}
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#cfd3db] text-slate-900 font-bold border-b border-slate-500 text-[11px] whitespace-nowrap">
                      <th className="py-1 px-1 border border-slate-400 w-7">م</th>
                      <th className="py-1 px-1 border border-slate-400 w-12">م/وزن</th>
                      <th className="py-1 px-1 border border-slate-400 w-14">عدد</th>
                      <th className="py-1 px-1 border border-slate-400 w-14 bg-amber-100 text-amber-950 font-black">كود صنف</th>
                      <th className="py-1 px-2 border border-slate-400 min-w-[150px] bg-blue-100 text-blue-950 font-black">الصنف</th>
                      <th className="py-1 px-1 border border-slate-400 w-24">وحدة البيع</th>
                      <th className="py-1 px-1 border border-slate-400 w-16 bg-emerald-100 text-emerald-950 font-black">ك.قائم 🟢</th>
                      <th className="py-1 px-1 border border-slate-400 w-14 bg-emerald-50 text-emerald-900 font-black">سماح</th>
                      <th className="py-1 px-1 border border-slate-400 w-16 bg-slate-200">ك.صافي</th>
                      <th className="py-1 px-1 border border-slate-400 w-16">السعر</th>
                      <th className="py-1 px-1 border border-slate-400 w-24 bg-amber-200 text-slate-950 font-black">الاجمالي</th>
                      <th className="py-1 px-1 border border-slate-400 w-10">نقدي</th>
                      <th className="py-1 px-1 border border-slate-400 w-14 bg-amber-100 text-amber-950 font-black">كود عميل</th>
                      <th className="py-1 px-2 border border-slate-400 min-w-[150px] bg-blue-100 text-blue-950 font-black">الزبون</th>
                      <th className="py-1 px-1 border border-slate-400 w-20">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => {
                      const isSelected = selectedRowIndex === idx;
                      const isCatInNakla = displayCats.some(c => c.cat_id === row.catId);
                      return (
                        <tr
                          key={row.tempId || `fatora_grid_row_${row.rowNum}_${idx}`}
                          onClick={() => setSelectedRowIndex(idx)}
                          className={`border-b border-[#2c5353] font-bold transition-colors ${
                            isSelected
                              ? 'bg-[#000080] text-white'
                              : 'bg-[#3d7070] text-white hover:bg-[#4d8585]'
                          }`}
                        >
                          {/* 1. م (رقم السطر) */}
                          <td className="p-0.5 border border-[#2c5353] font-mono text-center">
                            {row.rowNum}
                          </td>

                          {/* 2. م/وزن (متوسط وزن العبوة) */}
                          <td className="p-0.5 border border-[#2c5353] font-mono text-center text-teal-200">
                            {row.avgWeight > 0 ? row.avgWeight.toFixed(2) : ''}
                          </td>

                          {/* 4. عدد (sobata_num) */}
                          <td className="p-0.5 border border-[#2c5353]">
                            <input
                              type="number"
                              value={row.count || ''}
                              onChange={e => handleItemChanged(idx, 'sobata_num', e.target.value)}
                              className="w-full bg-[#1c3e3e] focus:bg-[#000080] text-center border border-teal-500/60 focus:border-amber-300 outline-none font-mono font-bold text-white py-0.5"
                              placeholder="0"
                            />
                          </td>

                          {/* 5. كود الصنف (cat_id) - إدخاله يحدد اسم الصنف تلقائياً وإذا مش بالنقلة يديني تنبيه */}
                          <td className="p-0.5 border border-[#2c5353] bg-[#224444] w-14">
                            <input
                              type="number"
                              value={row.catId || ''}
                              onChange={e => handleItemChanged(idx, 'cat_id', e.target.value)}
                              className={`w-full bg-[#183636] focus:bg-[#000080] text-center border outline-none font-mono font-extrabold text-amber-300 text-xs py-0.5 ${
                                !isCatInNakla && row.catId > 0
                                  ? 'border-amber-400 bg-amber-950/40'
                                  : 'border-amber-500/70 focus:border-amber-300'
                              }`}
                              placeholder="كود"
                              title="كود الصنف - أدخل الكود لتحميل اسم الصنف وحساباته، وينبهك لو مش بالنقلة"
                            />
                          </td>

                          {/* 6. اسم الصنف (cat_name) - قائمة منسدلة بالأصناف للاختيار المباشر مع تنبيه للأصناف الخارجة عن النقلة */}
                          <td className="p-0.5 border border-[#2c5353] min-w-[150px]">
                            <select
                              value={row.catName}
                              onChange={e => handleItemChanged(idx, 'cat_name', e.target.value)}
                              className={`w-full bg-[#1c3e3e] focus:bg-[#000080] text-white border outline-none text-xs font-bold py-0.5 px-1 cursor-pointer ${
                                !isCatInNakla && row.catId > 0
                                  ? 'border-amber-400 text-amber-200'
                                  : 'border-teal-500/70 focus:border-amber-300'
                              }`}
                              title="اختر الصنف من القائمة المنسدلة"
                            >
                              <option value="" disabled>-- اختر الصنف --</option>
                              <optgroup label="📦 أصناف هذه النقلة (dw_5)">
                                {displayCats.map((c, cIdx) => (
                                  <option key={`nakla_${c.cat_id}_${c.id}_${cIdx}`} value={c.cat_name} className="text-black bg-white font-bold">
                                    كود {c.cat_id} - {c.cat_name} (مستلم: {c.cat_number} - رهن: {c.pack_rahn})
                                  </option>
                                ))}
                              </optgroup>
                              {otherCats.length > 0 && (
                                <optgroup label="⚠️ أصناف أخرى بالنظام (غير مسجلة بالنقلة)">
                                  {otherCats.map((c, cIdx) => (
                                    <option key={`other_${c.cat_code}_${c.id}_${cIdx}`} value={c.cat_name} className="text-amber-900 bg-amber-50">
                                      كود {c.cat_code} - {c.cat_name} (غير بالنقلة ⚠️)
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {row.catName &&
                                !displayCats.some(c => c.cat_name === row.catName) &&
                                !otherCats.some(c => c.cat_name === row.catName) && (
                                  <option value={row.catName} className="text-rose-700 bg-rose-50">
                                    {row.catName} (يدوي غير بالنقلة ⚠️)
                                  </option>
                                )}
                            </select>
                          </td>

                          {/* 7. وحدة البيع (package_unit) */}
                          <td className="p-0.5 border border-[#2c5353]">
                            <select
                              value={row.unit || 'كيلو'}
                              onChange={e => handleItemChanged(idx, 'package_unit', e.target.value)}
                              className="w-full bg-[#1c3e3e] focus:bg-[#000080] text-center border border-teal-500/60 outline-none text-[11px] text-white py-0.5 font-bold"
                              title="اختر وحدة البيع / العبوة من تسجيل الرهن"
                            >
                              <option value="كيلو" className="text-black bg-white font-bold">كيلو</option>
                              <option value="عدد" className="text-black bg-white font-bold">عدد</option>
                              {db.pack_rahns.map((p, pIdx) => (
                                <option key={`pack_rahn_${p.id || p.pack_name}_${pIdx}`} value={p.pack_name} className="text-black bg-white font-bold">
                                  {p.pack_name} (رهن: {p.pack_rahn})
                                </option>
                              ))}
                              {!db.pack_rahns.some(p => p.pack_name === row.unit) && row.unit && row.unit !== 'كيلو' && row.unit !== 'عدد' && (
                                <option value={row.unit} className="text-black bg-white font-bold">{row.unit}</option>
                              )}
                            </select>
                          </td>

                          {/* 8. ك.قائم (t_weight) - مفتوحة تماماً وغير مقفولة */}
                          <td className="p-0.5 border border-[#2c5353] bg-[#1a4242] w-16">
                            <input
                              type="number"
                              step="any"
                              value={row.tWeight === 0 ? '' : row.tWeight}
                              onChange={e => handleItemChanged(idx, 't_weight', e.target.value)}
                              className="w-full bg-[#102d2d] focus:bg-[#000080] text-center border border-emerald-400 focus:border-amber-300 outline-none font-mono font-black text-white text-xs py-0.5 placeholder:text-slate-400"
                              placeholder="0"
                              title="الوزن الإجمالي القائم (مفتوحة للإدخال المباشر)"
                            />
                          </td>

                          {/* 9. سماح (samah_weight) - مفتوحة تماماً وغير مقفولة */}
                          <td className="p-0.5 border border-[#2c5353] bg-[#1a4242] w-14">
                            <input
                              type="number"
                              step="any"
                              value={row.samah === 0 ? '' : row.samah}
                              onChange={e => handleItemChanged(idx, 'samah_weight', e.target.value)}
                              className="w-full bg-[#102d2d] focus:bg-[#000080] text-center border border-emerald-400/80 focus:border-amber-300 outline-none font-mono text-white text-xs py-0.5 placeholder:text-slate-400"
                              placeholder="0"
                              title="وزن السماح / الخصم والتفاوت (مفتوحة للإدخال المباشر)"
                            />
                          </td>

                          {/* 10. ك.صافي (net_weight) - محسوب تلقائياً = t_weight - samah_weight */}
                          <td className="p-0.5 border border-[#2c5353] font-mono text-center text-teal-100 font-bold bg-[#1d3d3d]">
                            {row.netWeight > 0 ? row.netWeight : (row.tWeight > 0 ? row.tWeight : '0')}
                          </td>

                          {/* 11. السعر (price) */}
                          <td className="p-0.5 border border-[#2c5353]">
                            <input
                              type="number"
                              step="0.25"
                              value={row.price || ''}
                              onChange={e => handleItemChanged(idx, 'price', e.target.value)}
                              className="w-full bg-[#1c3e3e] focus:bg-[#000080] text-center border border-teal-500/60 focus:border-amber-300 outline-none font-mono font-bold text-amber-300 py-0.5"
                              placeholder="0.00"
                            />
                          </td>

                          {/* 13. الاجمالي (totally) - صافي الزرع (tota مضافاً إليه البياعة المحسوبة بالعدد) + مبلغ الرهن (t_rahn) */}
                          <td
                            className="p-0.5 border border-[#2c5353] font-mono text-center font-extrabold text-amber-200 bg-[#2b4c4c] cursor-help"
                            title={`تفاصيل الحساب:\n• صافي الزرع: (${row.netWeight > 0 ? `${row.netWeight} كجم` : `${row.count} عدد`} × ${row.price} ج = ${((row.netWeight > 0 ? row.netWeight : row.count) * (row.price || 0)).toLocaleString()} ج)\n• بياعة مدمجة: (${row.count} عدد × ${(row.count > 0 && row.byaaa ? (row.byaaa / row.count).toFixed(2) : 0)} ج = ${(row.byaaa || 0).toLocaleString()} ج)\n• رهن مدمج: (${row.count} عدد × ${(row.rahn || 0)} ج = ${(row.tRahn || 0).toLocaleString()} ج)\n= الإجمالي الكلي: ${(row.totally || 0).toLocaleString()} ج`}
                          >
                            {showPrices ? (row.totally ? row.totally.toLocaleString() : '0') : '***'}
                          </td>

                          {/* 15. نقدي (cash) */}
                          <td className="p-0.5 border border-[#2c5353] text-center">
                            <input
                              type="checkbox"
                              checked={row.isCash}
                              onChange={e => handleItemChanged(idx, 'cash', e.target.checked)}
                              className="w-3.5 h-3.5 cursor-pointer accent-teal-600"
                            />
                          </td>

                          {/* 16. كود الزبون (customer_code) - إدخاله يجلب اسم العميل ويفحص حالة المجاملة */}
                          <td className="p-0.5 border border-[#2c5353] bg-[#224444] w-14">
                            <input
                              type="number"
                              value={row.custCode || ''}
                              onChange={e => handleItemChanged(idx, 'customer_code', e.target.value)}
                              className="w-full bg-[#183636] focus:bg-[#000080] text-center border border-amber-500/70 focus:border-amber-300 outline-none font-mono font-extrabold text-amber-300 text-xs py-0.5"
                              placeholder="كود"
                              title="كود العميل (customer_code) - اكتب الكود لتحميل اسم العميل وبياعته آلياً"
                            />
                          </td>

                          {/* 17. الزبون (customer_name) - قائمة منسدلة بالعملاء للاختيار المباشر */}
                          <td className="p-0.5 border border-[#2c5353] min-w-[150px]">
                            <select
                              value={row.custName || 'نقدي'}
                              onChange={e => handleItemChanged(idx, 'customer_name', e.target.value)}
                              className="w-full bg-[#1c3e3e] focus:bg-[#000080] text-white border border-teal-500/70 focus:border-amber-300 outline-none text-xs font-bold py-0.5 px-1 cursor-pointer"
                              title="اختر العميل من القائمة المنسدلة أو اكتب كوده في خانة كود عميل"
                            >
                              <option value="نقدي" className="text-emerald-800 bg-emerald-50 font-bold">1 - نقدي (كاش)</option>
                              <optgroup label="👥 قائمة العملاء والتجار">
                                {db.customers.map((c, cIdx) => (
                                  <option key={`cust_opt_${c.customer_id}_${c.customer_code}_${cIdx}`} value={c.customer_name} className="text-slate-900 bg-white font-medium">
                                    كود {c.customer_code} - {c.customer_name} {c.special ? `★ (خاص - بياعة: ${c.byaaa_c_s ?? 8} ج)` : ''}
                                  </option>
                                ))}
                              </optgroup>
                              {row.custName &&
                                row.custName !== 'نقدي' &&
                                !db.customers.some(c => c.customer_name === row.custName) && (
                                  <option value={row.custName} className="text-amber-800 bg-amber-50">
                                    {row.custName} (غير مسجل)
                                  </option>
                                )}
                            </select>
                          </td>

                          {/* 18. التاريخ (trans_date) */}
                          <td className="p-0.5 border border-[#2c5353]">
                            <input
                              type="text"
                              value={row.transDate}
                              onChange={e => handleItemChanged(idx, 'trans_date', e.target.value)}
                              className="w-full bg-transparent text-center border-0 outline-none font-mono text-[10px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* صناديق الإجماليات الثلاثية أسفل الجدول المطابقة للصورة 1 و 2 */}
              <div className="mt-auto pt-2 border-t border-teal-900 bg-[#3d7070] flex items-center justify-between px-4 pb-2">
                
                {/* صندوق متوسط وزن في أقصى اليسار */}
                <div className="flex flex-col items-center">
                  <div className="bg-[#d4d0c8] border border-slate-600 px-3 py-0.5 text-center text-xs font-bold text-slate-900 w-28">
                    متوسط وزن
                  </div>
                  <div className="w-28 bg-white border border-slate-600 py-0.5 text-center font-mono font-bold text-xs text-slate-900">
                    {weightedAvgWeight}
                  </div>
                </div>

                {/* كروت التسميات: اجمالي سابق / اجمالي اليوم / اجمالي كلي */}
                <div className="flex flex-col gap-1">
                  <div className="bg-[#d4d0c8] border border-slate-600 px-3 py-0.5 text-center text-xs font-bold text-slate-900 w-28">
                    اجمالي سابق
                  </div>
                  <div className="bg-[#d4d0c8] border border-slate-600 px-3 py-0.5 text-center text-xs font-bold text-slate-900 w-28">
                    اجمالي اليوم
                  </div>
                  <div className="bg-[#d4d0c8] border border-slate-600 px-3 py-0.5 text-center text-xs font-bold text-slate-900 w-28">
                    اجمالي كلي
                  </div>
                </div>

                {/* صناديق مبالغ الإجمالي (عمود الاجمالي) */}
                <div className="flex flex-col gap-1">
                  <div className="w-24 bg-white border border-slate-600 py-0.5 text-center font-mono font-bold text-xs text-slate-900">
                    {prevAmount.toLocaleString()}
                  </div>
                  <div className="w-24 bg-white border border-slate-600 py-0.5 text-center font-mono font-bold text-xs text-slate-900">
                    {totalAmountToday.toLocaleString()}
                  </div>
                  <div className="w-24 bg-white border border-slate-600 py-0.5 text-center font-mono font-bold text-xs text-slate-900">
                    {grandAmount.toLocaleString()}
                  </div>
                </div>

                {/* شبكة صناديق الأوزان الثلاثية (ك.صافي / سماح / ك.قائم) */}
                <div className="grid grid-cols-3 gap-1">
                  {/* صف 1: اجمالي سابق */}
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{prevNetWeight}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{prevSamah}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{prevTWeight}</div>

                  {/* صف 2: اجمالي اليوم */}
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{totalNetWeightToday}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{totalSamahToday}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{totalTWeightToday}</div>

                  {/* صف 3: اجمالي كلي */}
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{grandNetWeight}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{grandSamah}</div>
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs">{grandTWeight}</div>
                </div>

                {/* صندوق إجمالي العدد تحت عمود عدد */}
                <div className="flex flex-col gap-1">
                  <div className="w-16 bg-white border border-slate-600 py-0.5 text-center font-mono text-xs font-bold">
                    {grandCount}
                  </div>
                </div>

                {/* ملخص البياعة والرهن */}
                <div className="flex flex-col gap-1 text-[10.5px]">
                  <div className="bg-teal-900 text-teal-200 px-2 py-0.5 border border-teal-700 font-mono">
                    بياعة: {totalByaaaToday.toLocaleString()} ج
                  </div>
                  <div className="bg-teal-900 text-emerald-300 px-2 py-0.5 border border-teal-700 font-mono">
                    رهن: {totalRahnToday.toLocaleString()} ج
                  </div>
                </div>

              </div>
            </div>

            {/* أزرار الحذف والطباعة على يسار الجدول */}
            <div className="flex flex-col items-center gap-2 pt-6 shrink-0">
              <button
                type="button"
                onClick={handleRemoveRow}
                title="حذف السطر (سلة المهملات)"
                className="w-9 h-9 bg-white hover:bg-rose-50 active:bg-rose-100 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center text-rose-600 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-5 h-5 text-rose-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onPrintFatora && rows.length > 0) {
                    const sample = rows[0];
                    onPrintFatora({
                      id: sample.id || 1,
                      nakla_id: currentNakla.nakla_id,
                      nakla_name: currentNakla.nakla_name,
                      sup_name: currentNakla.sup_name,
                      farm_name: currentNakla.farm_name,
                      cat_id: sample.catId,
                      cat_name: sample.catName,
                      package_unit: sample.unit,
                      sobata_num: sample.count,
                      t_weight: sample.tWeight,
                      samah_weight: sample.samah,
                      net_weight: sample.netWeight,
                      price: sample.price,
                      totally: sample.totally,
                      byaaa: sample.byaaa,
                      rahn_case: sample.rahnCase === 1,
                      rahn: sample.rahn,
                      t_rahn: sample.tRahn,
                      tota: sample.tota,
                      cash: sample.isCash,
                      customer_name: sample.custName,
                      customer_code: sample.custCode,
                      trans_date: sample.transDate
                    });
                  } else {
                    window.print();
                  }
                }}
                title="طباعة"
                className="w-9 h-9 bg-white hover:bg-slate-100 active:bg-slate-200 border-2 border-t-white border-l-white border-b-slate-700 border-r-slate-700 flex items-center justify-center text-slate-800 shadow-sm cursor-pointer"
              >
                <Printer className="w-5 h-5 text-slate-800" />
              </button>
            </div>

          </div>

        </div>

        {/* 4. شريط الحالة السفلي الكلاسيكي */}
        <div className="h-6 bg-[#cfd3db] border-t border-[#808080] px-2 flex items-center justify-between text-[11px] text-slate-800 font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
            <span className="font-sans font-bold">
              {activeMode === 'w_fatora_f_mahel'
                ? 'جاهز (Ready) | مبيعات مشتريات المحل'
                : `جاهز (Ready) | مبيعات النقلة: ${currentNakla.nakla_name} (سكربت PowerBuilder dw_3 جاهز ومفعل بالكامل)`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>DataWindows: [dw_3: Grid] [dw_5: Nakla Items]</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">NUM</span>
            <span className="bg-[#d4d0c8] px-1 border border-[#808080]">CAPS</span>
          </div>
        </div>

      </div>
    </div>
  );
};
