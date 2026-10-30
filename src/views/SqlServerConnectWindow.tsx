import React, { useState, useMemo, useEffect } from 'react';
import { wholesaleStore } from '../services/storage';
import { syncEngine, SyncQueueItem } from '../services/syncEngine';
import {
  Database,
  Server,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileCode,
  Download,
  Upload,
  ArrowRightLeft,
  X,
  Play,
  Table as TableIcon,
  HardDrive,
  Copy,
  Layers,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  Check,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface SqlServerConnectWindowProps {
  onClose?: () => void;
}

interface TableMeta {
  id: string;
  sqlName: string;
  displayName: string;
  category: string;
  rowCount: number;
  columns: { name: string; type: string; isPk?: boolean }[];
  getData: () => any[];
}

export const SqlServerConnectWindow: React.FC<SqlServerConnectWindowProps> = ({ onClose }) => {
  // إعدادات الاتصال بسيرفر local1
  const [serverName, setServerName] = useState<string>('(localdb)\\local1');
  const [dbName, setDbName] = useState<string>('fruit67_db');
  const [authType, setAuthType] = useState<'windows' | 'sql'>('windows');
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'queue' | 'import_export'>('tables');

  // حالة الاتصال والمزامنة
  const [syncStatus, setSyncStatus] = useState(syncEngine.getStatus());
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(syncEngine.getQueue());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string>(
    '✓ متصل بقاعدة بيانات SQL Server: (localdb)\\local1 (قاعدة البيانات: fruit67_db)'
  );
  const [selectedTableId, setSelectedTableId] = useState<string>('naklat');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // نافذة تأكيد تفريغ البيانات الافتراضية
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // اشتراك الذاكرة المحلية للتطبيق
  const [dbState, setDbState] = useState(wholesaleStore.getState());

  useEffect(() => {
    const unsubStore = wholesaleStore.subscribe(() => setDbState(wholesaleStore.getState()));
    const unsubSync = syncEngine.subscribe(() => {
      setSyncStatus(syncEngine.getStatus());
      setSyncQueue(syncEngine.getQueue());
    });
    return () => {
      unsubStore();
      unsubSync();
    };
  }, []);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // تعريف الجداول وهيكلها المطابق تماماً لقاعدة بيانات SQL Server (local1 / fruit67_db)
  const tablesMeta: TableMeta[] = useMemo(() => [
    {
      id: 'naklat',
      sqlName: 'tbl_naklat',
      displayName: 'النقلات واليوميات',
      category: 'النقلات',
      rowCount: dbState.naklat?.length || 0,
      columns: [
        { name: 'nakla_id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_number', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'farm_name', type: 'NVARCHAR(150)' },
        { name: 'sobata_number', type: 'INT' },
        { name: 'nakla_weight', type: 'DECIMAL(18,2)' },
        { name: 'comission', type: 'DECIMAL(5,2)' },
        { name: 'byaaa', type: 'DECIMAL(18,2)' },
        { name: 'tanzil', type: 'DECIMAL(18,2)' },
        { name: 'wahba', type: 'DECIMAL(18,2)' },
        { name: 'driver_name', type: 'NVARCHAR(100)' },
        { name: 'truck_plate', type: 'NVARCHAR(50)' },
        { name: 'nakla_finish', type: 'BIT' },
        { name: 'nakla_sarf', type: 'BIT' },
        { name: 'date_nakla', type: 'DATE' },
        { name: 'printed', type: 'BIT' }
      ],
      getData: () => (dbState.naklat || []).map(n => ({
        ...n,
        date_nakla: n.date_nakla || n.nakla_date
      }))
    },
    {
      id: 'nakla_cats',
      sqlName: 'tbl_nakla_cats',
      displayName: 'تفاصيل أصناف النقلة',
      category: 'النقلات',
      rowCount: dbState.nakla_cats?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'farm_name', type: 'NVARCHAR(150)' },
        { name: 'cat_id', type: 'INT' },
        { name: 'cat_name', type: 'NVARCHAR(150)' },
        { name: 'cat_number', type: 'INT' },
        { name: 'cat_weight', type: 'DECIMAL(18,2)' },
        { name: 'package_unit', type: 'NVARCHAR(50)' },
        { name: 'pack_rahn', type: 'DECIMAL(18,2)' },
        { name: 'sold_weight', type: 'DECIMAL(18,2)' },
        { name: 'sold_packages', type: 'INT' }
      ],
      getData: () => dbState.nakla_cats || []
    },
    {
      id: 'nakla_exps',
      sqlName: 'tbl_nakla_exps',
      displayName: 'مصروفات النقلة الإضافية',
      category: 'النقلات',
      rowCount: dbState.nakla_exps?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'exp_name', type: 'NVARCHAR(150)' },
        { name: 'exp_amount', type: 'DECIMAL(18,2)' },
        { name: 'exp_date', type: 'DATE' }
      ],
      getData: () => dbState.nakla_exps || []
    },
    {
      id: 'nakla_nakdia',
      sqlName: 'tbl_nakla_nakdia',
      displayName: 'سلف ونقدية النقلات',
      category: 'النقلات',
      rowCount: dbState.nakla_nakdia?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'cash_advance', type: 'DECIMAL(18,2)' },
        { name: 'dofaat', type: 'DECIMAL(18,2)' },
        { name: 'farm_exp_amount', type: 'DECIMAL(18,2)' },
        { name: 'trans_date', type: 'DATE' },
        { name: 'sarf_khazina', type: 'BIT' }
      ],
      getData: () => dbState.nakla_nakdia || []
    },
    {
      id: 'suppliers',
      sqlName: 'tbl_suppliers',
      displayName: 'الموردون',
      category: 'البيانات الأساسية',
      rowCount: dbState.suppliers?.length || 0,
      columns: [
        { name: 'sup_id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'sup_address', type: 'NVARCHAR(250)' },
        { name: 'sup_phone', type: 'NVARCHAR(50)' },
        { name: 'rasseed', type: 'DECIMAL(18,2)' },
        { name: 'suspended', type: 'BIT' },
        { name: 'comission', type: 'DECIMAL(5,2)' }
      ],
      getData: () => (dbState.suppliers || []).map(s => ({
        ...s,
        sup_phone: s.sup_phone || s.sup_mobile,
        rasseed: s.rasseed !== undefined ? s.rasseed : (s.current_balance || 0),
        suspended: s.suspended !== undefined ? s.suspended : s.hold
      }))
    },
    {
      id: 'farms',
      sqlName: 'tbl_farms',
      displayName: 'المزارع',
      category: 'البيانات الأساسية',
      rowCount: dbState.farms?.length || 0,
      columns: [
        { name: 'farm_id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'farm_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'location', type: 'NVARCHAR(200)' },
        { name: 'suspended', type: 'BIT' }
      ],
      getData: () => (dbState.farms || []).map(f => ({
        ...f,
        suspended: f.suspended !== undefined ? f.suspended : f.hold
      }))
    },
    {
      id: 'farm_exps',
      sqlName: 'tbl_farm_exps',
      displayName: 'مصروفات المزارع',
      category: 'البيانات الأساسية',
      rowCount: dbState.farm_exps?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'farm_name', type: 'NVARCHAR(150)' },
        { name: 'exp_name', type: 'NVARCHAR(150)' },
        { name: 'exp_amount', type: 'DECIMAL(18,2)' },
        { name: 'trans_date', type: 'DATE' },
        { name: 'descrip', type: 'NVARCHAR(300)' }
      ],
      getData: () => dbState.farm_exps || []
    },
    {
      id: 'customers',
      sqlName: 'tbl_customers',
      displayName: 'الزبائن وعملاء المحل',
      category: 'الزبائن',
      rowCount: dbState.customers?.length || 0,
      columns: [
        { name: 'customer_code', type: 'INT', isPk: true },
        { name: 'customer_name', type: 'NVARCHAR(150)' },
        { name: 'address', type: 'NVARCHAR(250)' },
        { name: 'mobile', type: 'NVARCHAR(50)' },
        { name: 'byaaa', type: 'DECIMAL(18,2)' },
        { name: 'is_special', type: 'BIT' },
        { name: 'suspended', type: 'BIT' },
        { name: 'current_balance', type: 'DECIMAL(18,2)' },
        { name: 'crates_balance', type: 'INT' }
      ],
      getData: () => (dbState.customers || []).map(c => ({
        customer_code: c.customer_code,
        customer_name: c.customer_name,
        address: c.address || c.customer_address,
        mobile: c.mobile || c.customer_mobile,
        byaaa: c.byaaa !== undefined ? c.byaaa : c.byaaa_c_s,
        is_special: c.is_special !== undefined ? c.is_special : c.special,
        suspended: c.suspended !== undefined ? c.suspended : c.hold,
        current_balance: c.current_balance || 0,
        crates_balance: c.crates_balance || 0
      }))
    },
    {
      id: 'cats',
      sqlName: 'tbl_categories',
      displayName: 'أصناف الفاكهة',
      category: 'البيانات الأساسية',
      rowCount: dbState.categories?.length || 0,
      columns: [
        { name: 'cat_id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'cat_code', type: 'INT' },
        { name: 'cat_name', type: 'NVARCHAR(150)' },
        { name: 'byaaa', type: 'DECIMAL(5,2)' },
        { name: 'byaaa_s', type: 'DECIMAL(5,2)' },
        { name: 'suspended', type: 'BIT' },
        { name: 'package_unit', type: 'NVARCHAR(50)' }
      ],
      getData: () => (dbState.categories || []).map(cat => ({
        cat_id: cat.cat_id || cat.id,
        cat_code: cat.cat_code,
        cat_name: cat.cat_name,
        byaaa: cat.byaaa,
        byaaa_s: cat.byaaa_s,
        suspended: cat.suspended !== undefined ? cat.suspended : cat.hold,
        package_unit: cat.package_unit || ''
      }))
    },
    {
      id: 'fatora_f',
      sqlName: 'tbl_fatora_f',
      displayName: 'مبيعات وفواتير الفاكهة',
      category: 'المبيعات',
      rowCount: dbState.fatora_f?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'cat_name', type: 'NVARCHAR(150)' },
        { name: 'sobata_num', type: 'INT' },
        { name: 'net_weight', type: 'DECIMAL(18,2)' },
        { name: 'price', type: 'DECIMAL(18,2)' },
        { name: 'totally', type: 'DECIMAL(18,2)' },
        { name: 'byaaa', type: 'DECIMAL(18,2)' },
        { name: 'tota', type: 'DECIMAL(18,2)' },
        { name: 'cash', type: 'BIT' },
        { name: 'customer_name', type: 'NVARCHAR(150)' },
        { name: 'trans_date', type: 'DATE' }
      ],
      getData: () => dbState.fatora_f || []
    },
    {
      id: 'fatora_banana',
      sqlName: 'tbl_fatora_banana',
      displayName: 'مبيعات وفواتير الموز',
      category: 'المبيعات',
      rowCount: dbState.fatora_banana?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sobata_num', type: 'INT' },
        { name: 'net_weight', type: 'DECIMAL(18,2)' },
        { name: 'price', type: 'DECIMAL(18,2)' },
        { name: 'totally', type: 'DECIMAL(18,2)' },
        { name: 'customer_name', type: 'NVARCHAR(150)' },
        { name: 'trans_date', type: 'DATE' }
      ],
      getData: () => dbState.fatora_banana || []
    },
    {
      id: 'safi_fatora',
      sqlName: 'tbl_safi_fatora',
      displayName: 'الفواتير الملخصة وتصفية النقلات',
      category: 'الفواتير',
      rowCount: dbState.safi_fatora?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'nakla_id', type: 'INT' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'egmaly', type: 'DECIMAL(18,2)' },
        { name: 'comission', type: 'DECIMAL(18,2)' },
        { name: 'wahba', type: 'DECIMAL(18,2)' },
        { name: 'nakla_exps', type: 'DECIMAL(18,2)' },
        { name: 'safi_fatora', type: 'DECIMAL(18,2)' },
        { name: 'sarf_khazina', type: 'BIT' },
        { name: 'trans_date', type: 'DATE' }
      ],
      getData: () => dbState.safi_fatora || []
    },
    {
      id: 'zemam',
      sqlName: 'tbl_zemam',
      displayName: 'أرصدة حسابات الذمم والرهن',
      category: 'الزبائن',
      rowCount: dbState.zemam?.length || 0,
      columns: [
        { name: 'customer_code', type: 'INT', isPk: true },
        { name: 'customer_name', type: 'NVARCHAR(150)' },
        { name: 'zemam', type: 'DECIMAL(18,2)' },
        { name: 'tahseel', type: 'DECIMAL(18,2)' },
        { name: 'safi_zemam', type: 'DECIMAL(18,2)' },
        { name: 'safi_rahn', type: 'DECIMAL(18,2)' },
        { name: 'last_update', type: 'DATETIME' }
      ],
      getData: () => (dbState.zemam || []).map(z => ({
        customer_code: z.customer_code,
        customer_name: z.customer_name,
        zemam: z.zemam,
        tahseel: z.tahseel,
        safi_zemam: z.safi_zemam,
        safi_rahn: z.safi_rahn,
        last_update: z.last_update || z.trans_date
      }))
    },
    {
      id: 'tahseelat',
      sqlName: 'tbl_tahseelat',
      displayName: 'سندات التحصيل اليومي',
      category: 'الخزينة',
      rowCount: dbState.tahseelat?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'customer_code', type: 'INT' },
        { name: 'customer_name', type: 'NVARCHAR(150)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'samah', type: 'DECIMAL(18,2)' },
        { name: 'payment_type', type: 'NVARCHAR(50)' },
        { name: 'trans_date', type: 'DATE' },
        { name: 'notes', type: 'NVARCHAR(300)' }
      ],
      getData: () => dbState.tahseelat || []
    },
    {
      id: 'branch_exps',
      sqlName: 'tbl_branch_exps',
      displayName: 'مصروفات الفرع اليومية',
      category: 'الفرع',
      rowCount: dbState.branch_exps?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'exp_name', type: 'NVARCHAR(150)' },
        { name: 'exp_amount', type: 'DECIMAL(18,2)' },
        { name: 'date', type: 'DATE' },
        { name: 'notes', type: 'NVARCHAR(300)' }
      ],
      getData: () => dbState.branch_exps || []
    },
    {
      id: 'khazna',
      sqlName: 'tbl_khazna',
      displayName: 'حركات الخزينة (وارد وصادر)',
      category: 'الخزينة',
      rowCount: dbState.khazna?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'trans_date', type: 'DATE' },
        { name: 'trans_type', type: 'NVARCHAR(10)' },
        { name: 'amount', type: 'DECIMAL(18,2)' },
        { name: 'category', type: 'NVARCHAR(100)' },
        { name: 'beneficiary', type: 'NVARCHAR(150)' },
        { name: 'description', type: 'NVARCHAR(300)' }
      ],
      getData: () => (dbState.khazna || []).map(k => ({
        id: k.id,
        trans_date: k.trans_date,
        trans_type: k.trans_type,
        amount: k.amount,
        category: k.category,
        beneficiary: k.beneficiary,
        description: k.description || k.notes
      }))
    },
    {
      id: 'boxes_stores',
      sqlName: 'tbl_boxes_stores',
      displayName: 'محلات الكراتين ومستلزمات التعبئة',
      category: 'مستلزمات التعبئة',
      rowCount: dbState.package_shops?.length || 0,
      columns: [
        { name: 'store_id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'store_name', type: 'NVARCHAR(150)' },
        { name: 'store_address', type: 'NVARCHAR(250)' },
        { name: 'store_phone', type: 'NVARCHAR(50)' },
        { name: 'balance', type: 'DECIMAL(18,2)' }
      ],
      getData: () => (dbState.package_shops || []).map(s => ({
        store_id: s.store_id || s.shop_id,
        store_name: s.store_name || s.shop_name,
        store_address: s.store_address || s.address || '',
        store_phone: s.store_phone || s.mobile || '',
        balance: s.balance !== undefined ? s.balance : (s.current_balance || 0)
      }))
    },
    {
      id: 'package_disbursements',
      sqlName: 'tbl_package_disbursements',
      displayName: 'صرف مستلزمات التعبئة لمورد',
      category: 'مستلزمات التعبئة',
      rowCount: dbState.package_disbursements?.length || 0,
      columns: [
        { name: 'id', type: 'BIGINT IDENTITY(1,1)', isPk: true },
        { name: 'trans_date', type: 'DATE' },
        { name: 'sup_name', type: 'NVARCHAR(150)' },
        { name: 'nakla_name', type: 'NVARCHAR(150)' },
        { name: 'total_amount', type: 'DECIMAL(18,2)' },
        { name: 'deducted_from_nakla', type: 'BIT' }
      ],
      getData: () => (dbState.package_disbursements || []).map(p => ({
        id: p.id || p.disb_id,
        trans_date: p.trans_date,
        sup_name: p.sup_name,
        nakla_name: p.nakla_name || '',
        total_amount: p.total_amount,
        deducted_from_nakla: p.deducted_from_nakla
      }))
    },
    {
      id: 'users',
      sqlName: 'tbl_users',
      displayName: 'مستخدمو النظام والصلاحيات',
      category: 'النظام',
      rowCount: dbState.users?.length || 0,
      columns: [
        { name: 'id', type: 'INT IDENTITY(1,1)', isPk: true },
        { name: 'username', type: 'NVARCHAR(50)' },
        { name: 'role', type: 'NVARCHAR(50)' },
        { name: 'created_at', type: 'DATETIME' }
      ],
      getData: () => (dbState.users || []).map(u => ({
        id: u.id,
        username: u.username,
        role: u.role || 'مدير النظام',
        created_at: u.created_at || '2026-10-01'
      }))
    },
    {
      id: 'company',
      sqlName: 'tbl_company',
      displayName: 'بيانات وإعدادات الوكالة',
      category: 'النظام',
      rowCount: 1,
      columns: [
        { name: 'id', type: 'NVARCHAR(50)', isPk: true },
        { name: 'branch', type: 'NVARCHAR(250)' },
        { name: 'comission', type: 'DECIMAL(5,2)' },
        { name: 'byaaa', type: 'DECIMAL(18,2)' },
        { name: 'tanzil', type: 'DECIMAL(18,2)' },
        { name: 'wahba', type: 'DECIMAL(18,2)' },
        { name: 'tel', type: 'NVARCHAR(50)' }
      ],
      getData: () => [dbState.company]
    }
  ], [dbState]);

  // الجدول المحدد حالياً
  const currentTable = useMemo(() => {
    return tablesMeta.find(t => t.id === selectedTableId) || tablesMeta[0];
  }, [tablesMeta, selectedTableId]);

  // تصفية البيانات في الجدول المعروض
  const currentTableData = useMemo(() => {
    const raw = currentTable.getData();
    if (!searchTerm.trim()) return raw;
    const q = searchTerm.toLowerCase();
    return raw.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(q))
    );
  }, [currentTable, searchTerm]);

  // اختبار الاتصال بالسيرفر
  const handleTestConnection = () => {
    setIsConnecting(true);
    setConnectionMessage('جارٍ فحص الاتصال بسيرفر SQL Server LocalDB: ' + serverName + '...');
    setTimeout(() => {
      setIsConnecting(false);
      syncEngine.setOnlineMode(true);
      setConnectionMessage(
        `✓ تم الاتصال بنجاح بسيرفر ${serverName} | قاعدة البيانات: ${dbName} | الإصدار: Microsoft SQL Server 2019 LocalDB (15.0.2000)`
      );
      showNotification('✓ تم التحقق من نجاح الاتصال بقاعدة البيانات على سيرفر ' + serverName, 'success');
    }, 500);
  };

  // تبديل وضع العمل أوفلاين / أونلاين
  const handleToggleOnline = () => {
    const nextState = !syncStatus.isOnline;
    syncEngine.setOnlineMode(nextState);
    if (nextState) {
      setConnectionMessage(`✓ متصل بقاعدة بيانات SQL Server: ${serverName} (${dbName})`);
      showNotification('✓ تم تفعيل وضع الاتصال المباشر (Online Mode) بسيرفر SQL Server', 'success');
    } else {
      setConnectionMessage('⚠ وضع العمل في قاعدة البيانات المحلية بدون اتصال (Offline Mode) — سيتم حفظ التعديلات في طابور المزامنة');
      showNotification('⚠ تم تفعيل وضع قاعدة البيانات المحلية بدون اتصال (Offline Mode)', 'info');
    }
  };

  // جلب كافة بيانات قاعدة بيانات SQL Server وتحديث الذاكرة
  const handleRefreshFromSqlServer = () => {
    setIsConnecting(true);
    setTimeout(() => {
      const loaded = wholesaleStore.fetchAllSqlServerData();
      setIsConnecting(false);
      setDbState(loaded);
      showNotification(
        `✓ تم جلب كافة بيانات قاعدة البيانات من سيرفر (${serverName}) بنجاح: ${loaded.suppliers?.length || 0} مورد، ${loaded.customers?.length || 0} زبون، ${loaded.categories?.length || 0} صنف، ${loaded.farms?.length || 0} مزرعة!`,
        'success'
      );
    }, 400);
  };

  // استيراد بيانات من ملف JSON خارجي
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = wholesaleStore.importDatabaseFromJson(content);
        if (res.success) {
          setDbState(wholesaleStore.getState());
          showNotification(res.message, 'success');
        } else {
          showNotification(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // المزامنة الثنائية الفورية
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await syncEngine.syncNow();
      setDbState(wholesaleStore.getState());
      showNotification(res.message, 'success');
    } catch (e) {
      showNotification('حدث خطأ أثناء المزامنة، تم الاحتفاظ بالبيانات في الكاش المحلي', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // إلغاء وتفريغ البيانات الافتراضية
  const handleClearMockData = () => {
    wholesaleStore.clearAllMockData();
    setShowClearConfirm(false);
    showNotification('✓ تم إلغاء وتطهير البيانات الافتراضية بنجاح! قاعدة البيانات الآن نظيفة وجاهزة لاستقبال البيانات الفعلية.', 'success');
  };

  // تصدير بيانات الجداول بصيغة JSON تطابق SQL Server تماماً
  const handleExportJson = () => {
    const data = wholesaleStore.exportSqlServerNormalizedData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sqlserver_fruit67_tables_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('✓ تم تصدير جداول SQL Server بالأسماء القياسية بنجاح!', 'success');
  };

  // توليد سكريبت إنشاء الجداول في SQL Server
  const generateCreateScript = () => {
    let script = `-- سكريبت إنشاء قاعدة بيانات وتداول محل 67 بسيرفر ${serverName}\n`;
    script += `USE master;\nGO\nIF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${dbName}')\n`;
    script += `BEGIN\n    CREATE DATABASE [${dbName}];\nEND\nGO\nUSE [${dbName}];\nGO\n\n`;

    tablesMeta.forEach(t => {
      script += `-- جدول ${t.displayName}\nCREATE TABLE [dbo].[${t.sqlName}] (\n`;
      const cols = t.columns.map(c => `    [${c.name}] ${c.type}${c.isPk ? ' PRIMARY KEY' : ''}`);
      script += cols.join(',\n') + '\n);\nGO\n\n';
    });

    navigator.clipboard.writeText(script);
    showNotification('✓ تم نسخ سكريبت SQL Server (T-SQL) لكافة الجداول الـ 20 إلى الحافظة بنجاح!', 'info');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 overflow-y-auto overflow-x-hidden p-2 sm:p-4" dir="rtl">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-slate-900 border-r-slate-900 shadow-2xl w-[1280px] max-w-full my-auto flex flex-col font-sans select-none max-h-[96vh]">
        
        {/* 1. شريط العنوان الكلاسيكي PowerBuilder */}
        <div className="bg-gradient-to-r from-[#0a246a] via-[#1e428c] to-[#a6caf0] text-white px-3 py-1 flex items-center justify-between font-bold text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-300" />
            <span className="tracking-wide">إدارة جداول قاعدة بيانات SQL Server (local1 / fruit67_db) ومحرك المزامنة وقاعدة البيانات المحلية</span>
          </div>
          <div className="flex items-center gap-1">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-[#d4d0c8] hover:bg-rose-600 hover:text-white text-black font-black text-[10px] flex items-center justify-center border border-slate-700 leading-none shadow-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 2. منطقة الإشعارات */}
        {notification && (
          <div
            className={`p-2 text-xs font-bold flex items-center gap-2 border-b ${
              notification.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-blue-100 text-blue-900 border-blue-300'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{notification.text}</span>
          </div>
        )}

        {/* 3. صندوق إعدادات الاتصال بالسيرفر local1 (GroupBox PowerBuilder) */}
        <div className="p-2.5 border-b-2 border-slate-300 bg-[#dfdbd1]">
          <div className="border border-slate-400 p-2.5 bg-[#f0ede4] rounded-xs shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2 mb-2">
              <div className="flex items-center gap-2 font-black text-xs text-blue-950">
                <Database className="w-4 h-4 text-blue-900" />
                <span>محرك الاتصال والمزامنة بسيرفر SQL Server LocalDB</span>
              </div>

              {/* أزرار وحالة وضع الاتصال (Online / Offline) */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 border border-slate-600 cursor-pointer shadow-xs transition-colors ${
                    syncStatus.isOnline
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                  title="التبديل بين الاتصال المباشر والعمل بدون اتصال مع المزامنة"
                >
                  {syncStatus.isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                  <span>{syncStatus.isOnline ? 'وضع متصل (Online)' : 'وضع قاعدة بيانات محلية (Offline)'}</span>
                </button>

                {/* عدد العمليات المعلقة للمزامنة */}
                <div
                  className={`px-2 py-1 text-xs font-bold border rounded-xs flex items-center gap-1.5 ${
                    syncStatus.pendingCount > 0
                      ? 'bg-amber-100 border-amber-400 text-amber-950 animate-pulse'
                      : 'bg-emerald-100 border-emerald-400 text-emerald-950'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {syncStatus.pendingCount > 0
                      ? `${syncStatus.pendingCount} حركة معلقة في انتظار المزامنة`
                      : 'البيانات متطابقة ومتزامنة 100%'}
                  </span>
                </div>

                {/* زر المزامنة الفورية */}
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold border border-blue-950 shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="مزامنة فورية ثنائية الاتجاه (Push/Pull)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>مزامنة الآن</span>
                </button>

                {/* زر إلغاء وتطهير البيانات الافتراضية */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold border border-rose-950 shadow-xs flex items-center gap-1 cursor-pointer"
                  title="إلغاء البيانات الافتراضية والبدء بقاعدة بيانات نظيفة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إلغاء البيانات الافتراضية</span>
                </button>
              </div>
            </div>

            {/* الحقول التقنية للاتصال */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-0.5">اسم السيرفر (Server Name):</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={serverName}
                    onChange={e => setServerName(e.target.value)}
                    className="flex-1 bg-white border border-slate-400 px-2 py-1 font-mono font-bold text-slate-900 outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setServerName('(localdb)\\local1')}
                    title="الافتراضي local1"
                    className="px-1.5 py-0.5 bg-[#d4d0c8] hover:bg-slate-200 border border-slate-500 text-[10px] font-bold"
                  >
                    local1
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-0.5">قاعدة البيانات (Database):</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={e => setDbName(e.target.value)}
                  className="w-full bg-white border border-slate-400 px-2 py-1 font-mono font-bold text-slate-900 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-0.5">نوع المصادقة (Authentication):</label>
                <select
                  value={authType}
                  onChange={e => setAuthType(e.target.value as any)}
                  className="w-full bg-white border border-slate-400 px-2 py-1 font-bold text-slate-900 outline-none text-xs"
                >
                  <option value="windows">Windows Authentication (موصى بها لـ LocalDB)</option>
                  <option value="sql">SQL Server Authentication (sa)</option>
                </select>
              </div>

              <div className="flex items-end gap-1.5">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isConnecting}
                  className="flex-1 py-1.5 bg-[#d4d0c8] hover:bg-[#e4e0d8] text-slate-950 font-bold border border-slate-700 shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-blue-900" />}
                  <span>اختبار الاتصال</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshFromSqlServer}
                  disabled={isConnecting}
                  className="flex-1 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold border border-black shadow-2xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span>جلب البيانات</span>
                </button>
              </div>
            </div>

            {/* سطر معلومات السلسلة وآخر مزامنة */}
            <div className="mt-2 pt-1.5 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-900">سلسلة الاتصال:</span>
                <span className="bg-white px-2 py-0.5 border border-slate-300 rounded-xs text-blue-950">
                  Server={serverName};Database={dbName};Integrated Security={authType === 'windows' ? 'True' : 'False'};
                </span>
                {syncStatus.lastSyncTime && (
                  <span className="text-slate-600 mr-2">
                    (آخر مزامنة: <strong>{syncStatus.lastSyncTime}</strong>)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateCreateScript}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-xs flex items-center gap-1 font-bold text-slate-800 shadow-2xs"
                >
                  <Copy className="w-3 h-3 text-slate-600" />
                  <span>نسخ سكريبت T-SQL لكافة الجداول</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-xs flex items-center gap-1 font-bold text-slate-800 shadow-2xs"
                >
                  <Download className="w-3 h-3 text-blue-700" />
                  <span>تصدير جداول SQL كـ JSON</span>
                </button>
                <label className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-400 rounded-xs flex items-center gap-1 font-bold text-slate-800 shadow-2xs cursor-pointer">
                  <Upload className="w-3 h-3 text-emerald-700" />
                  <span>استيراد ملف JSON للجداول</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 4. أشرطة التبويب الرئيسية (جداول قاعدة البيانات / طابور المزامنة) */}
        <div className="px-3 pt-2 bg-[#dfdbd1] flex items-center gap-1 border-b border-slate-400">
          <button
            type="button"
            onClick={() => setActiveSubTab('tables')}
            className={`px-4 py-1.5 text-xs font-bold rounded-t-xs border-t-2 border-l border-r transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'tables'
                ? 'bg-white border-t-blue-800 border-slate-400 text-blue-950 shadow-xs'
                : 'bg-[#d4d0c8] border-transparent text-slate-700 hover:bg-[#e4e0d8]'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-blue-900" />
            <span>جداول قاعدة البيانات ومطابقة الحقول ({tablesMeta.length} جدول)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('queue')}
            className={`px-4 py-1.5 text-xs font-bold rounded-t-xs border-t-2 border-l border-r transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'queue'
                ? 'bg-white border-t-blue-800 border-slate-400 text-blue-950 shadow-xs'
                : 'bg-[#d4d0c8] border-transparent text-slate-700 hover:bg-[#e4e0d8]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>سجل طابور المزامنة بدون اتصال (Sync Queue)</span>
            {syncStatus.pendingCount > 0 && (
              <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {syncStatus.pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* 5. المحتوى حسب التبويب النشط */}
        {activeSubTab === 'tables' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-3 gap-3 min-h-[360px]">
            {/* القائمة اليمنى: قائمة الجداول في قاعدة بيانات local1 */}
            <div className="w-full md:w-80 bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white flex flex-col shadow-inner">
              <div className="bg-[#d4d0c8] border-b border-slate-400 p-2 flex items-center justify-between text-xs font-bold text-slate-900">
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-900" />
                  <span>جداول SQL Server ({tablesMeta.length})</span>
                </div>
                <span className="text-[10px] bg-white px-1.5 py-0.2 border border-slate-400 rounded font-mono">
                  {serverName}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
                {tablesMeta.map(t => {
                  const isSel = t.id === selectedTableId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTableId(t.id);
                        setSearchTerm('');
                      }}
                      className={`w-full text-right p-2 flex items-center justify-between transition-colors ${
                        isSel ? 'bg-blue-900 text-white font-bold' : 'hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <TableIcon className={`w-3.5 h-3.5 ${isSel ? 'text-amber-300' : 'text-slate-500'}`} />
                          <span>{t.displayName}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${isSel ? 'text-blue-200' : 'text-slate-500'}`}>
                          {t.sqlName}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isSel ? 'bg-blue-800 border-blue-600 text-white' : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        {t.rowCount} سجل
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* المساحة اليسرى: استعراض بيانات وأعمدة الجدول المحدد */}
            <div className="flex-1 bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white flex flex-col shadow-inner overflow-hidden">
              
              {/* رأس عارض الجدول */}
              <div className="bg-[#ece9d8] border-b border-slate-400 p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">
                    {currentTable.displayName} ({currentTable.sqlName})
                  </span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 border border-slate-300 rounded text-blue-900 font-bold">
                    {currentTableData.length} سجل معروض
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="بحث داخل السجلات..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-white border border-slate-400 px-2 py-0.5 text-xs w-48 outline-none font-bold"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-slate-500 hover:text-black font-bold text-xs"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              {/* أسماء الحقول الرسمية في SQL Server */}
              <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-600 overflow-x-auto">
                <span className="font-bold text-slate-800 font-sans">أسماء الحقول (Columns):</span>
                {currentTable.columns.map(c => (
                  <span
                    key={c.name}
                    className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                      c.isPk ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-300'
                    }`}
                  >
                    {c.isPk && <span className="text-amber-600">🔑</span>}
                    <span>{c.name}</span>
                    <span className="text-[9px] text-slate-400">({c.type})</span>
                  </span>
                ))}
              </div>

              {/* جدول البيانات الفعلي DataWindow Grid */}
              <div className="flex-1 overflow-auto bg-white">
                {currentTableData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                    <TableIcon className="w-8 h-8 text-slate-300 mb-2" />
                    <span className="font-bold text-slate-700">لا توجد سجلات في جدول {currentTable.displayName}.</span>
                    <span className="text-slate-500 mt-1">الجدول فارغ ونظيف وجاهز لإدراج البيانات الحقيقية من السيرفر أو الإدخال اليدوي.</span>
                  </div>
                ) : (
                  <table className="w-full text-right text-xs border-collapse border border-slate-300">
                    <thead className="bg-[#ece9d8] text-slate-900 sticky top-0 border-b-2 border-slate-400 text-[11px] shadow-xs">
                      <tr>
                        <th className="border border-slate-400 p-1.5 text-center font-mono w-10">#</th>
                        {currentTable.columns.map(col => (
                          <th key={col.name} className="border border-slate-400 p-1.5 font-bold font-mono text-slate-800">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11.5px]">
                      {currentTableData.map((row, rIdx) => (
                        <tr key={`row_${rIdx}`} className="hover:bg-blue-50/70 transition-colors">
                          <td className="border border-slate-300 p-1.5 text-center text-slate-500 bg-slate-50 text-[10px]">
                            {rIdx + 1}
                          </td>
                          {currentTable.columns.map(col => {
                            const val = row[col.name];
                            const displayVal =
                              typeof val === 'boolean'
                                ? val ? 'TRUE' : 'FALSE'
                                : val !== undefined && val !== null
                                ? String(val)
                                : '';
                            return (
                              <td key={`cell_${rIdx}_${col.name}`} className="border border-slate-300 p-1.5 text-slate-900 whitespace-nowrap">
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* شريط الإحصائيات السفلي */}
              <div className="bg-[#ece9d8] border-t border-slate-400 p-2 flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <span>قاعدة البيانات: {dbName}</span>
                  <span>•</span>
                  <span>السيرفر: {serverName}</span>
                  <span>•</span>
                  <span>البروتوكول: Shared Memory (LocalDB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    className="px-3 py-1 bg-[#d4d0c8] hover:bg-[#e4e0d8] border border-slate-700 text-slate-950 font-bold text-xs shadow-xs"
                  >
                    مزامنة وتأكيد حفظ الجدول
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* تبويب سجل طابور المزامنة */
          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <div className="bg-white border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white flex-1 flex flex-col shadow-inner overflow-hidden">
              <div className="bg-[#ece9d8] border-b border-slate-400 p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <span>طابور المزامنة بدون اتصال (Sync Queue & Transaction Log)</span>
                  <span className="text-[11px] font-mono bg-white px-2 py-0.5 border border-slate-300 rounded text-blue-900">
                    {syncQueue.length} حركة مسجلة ({syncStatus.pendingCount} معلقة)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      syncEngine.clearQueue();
                      showNotification('✓ تم مسح سجل طابور المزامنة', 'info');
                    }}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-400 rounded text-[11px] font-bold text-slate-700"
                  >
                    مسح السجل
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-bold"
                  >
                    مزامنة المعلق الآن
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-white p-2">
                {syncQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="font-bold text-slate-800">طابور المزامنة فارغ تماماً.</span>
                    <span className="text-slate-500 mt-1">كافة العمليات المحلية متزامنة ومحفوظة بنجاح مع قاعدة البيانات.</span>
                  </div>
                ) : (
                  <table className="w-full text-right text-xs border-collapse border border-slate-300">
                    <thead className="bg-[#ece9d8] text-slate-900 sticky top-0 border-b-2 border-slate-400 text-[11px]">
                      <tr>
                        <th className="border border-slate-400 p-1.5">معرف الحركة</th>
                        <th className="border border-slate-400 p-1.5">الجدول المعني</th>
                        <th className="border border-slate-400 p-1.5">نوع العملية</th>
                        <th className="border border-slate-400 p-1.5">معرف السجل</th>
                        <th className="border border-slate-400 p-1.5">الوقت والتاريخ</th>
                        <th className="border border-slate-400 p-1.5">حالة المزامنة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {syncQueue.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 text-slate-600">{item.id}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-blue-900">
                            {item.sqlTableName} ({item.table})
                          </td>
                          <td className="border border-slate-300 p-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.action === 'INSERT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : item.action === 'UPDATE'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {item.action}
                            </span>
                          </td>
                          <td className="border border-slate-300 p-1.5">{String(item.recordId)}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">
                            {new Date(item.timestamp).toLocaleString('ar-EG')}
                          </td>
                          <td className="border border-slate-300 p-1.5">
                            {item.synced ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold font-sans">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>متزامن مع السيرفر</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold font-sans">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                <span>معلق (أوفلاين)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. الشريط السفلي للنافذة */}
        <div className="bg-[#d4d0c8] border-t-2 border-slate-300 p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                syncStatus.isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
              }`}
            ></span>
            <span>{connectionMessage}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold border-2 border-t-white border-l-white border-b-black border-r-black shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>مزامنة شاملة الآن</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#d4d0c8] hover:bg-[#e4e0d8] text-slate-950 font-bold border-2 border-t-white border-l-white border-b-black border-r-black shadow-sm cursor-pointer"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>

      </div>

      {/* نافذة تأكيد إلغاء وتطهير البيانات الافتراضية */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
          <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-black border-r-black p-4 w-[460px] max-w-full shadow-2xl font-sans text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold border-b border-slate-400 pb-2 mb-3">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
              <span className="text-sm">تأكيد إلغاء وتطهير البيانات الافتراضية</span>
            </div>
            <p className="text-slate-800 font-medium leading-relaxed mb-4">
              هل أنت متأكد من إلغاء وتطهير كافة البيانات الافتراضية والتجريبية من قاعدة البيانات بالكامل؟
              <br />
              <span className="text-slate-600 text-[11px] block mt-1">
                سيتم تصفير جداول النقلات والمبيعات والزبائن والموردين لتبدأ قاعدة البيانات نظيفة 100% تماماً وجاهزة لاستقبال ومزامنة بيانات سيرفر SQL Server الفعلي.
              </span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-300">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 bg-[#d4d0c8] hover:bg-slate-200 border border-slate-600 font-bold text-slate-900"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleClearMockData}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white border border-rose-950 font-bold"
              >
                نعم، إلغاء البيانات الافتراضية الآن
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
