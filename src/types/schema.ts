/**
 * تعريفات الكيانات والجداول مطابقة لقاعدة بيانات fruit67 ونظام PowerBuilder
 */

// 1. بيانات الشركة / الوكالة (company_data / tbl_company)
export interface CompanyData {
  id: string;
  branch: string;
  comission: number; // مثلا 0.07 (7%)
  byaaa: number;     // رسم البياعة
  tanzil: number;    // أجرة التنزيل
  wahba: number;     // الوهبة (إكرامية السائق)
  tel: string;
}

// 2. الموردين (suppliers / tbl_suppliers)
export interface Supplier {
  sup_id: number;
  sup_name: string;
  sup_address: string;
  sup_mobile: string;
  sup_phone?: string; // اسم الحقل في SQL Server
  hold: boolean;
  suspended?: boolean; // اسم الحقل في SQL Server
  comission: number; // عمولة خاصة بالمورد إن وجدت
  current_balance?: number; // الرصيد الحالي
  rasseed?: number; // اسم الحقل في SQL Server
}

// 3. مزارع الموردين (farm / tbl_farms)
export interface Farm {
  farm_id: number;
  sup_name: string;
  farm_name: string;
  location?: string;
  hold: boolean;
  suspended?: boolean; // اسم الحقل في SQL Server
}

// 4. مصروفات المزارع (farm_exps / tbl_farm_exps)
export interface FarmExp {
  id: number;
  sup_name: string;
  farm_name: string;
  exp_name: string;
  exp_amount: number;
  trans_date: string;
  descrip: string;
}

// 5. الأصناف (category / tbl_categories)
export interface Category {
  id: number;
  cat_id?: number; // اسم الحقل في SQL Server
  cat_code: number;
  cat_name: string;
  byaaa: number;       // نسبة/قيمة البياعة
  byaaa_s: number;     // بياعة ثانوية
  hold: boolean;
  suspended?: boolean; // اسم الحقل في SQL Server
  package_unit?: string;
  default_price?: number;
}

// 6. الفوارغ والرهن (package_unit & pack_rahn / tbl_package_units & tbl_pack_rahn)
export interface PackageUnit {
  id: number;
  package_unit: string; // قفص، برنيكة، كرتونة، شوال، سبيطة
  default_tare_weight?: number; // وزن الفارغ التقريبي
}

export interface PackRahn {
  id: number;
  pack_name: string;
  pack_rahn: number; // قيمة رهن الفارغ الواحد بالجنيه
}

// 6.1 محلات الكراتين ومستلزمات التعبئة (dw_package_sups / tbl_boxes_stores)
export interface PackageShop {
  shop_id: number;
  store_id?: number; // اسم الحقل في SQL Server
  shop_code: number;
  shop_name: string;
  store_name?: string;
  address?: string;
  store_address?: string; // اسم الحقل في SQL Server
  mobile?: string;
  store_phone?: string; // اسم الحقل في SQL Server
  initial_balance?: number;
  current_balance?: number;
  balance?: number; // اسم الحقل في SQL Server
  notes?: string;
}

// 6.2 مسميات مستلزمات التعبئة (dw_package_exp_name / tbl_package_exp_items)
export interface PackageExpenseItem {
  item_id: number;
  item_code: number;
  item_name: string;
  tare_weight?: number;
  unit_price?: number;
  default_rahn?: number;
  hold?: boolean;
}

// 6.3 مسحوبات محلات الكراتين (dw_package_sup_sahb / tbl_package_withdrawals)
export interface PackageShopWithdrawal {
  trans_id: number;
  trans_code: number;
  trans_date: string;
  shop_name: string;
  amount: number;
  pay_type: string;
  doc_no?: string;
  notes?: string;
}

// 6.4 صرف الكراتين للموردين (dw_kratin_sup_sahb2 / tbl_package_disbursements)
export interface PackageDisbursementItem {
  id?: number;
  item_name: string;
  shop_name?: string;
  qty: number;
  unit_price: number;
  total_amount: number;
}

export interface PackageDisbursement {
  disb_id: number;
  id?: number; // اسم الحقل في SQL Server
  disb_code: number;
  trans_date: string;
  sup_name: string;
  farm_name?: string;
  pack_name: string;
  shop_name?: string; // محل الكراتين المصروف منه
  qty: number;
  unit_price: number;
  total_amount: number;
  nakla_name?: string;
  deducted_from_nakla?: boolean; // هل تم الخصم على النقلة أم معلق على حساب المورد
  items?: PackageDisbursementItem[]; // جدول المستلزمات الصغير
  notes?: string;
}

// 7. النقلة / رأس الشحنة (nakla / tbl_naklat)
export interface Nakla {
  nakla_id: number;
  nakla_number: number;
  sup_id?: number;
  sup_name: string;
  farm_name: string;
  nakla_name: string; // الاسم التعريفي للنقلة (مثل: نقلة طماطم البحيرة 1)
  nakla_weight: number; // الوزن المقدر بالكيلو
  sobata_number: number; // عدد السوابيط (للموز) أو عدد العبوات
  nakla_date: string;
  date_nakla?: string; // اسم الحقل في SQL Server
  comission: number; // نسبة العمولة لهذه النقلة
  byaaa: number;
  tanzil: number;
  wahba: number;
  driver_name?: string;
  truck_plate?: string;
  nakla_finish: boolean; // هل تم اكتمال بيع النقلة؟
  nakla_sarf: boolean;   // هل تم تصفية وصرف مستحقات النقلة للمورد؟
  printed: boolean;      // هل طُبعت التصفية؟
}

// 8. تفاصيل أصناف النقلة (nakla_cat)
export interface NaklaCat {
  id: number;
  nakla_id: number;
  nakla_name: string;
  sup_name: string;
  farm_name: string;
  cat_id: number;
  cat_name: string;
  cat_number: number;  // عدد العبوات / الأقفاص
  cat_weight?: number; // إجمالي الوزن المستلم كجم
  cat_byaaa: number;
  cat_byaaa_s: number;
  pack_id: number;
  package_unit: string;
  pack_rahn: number;   // قيمة رهن الفارغ
  sold_weight?: number; // الوزن المباع حتى الآن
  sold_packages?: number; // العبوات المباعة حتى الآن
}

// 9. مصروفات النقلة الإضافية (nakla_exps)
export interface NaklaExp {
  id: number;
  nakla_id?: number;
  nakla_name: string;
  exp_name: string; // نولون، ميزان بسكول، غفير، عتالة
  exp_amount: number;
  exp_date: string;
}

// 10. نقدية وسلف النقلة (nakla_nakdia)
export interface NaklaNakdia {
  id: number;
  nakla_id?: number;
  nakla_name: string;
  sup_name: string;
  farm_name: string;
  cash_advance: number; // سلفة نقدية على النقلة للسائق أو المورد
  dofaat: number;       // دفعات تحت الحساب
  farm_exp: string;
  farm_exp_amount: number;
  trans_date: string;
  sarf_khazina: boolean;
  any_new: number;
}

// 11. العملاء / التجار (customers / tbl_customers)
export interface Customer {
  customer_id: number;
  customer_code: number;
  customer_name: string;
  customer_address: string;
  address?: string; // اسم الحقل في SQL Server
  customer_mobile: string;
  mobile?: string; // اسم الحقل في SQL Server
  hold: boolean;
  suspended?: boolean; // اسم الحقل في SQL Server
  special: boolean;
  is_special?: boolean; // اسم الحقل في SQL Server
  byaaa_c_s: number;
  byaaa?: number; // اسم الحقل في SQL Server
  current_balance?: number; // الرصيد الآجل الحالي
  crates_balance?: number;  // رصيد الفوارغ المتبقية في ذمته
}

// 12. فاتورة بيع خضار وفاكهة عامة (fatora_f / tbl_fatora_f)
export interface FatoraF {
  id: number;
  nakla_id: number;
  nakla_name: string;
  sup_name: string;
  farm_name: string;
  cat_id: number;
  cat_name: string;
  package_unit: string;
  sobata_num: number;    // عدد العبوات / الأقفاص
  t_weight: number;      // الوزن الإجمالي (قائم) كجم
  samah_weight: number;  // وزن السماح (خصم الفارغ والتفاوت) كجم
  net_weight: number;    // الوزن الصافي = t_weight - samah_weight
  price: number;         // سعر الكيلو
  totally: number;       // قيمة البضاعة = net_weight * price
  byaaa: number;         // رسم البياعة
  rahn_case: boolean;    // هل تم احتساب رهن الفوارغ؟
  rahn: number;          // رهن الفارغ الواحد
  t_rahn: number;        // إجمالي الرهن = sobata_num * rahn
  tota: number;          // الإجمالي النهائي للفاتورة = totally + byaaa + t_rahn
  cash: boolean;         // 1 نقدي كاش ، 0 آجل شكك
  customer_name: string;
  customer_code: number;
  trans_date: string;
}

// 13. فاتورة بيع الموز (fatora / tbl_fatora_banana)
export interface FatoraBanana {
  id: number;
  nakla_id: number;
  nakla_name: string;
  sup_name: string;
  farm_name: string;
  sobata_num: number;    // عدد السوابيط
  banana_weight: number; // وزن الموز القائم
  safi_weight: number;   // الوزن الصافي
  free_wehigh: number;   // وزن السماح
  net_weight: number;    // الوزن المعتمد
  price: number;
  totally: number;
  cash: boolean;
  customer_name: string;
  trans_date: string;
}

// 14. تصفية النقلة وصافي المستحق للمورد (safi_fatora / tbl_safi_fatora)
export interface SafiFatora {
  id: number;
  nakla_id: number;
  nakla_name: string;
  sup_name: string;
  farm_name: string;
  egmaly: number;       // إجمالي مبيعات كل ما تم بيعه من النقلة
  comission: number;    // عمولة الوكالة المستقطعة
  tanzil: number;       // أجرة التنزيل
  wahba: number;        // الوهبة
  nakla_exps: number;   // مصروفات النقلة والنولون
  cash_advance: number; // السلفة النقدية
  dofaat: number;       // الدفعات المسددة
  farm_exp: number;     // مصروفات المزرعة
  any_new: number;      // أي خصومات مستجدة
  harsh: number;        // الهرش (كسر الميزان)
  fatora_add: number;   // إضافات الفاتورة
  safi_fatora: number;  // صافي الفاتورة المستحق للمورد
  sarf_khazina: boolean;// هل تم الصرف من الخزينة؟
  trans_date: string;
  printed: boolean;
}

// 15. دفتر الذمم والتحصيل والرهن (zemam / tbl_zemam)
export interface Zemam {
  id: number;
  nakla_id: number;
  nakla_name: string;
  customer_name: string;
  customer_code: number;
  zemam: number;         // المبلغ الآجل المسجل على العميل
  samah: number;         // خصم سماح ممنوح للعميل
  tahseel: number;       // المحصل نقداً من العميل
  safi_zemam: number;    // صافي المتبقي = zemam - samah - tahseel
  trans_date: string;
  last_update?: string;  // اسم الحقل في SQL Server
  rahn: number;          // رهن الفوارغ المستحق
  rahn_pay: number;      // رهن الفوارغ المسدد أو المسترد
  safi_rahn: number;     // صافي رهن الفوارغ المتبقي بذمته
  rahn_pay_type: boolean;// كاش أم آجل
  tota: number;
}

// 16. سندات التحصيل اليومي (tahseel record / tbl_tahseelat)
export interface TahseelRecord {
  id: number;
  customer_name: string;
  customer_code: number;
  amount: number;
  samah: number;
  payment_type: 'cash' | 'cheque' | 'transfer';
  trans_date: string;
  notes: string;
}

// 17. مصروفات الفرع اليومية (branch_exps / tbl_branch_exps)
export interface BranchExp {
  id: number;
  exp_name: string;
  exp_amount: number;
  date: string;
  notes?: string;
}

// 18. دليل بنود المصروفات (expenses & c_exps)
export interface ExpenseCategory {
  exp_id: number;
  exp_name: string;
}

// 19. مسحوبات الموردين (sup_sahb & sup_cashback / tbl_sup_sahb)
export interface SupSahb {
  sahb_id: number;
  sup_name: string;
  sup_credit: number; // المبلغ المسحوب
  trans_date: string;
  descrip: string;
}

export interface SupCashback {
  id: number;
  sup_name: string;
  sup_debit: number;  // المبلغ المردود للوكالة
  trans_date: string;
  descrip: string;
}

// 20. حركة الخزينة (khazna & khazina_debit / tbl_khazna)
export interface KhaznaTransaction {
  id: number;
  trans_type: 'in' | 'out'; // وارد أو صادر
  category: string;         // مبيعات، تحصيل ذمم، تصفية نقلة، مصروف فرع، سلفة
  amount: number;
  beneficiary: string;      // الجهة أو الاسم
  trans_date: string;
  notes: string;
  description?: string;     // اسم الحقل في SQL Server
}

// 21. تقفيل الوردية اليومية (takfeel)
export interface DailyClosing {
  id: number;
  close_date: string;
  total_cash_sales: number;
  total_tahseel: number;
  total_expenses: number;
  total_disbursements: number;
  net_cash_balance: number;
  closed_by: string;
  notes: string;
}

// 22. الشركاء (owners)
export interface Owner {
  code: number;
  name: string;
}

// 23. الموظفون (employees)
export interface Employee {
  code: number;
  name: string;
}

// 24. إيداعات الخزينة للشركاء (owner_deposits)
export interface OwnerDeposit {
  id: number;
  code: number;
  owner_name: string;
  amount: number;
  date: string;
}

// 25. مسحوبات الشركاء (owner_sahb)
export interface OwnerSahbRecord {
  id: number;
  code: number;
  owner_name: string;
  amount: number;
  date: string;
}

// 26. تسجيل مرتب موظف (employee_salary)
export interface EmployeeSalaryRecord {
  id: number;
  code: number;
  employee_name: string;
  amount: number;
  date: string;
}

// 27. مستخدمو النظام وكلمات المرور (users & password)
export interface AppUser {
  id: number;
  username: string;
  password: string;
  role?: string;
  created_at?: string;
}
